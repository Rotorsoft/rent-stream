import { state, type Invariant } from "@rotorsoft/act";
import { randomUUID } from "crypto";
import { z } from "zod";
import * as schemas from "./schemas/index.js";

type RentalItemState = z.infer<typeof schemas.RentalItem>;
type SkuUnit = z.infer<typeof schemas.SkuUnit>;

// --- SKU Generation ---
export function generateSku(serialNumber: string, index: number): string {
  const paddedIndex = String(index).padStart(4, '0');
  return `${serialNumber}-${paddedIndex}`;
}

// --- Pricing Calculation ---
export function calculateDynamicPrice(
  basePrice: number,
  totalQuantity: number,
  availableQuantity: number,
  strategy: schemas.PricingStrategy
): number {
  if (totalQuantity === 0) return basePrice;

  const availabilityRatio = availableQuantity / totalQuantity;

  switch (strategy) {
    case schemas.PricingStrategy.Linear:
      return Math.round(basePrice * (1 + (1 - availabilityRatio)) * 100) / 100;

    case schemas.PricingStrategy.Exponential:
      const k = 1;
      return Math.round(basePrice * Math.exp(k * (1 - availabilityRatio)) * 100) / 100;

    case schemas.PricingStrategy.Tiered:
      if (availabilityRatio > 0.75) return basePrice;
      if (availabilityRatio > 0.5) return Math.round(basePrice * 1.25 * 100) / 100;
      if (availabilityRatio > 0.25) return Math.round(basePrice * 1.5 * 100) / 100;
      return Math.round(basePrice * 2 * 100) / 100;

    default:
      return basePrice;
  }
}

// --- Helper: Count available SKUs ---
const countAvailableSkus = (skus: SkuUnit[]): number =>
  skus.filter(s => s.status === schemas.SkuStatus.Available).length;

// --- 1. Domain Language (Helper Factories) ---
const rule = (description: string, valid: (s: RentalItemState) => boolean): Invariant<RentalItemState> => ({
  description,
  valid,
});

const Item = {
  mustBeAvailable: rule("Item must have available quantity", (s) => countAvailableSkus(s.skus) > 0),
  mustHaveRentals: rule("Item must have active rentals", (s) => s.activeRentals.length > 0),
  mustNotBeRetired: rule("Item must not be retired", (s) => s.status !== schemas.ItemStatus.Retired),
  mustHaveSufficientQuantity: (qty: number) =>
    rule(`Must have at least ${qty} available`, (s) => countAvailableSkus(s.skus) >= qty),
  mustHaveRental: (rentalId: string) =>
    rule(`Must have rental ${rentalId}`, (s) => s.activeRentals.some(r => r.rentalId === rentalId)),
  mustBe: (status: schemas.ItemStatus) => rule(`Item must be ${status}`, (s) => s.status === status),
};

// --- 2. Pure Domain Logic (State Transitions) ---
const updateStatusBasedOnAvailability = (skus: SkuUnit[], currentStatus: schemas.ItemStatus): schemas.ItemStatus => {
  if (currentStatus === schemas.ItemStatus.Retired) return schemas.ItemStatus.Retired;
  if (currentStatus === schemas.ItemStatus.Quarantined) return schemas.ItemStatus.Quarantined;
  if (currentStatus === schemas.ItemStatus.Maintenance) return schemas.ItemStatus.Maintenance;
  const available = countAvailableSkus(skus);
  return available > 0 ? schemas.ItemStatus.Available : schemas.ItemStatus.OutOfStock;
};

// --- 3. State Machine Definition ---
export const RentalItem = state("RentalItem", schemas.RentalItem)
  .init(() => ({
    id: "",
    name: "",
    serialNumber: "",
    category: schemas.ItemCategory.Other,
    status: schemas.ItemStatus.Available,
    condition: schemas.ItemCondition.New,
    skus: [],
    totalQuantity: 0,
    availableQuantity: 0,
    basePrice: 0,
    currentPrice: 0,
    pricingStrategy: schemas.PricingStrategy.Linear,
    activeRentals: [],
  }))
  .emits(schemas.events)

  // Define how Events mutate the State
  .patch({
    ItemCreated: ({ data }) => {
      const skus: SkuUnit[] = data.initialSkus.map(sku => ({
        sku,
        status: schemas.SkuStatus.Available,
        condition: data.initialCondition,
      }));

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        serialNumber: data.serialNumber,
        category: data.category,
        status: schemas.ItemStatus.Available,
        condition: data.initialCondition,
        skus,
        totalQuantity: skus.length,
        availableQuantity: skus.length,
        basePrice: data.basePrice,
        currentPrice: data.basePrice,
        pricingStrategy: data.pricingStrategy,
        imageUrl: data.imageUrl,
        activeRentals: [],
      };
    },

    ItemRented: ({ data }, prevState) => {
      // Mark the specific SKUs as rented
      const rentedSkuSet = new Set(data.skus);
      const updatedSkus = prevState.skus.map(s =>
        rentedSkuSet.has(s.sku)
          ? { ...s, status: schemas.SkuStatus.Rented }
          : s
      );

      const newAvailable = countAvailableSkus(updatedSkus);
      const newPrice = calculateDynamicPrice(
        prevState.basePrice,
        updatedSkus.length,
        newAvailable,
        prevState.pricingStrategy
      );

      return {
        skus: updatedSkus,
        availableQuantity: newAvailable,
        currentPrice: newPrice,
        status: newAvailable > 0 ? schemas.ItemStatus.Available : schemas.ItemStatus.OutOfStock,
        activeRentals: [
          ...prevState.activeRentals,
          {
            rentalId: data.rentalId,
            renterId: data.renterId,
            skus: data.skus,
            expectedReturnDate: data.expectedReturnDate,
          },
        ],
      };
    },

    ItemReturned: ({ data }, prevState) => {
      // Mark the returned SKUs as available
      const returnedSkuSet = new Set(data.skusReturned);
      const updatedSkus = prevState.skus.map(s =>
        returnedSkuSet.has(s.sku)
          ? { ...s, status: schemas.SkuStatus.Available }
          : s
      );

      const newAvailable = countAvailableSkus(updatedSkus);
      const newPrice = calculateDynamicPrice(
        prevState.basePrice,
        updatedSkus.length,
        newAvailable,
        prevState.pricingStrategy
      );

      const nextStatus = prevState.status === schemas.ItemStatus.Quarantined
        ? schemas.ItemStatus.Quarantined
        : (newAvailable > 0 ? schemas.ItemStatus.Available : schemas.ItemStatus.OutOfStock);

      return {
        skus: updatedSkus,
        availableQuantity: newAvailable,
        currentPrice: newPrice,
        status: nextStatus,
        activeRentals: prevState.activeRentals.filter(r => r.rentalId !== data.rentalId),
      };
    },

    SkusAdded: ({ data }, prevState) => {
      const newSkus: SkuUnit[] = data.skus.map(sku => ({
        sku,
        status: schemas.SkuStatus.Available,
        condition: prevState.condition,
      }));

      const allSkus = [...prevState.skus, ...newSkus];
      const newAvailable = countAvailableSkus(allSkus);
      const newPrice = calculateDynamicPrice(
        prevState.basePrice,
        allSkus.length,
        newAvailable,
        prevState.pricingStrategy
      );

      return {
        skus: allSkus,
        totalQuantity: allSkus.length,
        availableQuantity: newAvailable,
        currentPrice: newPrice,
        status: updateStatusBasedOnAvailability(allSkus, prevState.status),
      };
    },

    SkusRemoved: ({ data }, prevState) => {
      const removedSet = new Set(data.skus);
      const remainingSkus = prevState.skus.filter(s => !removedSet.has(s.sku));
      const newAvailable = countAvailableSkus(remainingSkus);
      const newPrice = calculateDynamicPrice(
        prevState.basePrice,
        remainingSkus.length,
        newAvailable,
        prevState.pricingStrategy
      );

      return {
        skus: remainingSkus,
        totalQuantity: remainingSkus.length,
        availableQuantity: newAvailable,
        currentPrice: newPrice,
        status: updateStatusBasedOnAvailability(remainingSkus, prevState.status),
      };
    },

    // Legacy handlers for backwards compatibility
    QuantityAdded: ({ data }, prevState) => {
      const newTotal = prevState.totalQuantity + data.amount;
      const newAvailable = prevState.availableQuantity + data.amount;
      const newPrice = calculateDynamicPrice(
        prevState.basePrice,
        newTotal,
        newAvailable,
        prevState.pricingStrategy
      );

      return {
        totalQuantity: newTotal,
        availableQuantity: newAvailable,
        currentPrice: newPrice,
        status: updateStatusBasedOnAvailability(prevState.skus, prevState.status),
      };
    },

    QuantityRemoved: ({ data }, prevState) => {
      const newTotal = Math.max(0, prevState.totalQuantity - data.amount);
      const newAvailable = Math.max(0, prevState.availableQuantity - data.amount);
      const newPrice = calculateDynamicPrice(
        prevState.basePrice,
        newTotal,
        newAvailable,
        prevState.pricingStrategy
      );

      return {
        totalQuantity: newTotal,
        availableQuantity: newAvailable,
        currentPrice: newPrice,
        status: updateStatusBasedOnAvailability(prevState.skus, prevState.status),
      };
    },

    BasePriceSet: ({ data }, prevState) => {
      const newPrice = calculateDynamicPrice(
        data.newPrice,
        prevState.totalQuantity,
        prevState.availableQuantity,
        prevState.pricingStrategy
      );

      return {
        basePrice: data.newPrice,
        currentPrice: newPrice,
      };
    },

    PricingStrategyChanged: ({ data }, prevState) => {
      const newPrice = calculateDynamicPrice(
        prevState.basePrice,
        prevState.totalQuantity,
        prevState.availableQuantity,
        data.newStrategy
      );

      return {
        pricingStrategy: data.newStrategy,
        currentPrice: newPrice,
      };
    },

    PriceRecalculated: ({ data }) => ({
      currentPrice: data.newPrice,
    }),

    ItemInspected: ({ data }) => ({
      condition: data.condition,
    }),

    DamageReported: ({ data }, prevState) => {
      const affectedQty = data.quantityAffected || 1;
      const newAvailable = Math.max(0, prevState.availableQuantity - affectedQty);

      return {
        status: schemas.ItemStatus.Quarantined,
        damageReport: data.description,
        condition: schemas.ItemCondition.Damaged,
        availableQuantity: newAvailable,
      };
    },

    MaintenanceScheduled: ({ data }, prevState) => {
      const maintenanceQty = data.quantityInMaintenance || prevState.availableQuantity;
      const newAvailable = Math.max(0, prevState.availableQuantity - maintenanceQty);

      return {
        status: schemas.ItemStatus.Maintenance,
        maintenanceReason: data.reason,
        availableQuantity: newAvailable,
      };
    },

    MaintenanceCompleted: ({ data }, prevState) => {
      const restoredQty = data.quantityRestored || (prevState.totalQuantity - prevState.availableQuantity);
      const newAvailable = Math.min(prevState.totalQuantity, prevState.availableQuantity + restoredQty);

      return {
        status: newAvailable > 0 ? schemas.ItemStatus.Available : schemas.ItemStatus.OutOfStock,
        maintenanceReason: undefined,
        availableQuantity: newAvailable,
      };
    },

    ItemRetired: (_, prevState) => {
      // Mark all SKUs as retired
      const retiredSkus = prevState.skus.map(s => ({
        ...s,
        status: schemas.SkuStatus.Retired,
      }));

      return {
        skus: retiredSkus,
        status: schemas.ItemStatus.Retired,
        availableQuantity: 0,
      };
    },
  })

  // --- Item Creation (Admin) ---
  .on("CreateItem", schemas.actions.CreateItem)
  .emit((data) => {
    // Generate SKUs for each unit
    const initialSkus: string[] = [];
    for (let i = 1; i <= data.initialQuantity; i++) {
      initialSkus.push(generateSku(data.serialNumber, i));
    }

    return [
      "ItemCreated",
      {
        id: randomUUID(),
        name: data.name,
        description: data.description,
        serialNumber: data.serialNumber,
        category: data.category,
        initialCondition: data.condition,
        initialSkus,
        basePrice: data.basePrice,
        pricingStrategy: data.pricingStrategy,
        imageUrl: data.imageUrl,
      },
    ];
  })

  // --- SKU Management (Admin) ---
  .on("AddSkus", schemas.actions.AddSkus)
  .given([Item.mustNotBeRetired])
  .emit((data, snapshot) => {
    // Generate new SKUs starting from the next available number
    const existingCount = snapshot.state.skus.length;
    const newSkus: string[] = [];
    for (let i = 1; i <= data.quantity; i++) {
      newSkus.push(generateSku(snapshot.state.serialNumber, existingCount + i));
    }

    return ["SkusAdded", { skus: newSkus, reason: data.reason }];
  })

  .on("RemoveSkus", schemas.actions.RemoveSkus)
  .given([Item.mustNotBeRetired])
  .emit((data) => ["SkusRemoved", { skus: data.skus, reason: data.reason }])

  // --- Pricing Management (Admin) ---
  .on("SetBasePrice", schemas.actions.SetBasePrice)
  .given([Item.mustNotBeRetired])
  .emit((data) => ["BasePriceSet", { newPrice: data.newPrice, previousPrice: 0 }])

  .on("SetPricingStrategy", schemas.actions.SetPricingStrategy)
  .given([Item.mustNotBeRetired])
  .emit((data) => ["PricingStrategyChanged", {
    newStrategy: data.strategy,
    previousStrategy: schemas.PricingStrategy.Linear
  }])

  // --- Rental Lifecycle ---
  .on("RentItem", schemas.actions.RentItem)
  .given([Item.mustNotBeRetired, Item.mustBeAvailable])
  .emit((data, snapshot) => {
    // If specific SKUs are provided, use them; otherwise auto-assign available ones
    let skusToRent: string[];

    if (data.skus && data.skus.length > 0) {
      skusToRent = data.skus;
    } else {
      // Auto-assign available SKUs
      const availableSkus = snapshot.state.skus
        .filter((s: SkuUnit) => s.status === schemas.SkuStatus.Available)
        .slice(0, data.quantity || 1)
        .map((s: SkuUnit) => s.sku);
      skusToRent = availableSkus;
    }

    return ["ItemRented", {
      renterId: data.renterId,
      skus: skusToRent,
      rentalId: randomUUID(),
      priceAtRental: snapshot.state.currentPrice,
      expectedReturnDate: data.expectedReturnDate,
    }];
  })

  .on("ReturnItem", schemas.actions.ReturnItem)
  .given([Item.mustHaveRentals])
  .emit((data, snapshot) => {
    const rental = snapshot.state.activeRentals.find(
      (r: { rentalId: string; skus: string[] }) => r.rentalId === data.rentalId
    );

    return ["ItemReturned", {
      rentalId: data.rentalId,
      returnDate: new Date().toISOString(),
      skusReturned: rental?.skus || [],
    }];
  })

  // --- Quality Control & Issues ---
  .on("InspectItem", schemas.actions.InspectItem)
  .given([Item.mustNotBeRetired])
  .emit((data) => ["ItemInspected", data])

  .on("ReportDamage", schemas.actions.ReportDamage)
  .given([Item.mustNotBeRetired])
  .emit((data, _, { actor }) => [
    "DamageReported",
    {
      description: data.description,
      reportedBy: actor?.id || "unknown",
      quantityAffected: data.quantityAffected,
    },
  ])

  // --- Maintenance Cycle ---
  .on("ScheduleMaintenance", schemas.actions.ScheduleMaintenance)
  .given([Item.mustNotBeRetired])
  .emit((data) => ["MaintenanceScheduled", data])

  .on("CompleteMaintenance", schemas.actions.CompleteMaintenance)
  .given([Item.mustBe(schemas.ItemStatus.Maintenance)])
  .emit((data) => ["MaintenanceCompleted", data])

  // --- End of Life ---
  .on("RetireItem", schemas.actions.RetireItem)
  .given([Item.mustNotBeRetired])
  .emit((data) => ["ItemRetired", data])

  .build();

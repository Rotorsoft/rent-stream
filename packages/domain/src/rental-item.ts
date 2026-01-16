import { state, type Invariant } from "@rotorsoft/act";
import { randomUUID } from "crypto";
import { z } from "zod";
import * as schemas from "./schemas/index.js";

type RentalItemState = z.infer<typeof schemas.RentalItem>;

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
      // Price increases linearly as availability decreases
      // At 100% availability: price = basePrice
      // At 0% availability: price = basePrice * 2
      return Math.round(basePrice * (1 + (1 - availabilityRatio)) * 100) / 100;

    case schemas.PricingStrategy.Exponential:
      // Price increases exponentially as availability decreases
      // At 100% availability: price = basePrice
      // At 0% availability: price ≈ basePrice * 2.72
      const k = 1; // scaling factor
      return Math.round(basePrice * Math.exp(k * (1 - availabilityRatio)) * 100) / 100;

    case schemas.PricingStrategy.Tiered:
      // Tiered pricing based on availability thresholds
      if (availabilityRatio > 0.75) return basePrice; // >75% available
      if (availabilityRatio > 0.5) return Math.round(basePrice * 1.25 * 100) / 100; // 50-75%
      if (availabilityRatio > 0.25) return Math.round(basePrice * 1.5 * 100) / 100; // 25-50%
      return Math.round(basePrice * 2 * 100) / 100; // <25% available

    default:
      return basePrice;
  }
}

// --- 1. Domain Language (Helper Factories) ---
const rule = (description: string, valid: (s: RentalItemState) => boolean): Invariant<RentalItemState> => ({
  description,
  valid,
});

const Item = {
  mustBeAvailable: rule("Item must have available quantity", (s) => s.availableQuantity > 0),
  mustHaveRentals: rule("Item must have active rentals", (s) => s.activeRentals.length > 0),
  mustNotBeRetired: rule("Item must not be retired", (s) => s.status !== schemas.ItemStatus.Retired),
  mustHaveSufficientQuantity: (qty: number) =>
    rule(`Must have at least ${qty} available`, (s) => s.availableQuantity >= qty),
  mustHaveRental: (rentalId: string) =>
    rule(`Must have rental ${rentalId}`, (s) => s.activeRentals.some(r => r.rentalId === rentalId)),
  mustBe: (status: schemas.ItemStatus) => rule(`Item must be ${status}`, (s) => s.status === status),
};

// --- 2. Pure Domain Logic (State Transitions) ---
const updateStatusBasedOnAvailability = (state: RentalItemState): schemas.ItemStatus => {
  if (state.status === schemas.ItemStatus.Retired) return schemas.ItemStatus.Retired;
  if (state.status === schemas.ItemStatus.Quarantined) return schemas.ItemStatus.Quarantined;
  if (state.status === schemas.ItemStatus.Maintenance) return schemas.ItemStatus.Maintenance;
  return state.availableQuantity > 0 ? schemas.ItemStatus.Available : schemas.ItemStatus.OutOfStock;
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
    ItemCreated: ({ data }) => ({
      id: data.id,
      name: data.name,
      description: data.description,
      serialNumber: data.serialNumber,
      category: data.category,
      status: schemas.ItemStatus.Available,
      condition: data.initialCondition,
      totalQuantity: data.initialQuantity,
      availableQuantity: data.initialQuantity,
      basePrice: data.basePrice,
      currentPrice: data.basePrice, // Initial price equals base price at 100% availability
      pricingStrategy: data.pricingStrategy,
      imageUrl: data.imageUrl,
      activeRentals: [],
    }),

    ItemRented: ({ data }, prevState) => {
      const newAvailable = prevState.availableQuantity - data.quantity;
      const newPrice = calculateDynamicPrice(
        prevState.basePrice,
        prevState.totalQuantity,
        newAvailable,
        prevState.pricingStrategy
      );

      return {
        availableQuantity: newAvailable,
        currentPrice: newPrice,
        status: newAvailable > 0 ? schemas.ItemStatus.Available : schemas.ItemStatus.OutOfStock,
        activeRentals: [
          ...prevState.activeRentals,
          {
            rentalId: data.rentalId,
            renterId: data.renterId,
            quantity: data.quantity,
            expectedReturnDate: data.expectedReturnDate,
          },
        ],
      };
    },

    ItemReturned: ({ data }, prevState) => {
      const rental = prevState.activeRentals.find(r => r.rentalId === data.rentalId);
      if (!rental) return {};

      const newAvailable = prevState.availableQuantity + data.quantityReturned;
      const newPrice = calculateDynamicPrice(
        prevState.basePrice,
        prevState.totalQuantity,
        newAvailable,
        prevState.pricingStrategy
      );

      // If item was quarantined during rental, keep it quarantined
      const nextStatus = prevState.status === schemas.ItemStatus.Quarantined
        ? schemas.ItemStatus.Quarantined
        : (newAvailable > 0 ? schemas.ItemStatus.Available : schemas.ItemStatus.OutOfStock);

      return {
        availableQuantity: newAvailable,
        currentPrice: newPrice,
        status: nextStatus,
        activeRentals: prevState.activeRentals.filter(r => r.rentalId !== data.rentalId),
      };
    },

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
        status: updateStatusBasedOnAvailability({ ...prevState, availableQuantity: newAvailable }),
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
        status: updateStatusBasedOnAvailability({ ...prevState, availableQuantity: newAvailable }),
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

    ItemRetired: () => ({
      status: schemas.ItemStatus.Retired,
      availableQuantity: 0,
    }),
  })

  // --- Item Creation (Admin) ---
  .on("CreateItem", schemas.actions.CreateItem)
  .emit((data) => [
    "ItemCreated",
    {
      id: randomUUID(),
      name: data.name,
      description: data.description,
      serialNumber: data.serialNumber,
      category: data.category,
      initialCondition: data.condition,
      initialQuantity: data.initialQuantity,
      basePrice: data.basePrice,
      pricingStrategy: data.pricingStrategy,
      imageUrl: data.imageUrl,
    },
  ])

  // --- Quantity Management (Admin) ---
  .on("AddQuantity", schemas.actions.AddQuantity)
  .given([Item.mustNotBeRetired])
  .emit((data) => ["QuantityAdded", data])

  .on("RemoveQuantity", schemas.actions.RemoveQuantity)
  .given([Item.mustNotBeRetired])
  .emit((data) => ["QuantityRemoved", data])

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
  .emit((data) => ["ItemRented", {
    ...data,
    quantity: data.quantity || 1,
    rentalId: randomUUID(),
    priceAtRental: 0,
  }])

  .on("ReturnItem", schemas.actions.ReturnItem)
  .given([Item.mustHaveRentals])
  .emit((data, snapshot) => {
    const rental = snapshot.state.activeRentals.find((r: { rentalId: string; quantity: number }) => r.rentalId === data.rentalId);
    return ["ItemReturned", {
      rentalId: data.rentalId,
      returnDate: new Date().toISOString(),
      quantityReturned: rental?.quantity || 1,
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

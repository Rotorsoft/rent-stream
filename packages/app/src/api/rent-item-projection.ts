import { type AsCommitted } from "@rotorsoft/act";
import { ItemStatus, ItemCondition, ItemCategory, PricingStrategy, SkuStatus, calculateDynamicPrice } from "@rent-stream/domain";
import { builder } from "./builder.js";

// SKU unit for tracking individual items
interface SkuUnit {
  sku: string;
  status: SkuStatus;
  condition: ItemCondition;
  notes?: string;
}

// Active rental tracking with SKUs
interface ActiveRental {
  rentalId: string;
  renterId: string;
  skus: string[];
  expectedReturnDate: string;
}

// Read model item type
export interface ReadModelItem {
  stream: string;
  id: string;
  name: string;
  description?: string;
  serialNumber: string;
  category: ItemCategory;
  status: ItemStatus;
  condition: ItemCondition;
  // SKU tracking
  skus: SkuUnit[];
  // Computed quantity tracking
  totalQuantity: number;
  availableQuantity: number;
  // Pricing
  basePrice: number;
  currentPrice: number;
  pricingStrategy: PricingStrategy;
  // Rentals
  activeRentals: ActiveRental[];
  currentRenterId?: string;
  damageReport?: string;
  maintenanceReason?: string;
  imageUrl?: string;
}

// Helper to count available SKUs
const countAvailableSkus = (skus: SkuUnit[]): number =>
  skus.filter(s => s.status === SkuStatus.Available).length;

// In-memory Read Model
export const itemReadModel = new Map<string, ReadModelItem>();

export async function itemCreated(
  event: AsCommitted<typeof builder.events, "ItemCreated">
) {
  const { stream, data } = event;
  const skus: SkuUnit[] = data.initialSkus.map(sku => ({
    sku,
    status: SkuStatus.Available,
    condition: data.initialCondition,
  }));

  itemReadModel.set(stream, {
    stream,
    id: data.id,
    name: data.name,
    description: data.description,
    serialNumber: data.serialNumber,
    category: data.category,
    status: ItemStatus.Available,
    condition: data.initialCondition,
    skus,
    totalQuantity: skus.length,
    availableQuantity: skus.length,
    basePrice: data.basePrice,
    currentPrice: data.basePrice,
    pricingStrategy: data.pricingStrategy,
    activeRentals: [],
    imageUrl: data.imageUrl,
  });
}

export async function itemRented(
  event: AsCommitted<typeof builder.events, "ItemRented">
) {
  const { stream, data } = event;
  const item = itemReadModel.get(stream);
  if (item) {
    const rentedSkuSet = new Set(data.skus);
    const updatedSkus = item.skus.map(s =>
      rentedSkuSet.has(s.sku)
        ? { ...s, status: SkuStatus.Rented }
        : s
    );

    const newAvailable = countAvailableSkus(updatedSkus);
    const newPrice = calculateDynamicPrice(
      item.basePrice,
      updatedSkus.length,
      newAvailable,
      item.pricingStrategy
    );

    itemReadModel.set(stream, {
      ...item,
      skus: updatedSkus,
      availableQuantity: newAvailable,
      currentPrice: newPrice,
      status: newAvailable > 0 ? ItemStatus.Available : ItemStatus.OutOfStock,
      currentRenterId: data.renterId,
      activeRentals: [
        ...item.activeRentals,
        {
          rentalId: data.rentalId,
          renterId: data.renterId,
          skus: data.skus,
          expectedReturnDate: data.expectedReturnDate,
        },
      ],
    });
  }
}

export async function itemReturned(
  event: AsCommitted<typeof builder.events, "ItemReturned">
) {
  const { stream, data } = event;
  const item = itemReadModel.get(stream);
  if (item) {
    const returnedSkuSet = new Set(data.skusReturned);
    const updatedSkus = item.skus.map(s =>
      returnedSkuSet.has(s.sku)
        ? { ...s, status: SkuStatus.Available }
        : s
    );

    const newAvailable = countAvailableSkus(updatedSkus);
    const newPrice = calculateDynamicPrice(
      item.basePrice,
      updatedSkus.length,
      newAvailable,
      item.pricingStrategy
    );

    const nextStatus =
      item.status === ItemStatus.Quarantined
        ? ItemStatus.Quarantined
        : (newAvailable > 0 ? ItemStatus.Available : ItemStatus.OutOfStock);

    itemReadModel.set(stream, {
      ...item,
      skus: updatedSkus,
      availableQuantity: newAvailable,
      currentPrice: newPrice,
      status: nextStatus,
      currentRenterId: undefined,
      activeRentals: item.activeRentals.filter(r => r.rentalId !== data.rentalId),
    });
  }
}

export async function skusAdded(
  event: AsCommitted<typeof builder.events, "SkusAdded">
) {
  const { stream, data } = event;
  const item = itemReadModel.get(stream);
  if (item) {
    const newSkus: SkuUnit[] = data.skus.map(sku => ({
      sku,
      status: SkuStatus.Available,
      condition: item.condition,
    }));

    const allSkus = [...item.skus, ...newSkus];
    const newAvailable = countAvailableSkus(allSkus);
    const newPrice = calculateDynamicPrice(
      item.basePrice,
      allSkus.length,
      newAvailable,
      item.pricingStrategy
    );

    itemReadModel.set(stream, {
      ...item,
      skus: allSkus,
      totalQuantity: allSkus.length,
      availableQuantity: newAvailable,
      currentPrice: newPrice,
      status: newAvailable > 0 ? ItemStatus.Available : item.status,
    });
  }
}

export async function skusRemoved(
  event: AsCommitted<typeof builder.events, "SkusRemoved">
) {
  const { stream, data } = event;
  const item = itemReadModel.get(stream);
  if (item) {
    const removedSet = new Set(data.skus);
    const remainingSkus = item.skus.filter(s => !removedSet.has(s.sku));
    const newAvailable = countAvailableSkus(remainingSkus);
    const newPrice = calculateDynamicPrice(
      item.basePrice,
      remainingSkus.length,
      newAvailable,
      item.pricingStrategy
    );

    itemReadModel.set(stream, {
      ...item,
      skus: remainingSkus,
      totalQuantity: remainingSkus.length,
      availableQuantity: newAvailable,
      currentPrice: newPrice,
      status: newAvailable > 0 ? ItemStatus.Available : ItemStatus.OutOfStock,
    });
  }
}

// Legacy handlers for backwards compatibility
export async function quantityAdded(
  event: AsCommitted<typeof builder.events, "QuantityAdded">
) {
  const { stream, data } = event;
  const item = itemReadModel.get(stream);
  if (item) {
    const newTotal = item.totalQuantity + data.amount;
    const newAvailable = item.availableQuantity + data.amount;
    const newPrice = calculateDynamicPrice(
      item.basePrice,
      newTotal,
      newAvailable,
      item.pricingStrategy
    );

    itemReadModel.set(stream, {
      ...item,
      totalQuantity: newTotal,
      availableQuantity: newAvailable,
      currentPrice: newPrice,
      status: newAvailable > 0 ? ItemStatus.Available : item.status,
    });
  }
}

export async function quantityRemoved(
  event: AsCommitted<typeof builder.events, "QuantityRemoved">
) {
  const { stream, data } = event;
  const item = itemReadModel.get(stream);
  if (item) {
    const newTotal = Math.max(0, item.totalQuantity - data.amount);
    const newAvailable = Math.max(0, item.availableQuantity - data.amount);
    const newPrice = calculateDynamicPrice(
      item.basePrice,
      newTotal,
      newAvailable,
      item.pricingStrategy
    );

    itemReadModel.set(stream, {
      ...item,
      totalQuantity: newTotal,
      availableQuantity: newAvailable,
      currentPrice: newPrice,
      status: newAvailable > 0 ? ItemStatus.Available : ItemStatus.OutOfStock,
    });
  }
}

export async function basePriceSet(
  event: AsCommitted<typeof builder.events, "BasePriceSet">
) {
  const { stream, data } = event;
  const item = itemReadModel.get(stream);
  if (item) {
    const newPrice = calculateDynamicPrice(
      data.newPrice,
      item.totalQuantity,
      item.availableQuantity,
      item.pricingStrategy
    );

    itemReadModel.set(stream, {
      ...item,
      basePrice: data.newPrice,
      currentPrice: newPrice,
    });
  }
}

export async function pricingStrategyChanged(
  event: AsCommitted<typeof builder.events, "PricingStrategyChanged">
) {
  const { stream, data } = event;
  const item = itemReadModel.get(stream);
  if (item) {
    const newPrice = calculateDynamicPrice(
      item.basePrice,
      item.totalQuantity,
      item.availableQuantity,
      data.newStrategy
    );

    itemReadModel.set(stream, {
      ...item,
      pricingStrategy: data.newStrategy,
      currentPrice: newPrice,
    });
  }
}

export async function priceRecalculated(
  event: AsCommitted<typeof builder.events, "PriceRecalculated">
) {
  const { stream, data } = event;
  const item = itemReadModel.get(stream);
  if (item) {
    itemReadModel.set(stream, {
      ...item,
      currentPrice: data.newPrice,
    });
  }
}

export async function itemInspected(
  event: AsCommitted<typeof builder.events, "ItemInspected">
) {
  const { stream, data } = event;
  const item = itemReadModel.get(stream);
  if (item) {
    itemReadModel.set(stream, {
      ...item,
      condition: data.condition,
    });
  }
}

export async function damageReported(
  event: AsCommitted<typeof builder.events, "DamageReported">
) {
  const { stream, data } = event;
  const item = itemReadModel.get(stream);
  if (item) {
    const affectedQty = data.quantityAffected || 1;
    const newAvailable = Math.max(0, item.availableQuantity - affectedQty);

    itemReadModel.set(stream, {
      ...item,
      status: ItemStatus.Quarantined,
      condition: ItemCondition.Damaged,
      damageReport: data.description,
      availableQuantity: newAvailable,
    });
  }
}

export async function maintenanceScheduled(
  event: AsCommitted<typeof builder.events, "MaintenanceScheduled">
) {
  const { stream, data } = event;
  const item = itemReadModel.get(stream);
  if (item) {
    const maintenanceQty = data.quantityInMaintenance || item.availableQuantity;
    const newAvailable = Math.max(0, item.availableQuantity - maintenanceQty);

    itemReadModel.set(stream, {
      ...item,
      status: ItemStatus.Maintenance,
      maintenanceReason: data.reason,
      availableQuantity: newAvailable,
    });
  }
}

export async function maintenanceCompleted(
  event: AsCommitted<typeof builder.events, "MaintenanceCompleted">
) {
  const { stream, data } = event;
  const item = itemReadModel.get(stream);
  if (item) {
    const restoredQty = data.quantityRestored || (item.totalQuantity - item.availableQuantity);
    const newAvailable = Math.min(item.totalQuantity, item.availableQuantity + restoredQty);

    itemReadModel.set(stream, {
      ...item,
      status: newAvailable > 0 ? ItemStatus.Available : ItemStatus.OutOfStock,
      maintenanceReason: undefined,
      availableQuantity: newAvailable,
    });
  }
}

export async function itemRetired(
  event: AsCommitted<typeof builder.events, "ItemRetired">
) {
  const { stream } = event;
  const item = itemReadModel.get(stream);
  if (item) {
    const retiredSkus = item.skus.map(s => ({
      ...s,
      status: SkuStatus.Retired,
    }));

    itemReadModel.set(stream, {
      ...item,
      skus: retiredSkus,
      status: ItemStatus.Retired,
      availableQuantity: 0,
    });
  }
}

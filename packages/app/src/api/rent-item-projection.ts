import { type AsCommitted } from "@rotorsoft/act";
import { ItemStatus, ItemCondition, ItemCategory, PricingStrategy, calculateDynamicPrice } from "@rent-stream/domain";
import { builder } from "./builder.js";

// Active rental tracking
interface ActiveRental {
  rentalId: string;
  renterId: string;
  quantity: number;
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
  // Quantity tracking
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

// In-memory Read Model
// Maps streamId -> { id, name, status, condition, ... }
export const itemReadModel = new Map<string, ReadModelItem>();

export async function itemCreated(
  event: AsCommitted<typeof builder.events, "ItemCreated">
) {
  const { stream, data } = event;
  itemReadModel.set(stream, {
    stream,
    id: data.id,
    name: data.name,
    description: data.description,
    serialNumber: data.serialNumber,
    category: data.category,
    status: ItemStatus.Available,
    condition: data.initialCondition,
    totalQuantity: data.initialQuantity,
    availableQuantity: data.initialQuantity,
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
    const newAvailable = item.availableQuantity - data.quantity;
    const newPrice = calculateDynamicPrice(
      item.basePrice,
      item.totalQuantity,
      newAvailable,
      item.pricingStrategy
    );

    itemReadModel.set(stream, {
      ...item,
      availableQuantity: newAvailable,
      currentPrice: newPrice,
      status: newAvailable > 0 ? ItemStatus.Available : ItemStatus.OutOfStock,
      currentRenterId: data.renterId,
      activeRentals: [
        ...item.activeRentals,
        {
          rentalId: data.rentalId,
          renterId: data.renterId,
          quantity: data.quantity,
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
    const rental = item.activeRentals.find(r => r.rentalId === data.rentalId);
    const quantityReturned = rental?.quantity || data.quantityReturned;
    const newAvailable = item.availableQuantity + quantityReturned;
    const newPrice = calculateDynamicPrice(
      item.basePrice,
      item.totalQuantity,
      newAvailable,
      item.pricingStrategy
    );

    const nextStatus =
      item.status === ItemStatus.Quarantined
        ? ItemStatus.Quarantined
        : (newAvailable > 0 ? ItemStatus.Available : ItemStatus.OutOfStock);

    itemReadModel.set(stream, {
      ...item,
      availableQuantity: newAvailable,
      currentPrice: newPrice,
      status: nextStatus,
      currentRenterId: undefined,
      activeRentals: item.activeRentals.filter(r => r.rentalId !== data.rentalId),
    });
  }
}

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
    itemReadModel.set(stream, {
      ...item,
      status: ItemStatus.Retired,
      availableQuantity: 0,
    });
  }
}

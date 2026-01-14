import { type AsCommitted } from "@rotorsoft/act";
import { ItemStatus, ItemCondition } from "@rent-stream/domain";
import { builder } from "./builder.js";

// Read model item type
export interface ReadModelItem {
  stream: string;
  id: string;
  name: string;
  serialNumber: string;
  status: ItemStatus;
  condition: ItemCondition;
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
    serialNumber: data.serialNumber,
    status: ItemStatus.Available,
    condition: data.initialCondition,
    imageUrl: data.imageUrl,
  });
}

export async function itemRented(
  event: AsCommitted<typeof builder.events, "ItemRented">
) {
  const { stream, data } = event;
  const item = itemReadModel.get(stream);
  if (item) {
    itemReadModel.set(stream, {
      ...item,
      status: ItemStatus.Rented,
      currentRenterId: data.renterId,
    });
  }
}

export async function itemReturned(
  event: AsCommitted<typeof builder.events, "ItemReturned">
) {
  const { stream } = event;
  const item = itemReadModel.get(stream);
  if (item) {
    const nextStatus =
      item.status === ItemStatus.Quarantined
        ? ItemStatus.Quarantined
        : ItemStatus.Available;

    itemReadModel.set(stream, {
      ...item,
      status: nextStatus,
      currentRenterId: undefined,
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
    itemReadModel.set(stream, {
      ...item,
      status: ItemStatus.Quarantined,
      condition: ItemCondition.Damaged,
      damageReport: data.description,
    });
  }
}

export async function maintenanceScheduled(
  event: AsCommitted<typeof builder.events, "MaintenanceScheduled">
) {
  const { stream, data } = event;
  const item = itemReadModel.get(stream);
  if (item) {
    itemReadModel.set(stream, {
      ...item,
      status: ItemStatus.Maintenance,
      maintenanceReason: data.reason,
    });
  }
}

export async function maintenanceCompleted(
  event: AsCommitted<typeof builder.events, "MaintenanceCompleted">
) {
  const { stream } = event;
  const item = itemReadModel.get(stream);
  if (item) {
    itemReadModel.set(stream, {
      ...item,
      status: ItemStatus.Available,
      maintenanceReason: undefined,
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
    });
  }
}

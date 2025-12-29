import { state, type Invariant } from "@rotorsoft/act";
import { randomUUID } from "crypto";
import { z } from "zod";
import * as schemas from "./schemas/index.js";

type RentalItemState = z.infer<typeof schemas.RentalItem>;

// --- 1. Domain Language (Helper Factories) ---
const rule = (description: string, valid: (s: RentalItemState) => boolean): Invariant<RentalItemState> => ({
  description,
  valid,
});

const Item = {
  mustBe: (status: schemas.ItemStatus) => rule(`Item must be ${status}`, (s) => s.status === status),
  mustBeRented: rule("Item must be currently rented", (s) => !!s.currentRenterId),
  mustNotBeRetired: rule("Item must not be retired", (s) => s.status !== schemas.ItemStatus.Retired),
};

// --- 2. Pure Domain Logic (State Transitions) ---
const concludeRental = (state: RentalItemState) => {
  // Business Rule: If an item was quarantined (e.g. damaged) during the rental, 
  // it stays quarantined upon return. Otherwise, it becomes available.
  const nextStatus = state.status === schemas.ItemStatus.Quarantined
    ? schemas.ItemStatus.Quarantined
    : schemas.ItemStatus.Available;

  return {
    status: nextStatus,
    currentRenterId: undefined,
  };
};

// --- 3. State Machine Definition ---
export const RentalItem = state("RentalItem", schemas.RentalItem)
  .init(() => ({
    id: "",
    name: "",
    serialNumber: "",
    status: schemas.ItemStatus.Available,
    condition: schemas.ItemCondition.New,
  }))
  .emits(schemas.events)

  // Define how Events mutate the State
  .patch({
    ItemCreated: ({ data }) => ({
      id: data.id,
      name: data.name,
      serialNumber: data.serialNumber,
      status: schemas.ItemStatus.Available,
      condition: data.initialCondition,
    }),

    ItemRented: ({ data }) => ({
      status: schemas.ItemStatus.Rented,
      currentRenterId: data.renterId,
    }),

    ItemReturned: (_event, state) => concludeRental(state),

    ItemInspected: ({ data }) => ({
      condition: data.condition,
    }),

    DamageReported: ({ data }) => ({
      status: schemas.ItemStatus.Quarantined,
      damageReport: data.description,
      condition: schemas.ItemCondition.Damaged,
    }),

    MaintenanceScheduled: ({ data }) => ({
      status: schemas.ItemStatus.Maintenance,
      maintenanceReason: data.reason,
    }),

    MaintenanceCompleted: () => ({
      status: schemas.ItemStatus.Available,
      maintenanceReason: undefined,
    }),

    ItemRetired: () => ({
      status: schemas.ItemStatus.Retired,
    }),
  })

  .on("CreateItem", schemas.actions.CreateItem)
  .emit((data) => [
    "ItemCreated",
    { ...data, id: randomUUID(), initialCondition: data.condition },
  ])

  // --- Rental Lifecycle ---
  .on("RentItem", schemas.actions.RentItem)
  .given([Item.mustBe(schemas.ItemStatus.Available)])
  .emit((data) => ["ItemRented", { ...data, rentalId: randomUUID() }])

  .on("ReturnItem", schemas.actions.ReturnItem)
  .given([Item.mustBeRented])
  .emit(() => ["ItemReturned", { returnDate: new Date().toISOString() }])

  // --- Quality Control & Issues ---
  .on("InspectItem", schemas.actions.InspectItem)
  .given([Item.mustNotBeRetired])
  .emit((data) => ["ItemInspected", data])

  .on("ReportDamage", schemas.actions.ReportDamage)
  .given([Item.mustNotBeRetired])
  .emit((data, _, { actor }) => [
    "DamageReported",
    { ...data, reportedBy: actor?.id || "unknown" },
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



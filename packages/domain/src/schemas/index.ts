import { z } from "zod";

export enum ItemStatus {
  Available = "Available",
  Rented = "Rented",
  Maintenance = "Maintenance",
  Quarantined = "Quarantined",
  Retired = "Retired",
}

export enum ItemCondition {
  New = "New",
  Good = "Good",
  Fair = "Fair",
  Poor = "Poor",
  Damaged = "Damaged",
}

export const RentalItem = z.object({
  id: z.string(),
  name: z.string(),
  serialNumber: z.string(),
  status: z.enum(ItemStatus),
  condition: z.enum(ItemCondition),
  currentRenterId: z.string().optional(),
  maintenanceReason: z.string().optional(),
  damageReport: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const events = {
  ItemCreated: z.object({
    id: z.string(),
    name: z.string(),
    serialNumber: z.string(),
    initialCondition: z.enum(ItemCondition),
    imageUrl: z.string().optional(),
  }),
  ItemRented: z.object({
    renterId: z.string(),
    rentalId: z.string(),
    expectedReturnDate: z.string(),
  }),
  ItemReturned: z.object({
    returnDate: z.string(),
  }),
  ItemInspected: z.object({
    condition: z.enum(ItemCondition),
    notes: z.string().optional(),
  }),
  DamageReported: z.object({
    description: z.string(),
    reportedBy: z.string(),
  }),
  MaintenanceScheduled: z.object({
    reason: z.string(),
    scheduledDate: z.string(),
  }),
  MaintenanceCompleted: z.object({
    notes: z.string().optional(),
  }),
  ItemRetired: z.object({
    reason: z.string(),
  }),
};

export const actions = {
  CreateItem: z.object({
    name: z.string(),
    serialNumber: z.string(),
    condition: z.enum(ItemCondition),
    imageUrl: z.string().optional(),
  }),
  RentItem: z.object({
    renterId: z.string(),
    expectedReturnDate: z.string(),
  }),
  ReturnItem: z.object({}),
  InspectItem: z.object({
    condition: z.enum(ItemCondition),
    notes: z.string().optional(),
  }),
  ReportDamage: z.object({
    description: z.string(),
  }),
  ScheduleMaintenance: z.object({
    reason: z.string(),
    scheduledDate: z.string(),
  }),
  CompleteMaintenance: z.object({
    notes: z.string().optional(),
  }),
  RetireItem: z.object({
    reason: z.string(),
  }),
};


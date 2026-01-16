import { z } from "zod";

export enum ItemStatus {
  Available = "Available",
  OutOfStock = "OutOfStock",
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

export enum ItemCategory {
  Outdoor = "Outdoor",
  Tools = "Tools",
  Party = "Party",
  Electronics = "Electronics",
  Sports = "Sports",
  Other = "Other",
}

export enum PricingStrategy {
  Linear = "linear",
  Exponential = "exponential",
  Tiered = "tiered",
}

export const RentalItem = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  serialNumber: z.string(),
  category: z.nativeEnum(ItemCategory),
  status: z.nativeEnum(ItemStatus),
  condition: z.nativeEnum(ItemCondition),
  // Quantity tracking
  totalQuantity: z.number().int().min(0),
  availableQuantity: z.number().int().min(0),
  // Pricing
  basePrice: z.number().min(0),
  currentPrice: z.number().min(0),
  pricingStrategy: z.nativeEnum(PricingStrategy),
  // Rental tracking (for individual rentals)
  currentRenterId: z.string().optional(),
  activeRentals: z.array(z.object({
    rentalId: z.string(),
    renterId: z.string(),
    quantity: z.number().int().min(1),
    expectedReturnDate: z.string(),
  })),
  maintenanceReason: z.string().optional(),
  damageReport: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const events = {
  ItemCreated: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    serialNumber: z.string(),
    category: z.nativeEnum(ItemCategory),
    initialCondition: z.nativeEnum(ItemCondition),
    initialQuantity: z.number().int().min(1),
    basePrice: z.number().min(0),
    pricingStrategy: z.nativeEnum(PricingStrategy),
    imageUrl: z.string().optional(),
  }),
  ItemRented: z.object({
    renterId: z.string(),
    rentalId: z.string(),
    quantity: z.number().int().min(1),
    priceAtRental: z.number().min(0),
    expectedReturnDate: z.string(),
  }),
  ItemReturned: z.object({
    rentalId: z.string(),
    returnDate: z.string(),
    quantityReturned: z.number().int().min(1),
  }),
  QuantityAdded: z.object({
    amount: z.number().int().min(1),
    reason: z.string().optional(),
  }),
  QuantityRemoved: z.object({
    amount: z.number().int().min(1),
    reason: z.string(),
  }),
  BasePriceSet: z.object({
    newPrice: z.number().min(0),
    previousPrice: z.number().min(0),
  }),
  PricingStrategyChanged: z.object({
    newStrategy: z.nativeEnum(PricingStrategy),
    previousStrategy: z.nativeEnum(PricingStrategy),
  }),
  PriceRecalculated: z.object({
    newPrice: z.number().min(0),
    availabilityRatio: z.number().min(0).max(1),
  }),
  ItemInspected: z.object({
    condition: z.nativeEnum(ItemCondition),
    notes: z.string().optional(),
  }),
  DamageReported: z.object({
    description: z.string(),
    reportedBy: z.string(),
    quantityAffected: z.number().int().min(1).optional(),
  }),
  MaintenanceScheduled: z.object({
    reason: z.string(),
    scheduledDate: z.string(),
    quantityInMaintenance: z.number().int().min(1).optional(),
  }),
  MaintenanceCompleted: z.object({
    notes: z.string().optional(),
    quantityRestored: z.number().int().min(1).optional(),
  }),
  ItemRetired: z.object({
    reason: z.string(),
  }),
};

export const actions = {
  // Admin actions
  CreateItem: z.object({
    name: z.string(),
    description: z.string().optional(),
    serialNumber: z.string(),
    category: z.nativeEnum(ItemCategory),
    condition: z.nativeEnum(ItemCondition),
    initialQuantity: z.number().int().min(1),
    basePrice: z.number().min(0),
    pricingStrategy: z.nativeEnum(PricingStrategy).default(PricingStrategy.Linear),
    imageUrl: z.string().optional(),
  }),
  AddQuantity: z.object({
    amount: z.number().int().min(1),
    reason: z.string().optional(),
  }),
  RemoveQuantity: z.object({
    amount: z.number().int().min(1),
    reason: z.string(),
  }),
  SetBasePrice: z.object({
    newPrice: z.number().min(0),
  }),
  SetPricingStrategy: z.object({
    strategy: z.nativeEnum(PricingStrategy),
  }),
  // Customer actions
  RentItem: z.object({
    renterId: z.string(),
    quantity: z.number().int().min(1).default(1),
    expectedReturnDate: z.string(),
  }),
  ReturnItem: z.object({
    rentalId: z.string(),
  }),
  // Staff actions
  InspectItem: z.object({
    condition: z.nativeEnum(ItemCondition),
    notes: z.string().optional(),
  }),
  ReportDamage: z.object({
    description: z.string(),
    quantityAffected: z.number().int().min(1).optional(),
  }),
  ScheduleMaintenance: z.object({
    reason: z.string(),
    scheduledDate: z.string(),
    quantityInMaintenance: z.number().int().min(1).optional(),
  }),
  CompleteMaintenance: z.object({
    notes: z.string().optional(),
    quantityRestored: z.number().int().min(1).optional(),
  }),
  RetireItem: z.object({
    reason: z.string(),
  }),
};


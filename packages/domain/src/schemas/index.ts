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

export enum SkuStatus {
  Available = "available",
  Rented = "rented",
  Maintenance = "maintenance",
  Damaged = "damaged",
  Retired = "retired",
}

// Individual unit tracking
export const SkuUnit = z.object({
  sku: z.string(),
  status: z.nativeEnum(SkuStatus),
  condition: z.nativeEnum(ItemCondition),
  notes: z.string().optional(),
});

export const RentalItem = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  serialNumber: z.string(),
  category: z.nativeEnum(ItemCategory),
  status: z.nativeEnum(ItemStatus),
  condition: z.nativeEnum(ItemCondition),
  // Individual unit tracking with SKUs
  skus: z.array(SkuUnit),
  // Computed quantity tracking (derived from skus)
  totalQuantity: z.number().int().min(0),
  availableQuantity: z.number().int().min(0),
  // Pricing
  basePrice: z.number().min(0),
  currentPrice: z.number().min(0),
  pricingStrategy: z.nativeEnum(PricingStrategy),
  // Rental tracking with specific SKUs
  currentRenterId: z.string().optional(),
  activeRentals: z.array(z.object({
    rentalId: z.string(),
    renterId: z.string(),
    skus: z.array(z.string()), // SKU IDs being rented
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
    initialSkus: z.array(z.string()), // Generated SKU IDs
    basePrice: z.number().min(0),
    pricingStrategy: z.nativeEnum(PricingStrategy),
    imageUrl: z.string().optional(),
  }),
  ItemRented: z.object({
    renterId: z.string(),
    rentalId: z.string(),
    skus: z.array(z.string()), // Specific SKUs being rented
    priceAtRental: z.number().min(0),
    expectedReturnDate: z.string(),
  }),
  ItemReturned: z.object({
    rentalId: z.string(),
    returnDate: z.string(),
    skusReturned: z.array(z.string()), // SKUs being returned
  }),
  SkusAdded: z.object({
    skus: z.array(z.string()), // New SKU IDs
    reason: z.string().optional(),
  }),
  SkusRemoved: z.object({
    skus: z.array(z.string()), // SKUs to remove
    reason: z.string(),
  }),
  // Legacy events for backwards compatibility
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
    initialQuantity: z.number().int().min(1), // Will generate this many SKUs
    basePrice: z.number().min(0),
    pricingStrategy: z.nativeEnum(PricingStrategy).default(PricingStrategy.Linear),
    imageUrl: z.string().optional(),
  }),
  AddSkus: z.object({
    quantity: z.number().int().min(1), // Number of new SKUs to generate
    reason: z.string().optional(),
  }),
  RemoveSkus: z.object({
    skus: z.array(z.string()), // Specific SKUs to remove
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
    skus: z.array(z.string()).optional(), // Specific SKUs to rent (optional - will auto-assign if not specified)
    quantity: z.number().int().min(1).default(1), // Number to rent if skus not specified
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


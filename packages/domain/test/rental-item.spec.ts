import { describe, it, expect } from "vitest";
import { act } from "@rotorsoft/act";
import {
  RentalItem,
  ItemStatus,
  ItemCondition,
  ItemCategory,
  PricingStrategy,
  calculateDynamicPrice,
} from "../src/index.js";

describe("RentalItem", () => {
  const app = act().with(RentalItem).build();
  const actor = { id: "user-1", name: "Alice" };

  // Helper to create items with required fields
  const createTestItem = async (
    stream: string,
    overrides: Partial<{
      name: string;
      serialNumber: string;
      category: ItemCategory;
      condition: ItemCondition;
      initialQuantity: number;
      basePrice: number;
      pricingStrategy: PricingStrategy;
      imageUrl: string;
    }> = {}
  ) => {
    await app.do("CreateItem", { stream, actor }, {
      name: overrides.name || "Test Item",
      serialNumber: overrides.serialNumber || `SN-${Date.now()}`,
      category: overrides.category || ItemCategory.Other,
      condition: overrides.condition || ItemCondition.New,
      initialQuantity: overrides.initialQuantity ?? 5,
      basePrice: overrides.basePrice ?? 50,
      pricingStrategy: overrides.pricingStrategy || PricingStrategy.Linear,
      imageUrl: overrides.imageUrl,
    });
  };

  describe("Item Creation", () => {
    it("should create a new rental item with quantity and pricing", async () => {
      const stream = "item-create-qty";
      await createTestItem(stream, {
        name: "Mountain Bike",
        initialQuantity: 10,
        basePrice: 45,
        category: ItemCategory.Outdoor,
      });

      const snapshot = await app.load(RentalItem, stream);
      expect(snapshot.state.name).toBe("Mountain Bike");
      expect(snapshot.state.status).toBe(ItemStatus.Available);
      expect(snapshot.state.totalQuantity).toBe(10);
      expect(snapshot.state.availableQuantity).toBe(10);
      expect(snapshot.state.basePrice).toBe(45);
      expect(snapshot.state.currentPrice).toBe(45); // Base price at 100% availability
      expect(snapshot.state.category).toBe(ItemCategory.Outdoor);
    });

    it("should create a rental item with an imageUrl", async () => {
      const stream = "item-with-image";
      const imageUrl = "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800";
      await createTestItem(stream, {
        name: "Camera with Image",
        imageUrl,
      });

      const snapshot = await app.load(RentalItem, stream);
      expect(snapshot.state.imageUrl).toBe(imageUrl);
    });
  });

  describe("Rental Lifecycle with Quantity", () => {
    it("should rent and decrease available quantity", async () => {
      const stream = "item-rent-qty";
      await createTestItem(stream, { initialQuantity: 5 });

      await app.do("RentItem", { stream, actor }, {
        renterId: "renter-1",
        quantity: 2,
        expectedReturnDate: "2025-12-30T00:00:00Z",
      });

      const snapshot = await app.load(RentalItem, stream);
      expect(snapshot.state.totalQuantity).toBe(5);
      expect(snapshot.state.availableQuantity).toBe(3); // 5 - 2 = 3
      expect(snapshot.state.activeRentals).toHaveLength(1);
      expect(snapshot.state.activeRentals[0].skus).toHaveLength(2);
      expect(snapshot.state.status).toBe(ItemStatus.Available); // Still available
    });

    it("should become OutOfStock when all quantity is rented", async () => {
      const stream = "item-out-of-stock";
      await createTestItem(stream, { initialQuantity: 2 });

      // Rent first unit
      await app.do("RentItem", { stream, actor }, {
        renterId: "renter-1",
        quantity: 1,
        expectedReturnDate: "2025-12-30T00:00:00Z",
      });

      // Rent second unit
      await app.do("RentItem", { stream, actor }, {
        renterId: "renter-2",
        quantity: 1,
        expectedReturnDate: "2025-12-30T00:00:00Z",
      });

      const snapshot = await app.load(RentalItem, stream);
      expect(snapshot.state.availableQuantity).toBe(0);
      expect(snapshot.state.status).toBe(ItemStatus.OutOfStock);
    });

    it("should fail to rent when no quantity available", async () => {
      const stream = "item-no-qty";
      await createTestItem(stream, { initialQuantity: 1 });

      // Rent the only unit
      await app.do("RentItem", { stream, actor }, {
        renterId: "renter-1",
        quantity: 1,
        expectedReturnDate: "2025-12-30T00:00:00Z",
      });

      // Try to rent again when none available
      await expect(
        app.do("RentItem", { stream, actor }, {
          renterId: "renter-2",
          quantity: 1,
          expectedReturnDate: "2025-12-30T00:00:00Z",
        })
      ).rejects.toThrow("Item must have available quantity");
    });

    it("should return and increase available quantity", async () => {
      const stream = "item-return-qty";
      await createTestItem(stream, { initialQuantity: 5 });

      // Rent 1 unit
      await app.do("RentItem", { stream, actor }, {
        renterId: "renter-1",
        quantity: 1,
        expectedReturnDate: "2025-12-30T00:00:00Z",
      });

      // Get rental ID from the active rentals
      let snapshot = await app.load(RentalItem, stream);
      expect(snapshot.state.availableQuantity).toBe(4); // 5 - 1 = 4
      const rentalId = snapshot.state.activeRentals[0].rentalId;

      // Return the rental
      await app.do("ReturnItem", { stream, actor }, { rentalId });

      snapshot = await app.load(RentalItem, stream);
      expect(snapshot.state.availableQuantity).toBe(5); // Back to full
      expect(snapshot.state.activeRentals).toHaveLength(0);
      expect(snapshot.state.status).toBe(ItemStatus.Available);
    });

    it("should handle multiple concurrent rentals", async () => {
      const stream = "item-concurrent-rentals";
      await createTestItem(stream, { initialQuantity: 10 });

      // Rent by first customer
      await app.do("RentItem", { stream, actor }, {
        renterId: "customer-1",
        quantity: 3,
        expectedReturnDate: "2025-12-30T00:00:00Z",
      });

      // Rent by second customer
      await app.do("RentItem", { stream, actor }, {
        renterId: "customer-2",
        quantity: 2,
        expectedReturnDate: "2025-12-31T00:00:00Z",
      });

      let snapshot = await app.load(RentalItem, stream);
      expect(snapshot.state.availableQuantity).toBe(5); // 10 - 3 - 2 = 5
      expect(snapshot.state.activeRentals).toHaveLength(2);

      // Return first rental
      const firstRentalId = snapshot.state.activeRentals[0].rentalId;
      await app.do("ReturnItem", { stream, actor }, { rentalId: firstRentalId });

      snapshot = await app.load(RentalItem, stream);
      expect(snapshot.state.availableQuantity).toBe(8); // 5 + 3 = 8
      expect(snapshot.state.activeRentals).toHaveLength(1);
    });
  });

  describe("SKU Management (Admin)", () => {
    it("should add SKUs to existing item", async () => {
      const stream = "item-add-skus";
      await createTestItem(stream, { initialQuantity: 5 });

      await app.do("AddSkus", { stream, actor }, {
        quantity: 3,
        reason: "Restocking",
      });

      const snapshot = await app.load(RentalItem, stream);
      expect(snapshot.state.totalQuantity).toBe(8);
      expect(snapshot.state.availableQuantity).toBe(8);
      expect(snapshot.state.skus).toHaveLength(8);
    });

    it("should remove SKUs from item", async () => {
      const stream = "item-remove-skus";
      await createTestItem(stream, { initialQuantity: 10 });

      // Get the first 3 available SKUs
      let snapshot = await app.load(RentalItem, stream);
      const skusToRemove = snapshot.state.skus.slice(0, 3).map(s => s.sku);

      await app.do("RemoveSkus", { stream, actor }, {
        skus: skusToRemove,
        reason: "Damaged units",
      });

      snapshot = await app.load(RentalItem, stream);
      expect(snapshot.state.totalQuantity).toBe(7);
      expect(snapshot.state.availableQuantity).toBe(7);
      expect(snapshot.state.skus).toHaveLength(7);
    });
  });

  describe("Pricing Management", () => {
    it("should set base price and recalculate current price", async () => {
      const stream = "item-price-set";
      await createTestItem(stream, { basePrice: 50 });

      await app.do("SetBasePrice", { stream, actor }, { newPrice: 75 });

      const snapshot = await app.load(RentalItem, stream);
      expect(snapshot.state.basePrice).toBe(75);
      expect(snapshot.state.currentPrice).toBe(75); // 100% availability
    });

    it("should change pricing strategy", async () => {
      const stream = "item-strategy-change";
      await createTestItem(stream, { pricingStrategy: PricingStrategy.Linear });

      await app.do("SetPricingStrategy", { stream, actor }, {
        strategy: PricingStrategy.Tiered,
      });

      const snapshot = await app.load(RentalItem, stream);
      expect(snapshot.state.pricingStrategy).toBe(PricingStrategy.Tiered);
    });
  });

  describe("Damage and Maintenance", () => {
    it("should quarantine an item when damage is reported", async () => {
      const stream = "item-damage-report";
      await createTestItem(stream, { initialQuantity: 5 });

      await app.do("ReportDamage", { stream, actor }, {
        description: "Scratched sensor",
      });

      const snapshot = await app.load(RentalItem, stream);
      expect(snapshot.state.status).toBe(ItemStatus.Quarantined);
      expect(snapshot.state.condition).toBe(ItemCondition.Damaged);
      expect(snapshot.state.damageReport).toBe("Scratched sensor");
    });

    it("should transition to maintenance and back to available", async () => {
      const stream = "item-maintenance-cycle";
      await createTestItem(stream, { initialQuantity: 5 });

      await app.do("ScheduleMaintenance", { stream, actor }, {
        reason: "Routine Check",
        scheduledDate: new Date().toISOString(),
      });

      let snapshot = await app.load(RentalItem, stream);
      expect(snapshot.state.status).toBe(ItemStatus.Maintenance);

      await app.do("CompleteMaintenance", { stream, actor }, {});
      snapshot = await app.load(RentalItem, stream);
      expect(snapshot.state.status).toBe(ItemStatus.Available);
    });

    it("should allow returning an item that was damaged while rented", async () => {
      const stream = "item-damaged-while-rented";
      await createTestItem(stream, { initialQuantity: 5 });

      await app.do("RentItem", { stream, actor }, {
        renterId: "User1",
        quantity: 1,
        expectedReturnDate: new Date().toISOString(),
      });

      // Get rental ID from the active rentals
      let snapshot = await app.load(RentalItem, stream);
      const rentalId = snapshot.state.activeRentals[0].rentalId;

      await app.do("ReportDamage", { stream, actor }, {
        description: "Lens cracked",
      });

      await app.do("ReturnItem", { stream, actor }, { rentalId });

      snapshot = await app.load(RentalItem, stream);
      expect(snapshot.state.activeRentals).toHaveLength(0);
      expect(snapshot.state.status).toBe(ItemStatus.Quarantined);
    });
  });

  describe("Item Retirement", () => {
    it("should retire an item", async () => {
      const stream = "item-retire";
      await createTestItem(stream);

      await app.do("RetireItem", { stream, actor }, {
        reason: "Too many repairs",
      });

      const snapshot = await app.load(RentalItem, stream);
      expect(snapshot.state.status).toBe(ItemStatus.Retired);
      expect(snapshot.state.availableQuantity).toBe(0);
    });

    it("should not allow retiring an already retired item", async () => {
      const stream = "item-retire-twice";
      await createTestItem(stream);

      await app.do("RetireItem", { stream, actor }, { reason: "End of life" });

      await expect(
        app.do("RetireItem", { stream, actor }, { reason: "Again" })
      ).rejects.toThrow("Item must not be retired");
    });
  });

  describe("Inspection", () => {
    it("should inspect an item and update its condition", async () => {
      const stream = "item-inspect";
      await createTestItem(stream);

      await app.do("InspectItem", { stream, actor }, {
        condition: ItemCondition.Good,
        notes: "Slightly used",
      });

      const snapshot = await app.load(RentalItem, stream);
      expect(snapshot.state.condition).toBe(ItemCondition.Good);
    });
  });
});

describe("Dynamic Pricing Calculation", () => {
  it("should return base price at 100% availability", () => {
    const price = calculateDynamicPrice(50, 10, 10, PricingStrategy.Linear);
    expect(price).toBe(50);
  });

  it("should double price at 0% availability (linear)", () => {
    const price = calculateDynamicPrice(50, 10, 0, PricingStrategy.Linear);
    expect(price).toBe(100);
  });

  it("should increase price as availability decreases (linear)", () => {
    // 50% availability
    const price50 = calculateDynamicPrice(50, 10, 5, PricingStrategy.Linear);
    expect(price50).toBe(75); // 50 * (1 + 0.5) = 75

    // 25% availability
    const price25 = calculateDynamicPrice(50, 10, 2.5, PricingStrategy.Linear);
    expect(price25).toBe(87.5); // 50 * (1 + 0.75) = 87.5
  });

  it("should apply tiered pricing correctly", () => {
    // >75% availability: base price
    expect(calculateDynamicPrice(100, 10, 8, PricingStrategy.Tiered)).toBe(100);

    // 50-75%: 25% increase
    expect(calculateDynamicPrice(100, 10, 6, PricingStrategy.Tiered)).toBe(125);

    // 25-50%: 50% increase
    expect(calculateDynamicPrice(100, 10, 3, PricingStrategy.Tiered)).toBe(150);

    // <25%: 100% increase
    expect(calculateDynamicPrice(100, 10, 2, PricingStrategy.Tiered)).toBe(200);
  });

  it("should apply exponential pricing", () => {
    // At 100% availability
    expect(calculateDynamicPrice(50, 10, 10, PricingStrategy.Exponential)).toBe(50);

    // At 50% availability
    const price50 = calculateDynamicPrice(50, 10, 5, PricingStrategy.Exponential);
    expect(price50).toBeGreaterThan(75); // Exponential grows faster than linear

    // At 0% availability (approximately e^1 ≈ 2.72)
    const price0 = calculateDynamicPrice(50, 10, 0, PricingStrategy.Exponential);
    expect(price0).toBeCloseTo(136, 0); // 50 * e^1 ≈ 135.91
  });

  it("should handle edge cases", () => {
    // Zero total quantity
    expect(calculateDynamicPrice(50, 0, 0, PricingStrategy.Linear)).toBe(50);

    // Zero base price
    expect(calculateDynamicPrice(0, 10, 5, PricingStrategy.Linear)).toBe(0);
  });
});

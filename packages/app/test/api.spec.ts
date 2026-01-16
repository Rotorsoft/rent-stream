import { describe, it, expect, beforeEach } from "vitest";
import { router, app } from "../src/api/index.js";
import * as projection from "../src/api/rent-item-projection.js";
import { ItemCondition, ItemStatus, ItemCategory } from "@rent-stream/domain";

describe("API Router", () => {
  const caller = router.createCaller({});

  beforeEach(async () => {
    projection.itemReadModel.clear();
    await app.drain();
  });

  it("should create an item", async () => {
    const result = await caller.createItem({
      name: "API Item",
      serialNumber: "SN-API-1",
      condition: ItemCondition.New,
      category: ItemCategory.Other,
      initialQuantity: 5,
      basePrice: 50,
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();

    await app.correlate();
    await app.drain();

    const items = await caller.listItems();
    expect(items.length).toBe(1);
    expect(items[0].name).toBe("API Item");
    expect(items[0].totalQuantity).toBe(5);
    expect(items[0].basePrice).toBe(50);
  });

  it("should create an item with imageUrl", async () => {
    const imageUrl = "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80";
    const result = await caller.createItem({
      name: "Camera with Image",
      serialNumber: "SN-IMG-1",
      condition: ItemCondition.New,
      category: ItemCategory.Electronics,
      initialQuantity: 3,
      basePrice: 100,
      imageUrl,
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();

    await app.correlate();
    await app.drain();

    const items = await caller.listItems();
    const item = items.find(i => i.name === "Camera with Image");
    expect(item).toBeDefined();
    expect(item?.imageUrl).toBe(imageUrl);
  });

  it("should create an item without imageUrl", async () => {
    const result = await caller.createItem({
      name: "Camera without Image",
      serialNumber: "SN-NO-IMG-1",
      condition: ItemCondition.New,
      category: ItemCategory.Electronics,
      initialQuantity: 2,
      basePrice: 75,
    });

    expect(result).toBeDefined();

    await app.correlate();
    await app.drain();

    const items = await caller.listItems();
    const item = items.find(i => i.name === "Camera without Image");
    expect(item).toBeDefined();
    expect(item?.imageUrl).toBeUndefined();
  });

  it("should perform a full lifecycle via API", async () => {
    // 1. Create with quantity 1 so renting makes it out of stock
    const createRes = await caller.createItem({
      name: "Lifecycle Item",
      serialNumber: "SN-LC",
      condition: ItemCondition.New,
      category: ItemCategory.Other,
      initialQuantity: 1,
      basePrice: 50,
    });
    const itemId = createRes.id;

    // 2. Rent
    await caller.rentItem({
      itemId,
      renterId: "renter-api",
      quantity: 1,
      expectedReturnDate: new Date().toISOString(),
    });

    // Get rental ID for return
    const snapshot = await caller.getItem(itemId);
    const rentalId = snapshot.state.activeRentals[0].rentalId;

    // 3. Inspect
    await caller.inspectItem({
      itemId,
      condition: ItemCondition.Good,
      notes: "Minor wear",
    });

    // 4. Report Damage
    await caller.reportDamage({
      itemId,
      description: "Scratched surface",
    });

    // 5. Return (with rentalId)
    await caller.returnItem({ itemId, rentalId });

    // 6. Schedule Maintenance
    await caller.scheduleMaintenance({
      itemId,
      reason: "Repair scratch",
      scheduledDate: new Date().toISOString(),
    });

    // 7. Complete Maintenance
    await caller.completeMaintenance({
      itemId,
      notes: "Fixed",
    });

    // 8. Retire
    await caller.retireItem({
      itemId,
      reason: "Sold",
    });

    await app.correlate();
    await app.drain();

    // 9. Verify state via getItem query
    const result = await caller.getItem(itemId);
    expect(result.state.status).toBe(ItemStatus.Retired);

    // 10. Verify history
    const history = await caller.getHistory(itemId);
    expect(history.length).toBeGreaterThan(5);
  });

  it("should fail when returning an item that has no active rentals", async () => {
    const createRes = await caller.createItem({
      name: "Non-rented Item",
      serialNumber: "SN-NR",
      condition: ItemCondition.New,
      category: ItemCategory.Other,
      initialQuantity: 5,
      basePrice: 50,
    });
    const itemId = createRes.id;

    await expect(caller.returnItem({ itemId, rentalId: "fake-rental-id" })).rejects.toThrow("Item must have active rentals");
  });

  it("should fail when renting a retired item", async () => {
    const createRes = await caller.createItem({
      name: "To be retired",
      serialNumber: "SN-TBR",
      condition: ItemCondition.New,
      category: ItemCategory.Other,
      initialQuantity: 5,
      basePrice: 50,
    });
    const itemId = createRes.id;

    await caller.retireItem({ itemId, reason: "End of life" });

    await expect(caller.rentItem({
      itemId,
      renterId: "renter-1",
      quantity: 1,
      expectedReturnDate: new Date().toISOString(),
    })).rejects.toThrow("Item must not be retired");
  });
});

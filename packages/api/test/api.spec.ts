import { describe, it, expect, beforeEach } from "vitest";
import { router } from "../src/index.js";
import { app } from "../src/builder.js";
import * as projection from "../src/rent-item-projection.js";
import { ItemCondition, ItemStatus } from "@rent-stream/domain";

describe("API Router", () => {
  const caller = router.createCaller({});

  beforeEach(async () => {
    projection.itemReadModel.clear();
    await app.drain();
  });

  it("should create an item", async () => {
    const result: any = await caller.createItem({
      name: "API Item",
      serialNumber: "SN-API-1",
      condition: ItemCondition.New,
    });

    expect(result).toBeDefined();
    expect(result[0].event.stream).toBeDefined();
    
    await app.correlate();
    await app.drain();

    const items = await caller.listItems();
    expect(items.length).toBe(1);
    expect(items[0].name).toBe("API Item");
  });

  it("should perform a full lifecycle via API", async () => {
    // 1. Create
    const createRes: any = await caller.createItem({
      name: "Lifecycle Item",
      serialNumber: "SN-LC",
      condition: ItemCondition.New,
    });
    const itemId = createRes[0].event.stream;

    // 2. Rent
    await caller.rentItem({
      itemId,
      renterId: "renter-api",
      expectedReturnDate: new Date().toISOString(),
    });

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

    // 5. Return
    await caller.returnItem({ itemId });

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
    const result: any = await caller.getItem(itemId);
    expect(result.state.status).toBe(ItemStatus.Retired);

    // 10. Verify history
    const history = await caller.getHistory(itemId);
    expect(history.length).toBeGreaterThan(5);
  });

  it("should fail when returning an item that is not rented", async () => {
    const createRes: any = await caller.createItem({
      name: "Non-rented Item",
      serialNumber: "SN-NR",
      condition: ItemCondition.New,
    });
    const itemId = createRes[0].event.stream;

    await expect(caller.returnItem({ itemId })).rejects.toThrow("Item must be currently rented");
  });

  it("should fail when renting a retired item", async () => {
    const createRes: any = await caller.createItem({
      name: "To be retired",
      serialNumber: "SN-TBR",
      condition: ItemCondition.New,
    });
    const itemId = createRes[0].event.stream;

    await caller.retireItem({ itemId, reason: "End of life" });

    await expect(caller.rentItem({
      itemId,
      renterId: "renter-1",
      expectedReturnDate: new Date().toISOString(),
    })).rejects.toThrow("Item must be Available");
  });
});

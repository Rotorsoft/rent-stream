import { describe, it, expect } from "vitest";
import { router, app } from "../src/api/index.js";
import { ItemCondition, ItemCategory } from "@rent-stream/domain";

describe("Debug History", () => {
  const caller = router.createCaller({});

  it("should check history event structure", async () => {
    const createRes = await caller.createItem({
      name: "Debug Item",
      serialNumber: "SN-DEBUG",
      condition: ItemCondition.New,
      category: ItemCategory.Other,
      initialQuantity: 5,
      basePrice: 50,
    });
    const itemId = createRes.id;

    const events = await app.query_array({ stream: itemId });
    console.log("Raw Event Sample:", JSON.stringify(events[0], null, 2));

    const history = await caller.getHistory(itemId);
    console.log("History Event Sample:", JSON.stringify(history[0], null, 2));

    expect(history[0].name).toBeDefined();
    expect(history[0].name).not.toBeUndefined();
  });
});

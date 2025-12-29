import { useState } from "react";
import { Link } from "react-router-dom";
import { trpc } from "../utils/trpc";
import { ItemCondition } from "@rent-stream/domain/schemas";

export function Inventory() {
  const [newItemName, setNewItemName] = useState("");
  const utils = trpc.useUtils();

  const { data: items, isLoading } = trpc.listItems.useQuery();

  trpc.onInventoryUpdate.useSubscription(undefined, {
    onData: () => {
      utils.listItems.invalidate();
    },
  });

  const createItem = trpc.createItem.useMutation({
    onSuccess: () => {
      setNewItemName("");
      utils.listItems.invalidate();
    },
  });

  const handleCreate = () => {
    createItem.mutate({
      name: newItemName,
      serialNumber: "SN-" + Math.floor(Math.random() * 10000),
      condition: ItemCondition.New,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Inventory</h1>
      </div>

      {/* Create New Item */}
      <div className="bg-white p-4 rounded-lg shadow sm:flex sm:items-center sm:gap-4">
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder="New Item Name"
          className="flex-1 p-2 border rounded-md"
        />
        <button
          onClick={handleCreate}
          disabled={createItem.isPending || !newItemName}
          className="mt-2 sm:mt-0 w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {createItem.isPending ? "Creating..." : "Add Item"}
        </button>
      </div>

      {/* Item List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : items?.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No items found.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {items?.map((item: any) => (
              <li key={item.stream}>
                <Link to={`/items/${item.stream}`} className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-600 truncate">{item.name}</p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${item.status === "Available" ? "bg-green-100 text-green-800" : 
                            item.status === "Rented" ? "bg-indigo-100 text-indigo-800" : 
                            "bg-gray-100 text-gray-800"}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {item.condition}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>ID: {item.stream}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}


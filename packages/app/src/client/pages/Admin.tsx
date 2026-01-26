import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { trpc } from "../utils/trpc";
import { ItemCondition, ItemCategory, PricingStrategy, SkuStatus } from "@rent-stream/domain/schemas";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Package, Settings, TrendingUp, Minus, DollarSign, BarChart3, History } from "lucide-react";
import clsx from "clsx";
import { StockPicturePicker } from "../components/StockPicturePicker";
import { EventLogTab } from "../components/EventLogTab";

const categoryOptions = Object.values(ItemCategory);
const pricingOptions = Object.values(PricingStrategy);

type TabType = "inventory" | "events";

export function Admin() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabType) || "inventory";

  const setActiveTab = (tab: TabType) => {
    const newParams = new URLSearchParams(searchParams);
    if (tab === "inventory") {
      // Clear event-related params when switching to inventory
      newParams.delete("tab");
      newParams.delete("eventTypes");
      newParams.delete("fromDate");
      newParams.delete("toDate");
      newParams.delete("page");
    } else {
      newParams.set("tab", tab);
    }
    setSearchParams(newParams);
  };
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  // Form state for creating new item
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    category: ItemCategory.Other,
    initialQuantity: 1,
    basePrice: 25,
    pricingStrategy: PricingStrategy.Linear,
    imageUrl: undefined as string | undefined,
  });

  // Form state for quantity adjustment
  const [quantityAdjust, setQuantityAdjust] = useState({ amount: 1, reason: "" });
  const [priceAdjust, setPriceAdjust] = useState({ newPrice: 0 });

  const { data: items, refetch } = trpc.listItems.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const { data: availability } = trpc.getAvailability.useQuery();

  trpc.onInventoryUpdate.useSubscription(undefined, {
    onData: () => {
      refetch();
    },
  });

  const createItem = trpc.createItem.useMutation({
    onSuccess: () => {
      setNewItem({
        name: "",
        description: "",
        category: ItemCategory.Other,
        initialQuantity: 1,
        basePrice: 25,
        pricingStrategy: PricingStrategy.Linear,
        imageUrl: undefined,
      });
      setShowCreateForm(false);
      refetch();
    },
  });

  const addSkus = trpc.addSkus.useMutation({ onSuccess: () => refetch() });
  const removeSkus = trpc.removeSkus.useMutation({ onSuccess: () => refetch() });
  const setBasePrice = trpc.setBasePrice.useMutation({ onSuccess: () => refetch() });
  const setPricingStrategy = trpc.setPricingStrategy.useMutation({ onSuccess: () => refetch() });

  const handleCreate = () => {
    createItem.mutate({
      name: newItem.name,
      description: newItem.description || undefined,
      serialNumber: "SN-" + Math.floor(Math.random() * 100000),
      category: newItem.category,
      condition: ItemCondition.New,
      initialQuantity: newItem.initialQuantity,
      basePrice: newItem.basePrice,
      pricingStrategy: newItem.pricingStrategy,
      imageUrl: newItem.imageUrl,
    });
  };

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage inventory, pricing, and quantities.</p>
        </div>
        {activeTab === "inventory" && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-brand-500/30 flex items-center gap-2"
          >
            <Plus size={18} />
            Add New Item
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("inventory")}
          className={clsx(
            "px-4 py-2 rounded-lg font-medium text-sm transition-all relative",
            activeTab === "inventory"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <div className="flex items-center gap-2">
            <Package size={16} />
            Inventory
          </div>
        </button>
        <button
          onClick={() => setActiveTab("events")}
          className={clsx(
            "px-4 py-2 rounded-lg font-medium text-sm transition-all relative",
            activeTab === "events"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <div className="flex items-center gap-2">
            <History size={16} />
            Event Log
          </div>
        </button>
      </div>

      {/* Inventory Tab Content */}
      {activeTab === "inventory" && (
        <>
          {/* Stats Cards */}
          {availability && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass p-5 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-100 rounded-lg">
                <Package className="text-brand-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Items</p>
                <p className="text-2xl font-bold text-slate-900">{availability.totalItems}</p>
              </div>
            </div>
          </div>
          <div className="glass p-5 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Quantity</p>
                <p className="text-2xl font-bold text-slate-900">{availability.totalQuantity}</p>
              </div>
            </div>
          </div>
          <div className="glass p-5 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Available</p>
                <p className="text-2xl font-bold text-slate-900">{availability.availableQuantity}</p>
              </div>
            </div>
          </div>
          <div className="glass p-5 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <DollarSign className="text-orange-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Rented Out</p>
                <p className="text-2xl font-bold text-slate-900">
                  {availability.totalQuantity - availability.availableQuantity}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Item Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass p-6 rounded-2xl space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Create New Item</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Item Name
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      placeholder="e.g. Mountain Bike"
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none"
                    />
                    <StockPicturePicker
                      value={newItem.imageUrl}
                      onChange={(url) => setNewItem({ ...newItem, imageUrl: url })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Category
                  </label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value as ItemCategory })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none"
                  >
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Initial Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newItem.initialQuantity}
                    onChange={(e) => setNewItem({ ...newItem, initialQuantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Base Price ($/day)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={newItem.basePrice}
                    onChange={(e) => setNewItem({ ...newItem, basePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Pricing Strategy
                  </label>
                  <select
                    value={newItem.pricingStrategy}
                    onChange={(e) => setNewItem({ ...newItem, pricingStrategy: e.target.value as PricingStrategy })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none"
                  >
                    {pricingOptions.map((strat) => (
                      <option key={strat} value={strat}>{strat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Brief description..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCreate}
                  disabled={!newItem.name || createItem.isPending}
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-brand-500/30 disabled:opacity-50"
                >
                  {createItem.isPending ? "Creating..." : "Create Item"}
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inventory Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Base Price</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Price</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Strategy</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items?.map((item) => (
                <tr key={item.stream} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl.replace("w=800", "w=100")}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Package className="text-slate-400" size={20} />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.serialNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        "font-semibold",
                        item.availableQuantity === 0 ? "text-red-600" :
                        item.availableQuantity <= 2 ? "text-orange-600" : "text-green-600"
                      )}>
                        {item.availableQuantity}
                      </span>
                      <span className="text-slate-400">/</span>
                      <span className="text-slate-600">{item.totalQuantity}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-medium">{formatPrice(item.basePrice)}</td>
                  <td className="px-6 py-4">
                    <span className={clsx(
                      "font-semibold",
                      item.currentPrice > item.basePrice ? "text-orange-600" : "text-slate-700"
                    )}>
                      {formatPrice(item.currentPrice)}
                    </span>
                    {item.currentPrice > item.basePrice && (
                      <span className="ml-1 text-xs text-orange-500">
                        (+{Math.round((item.currentPrice / item.basePrice - 1) * 100)}%)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600 capitalize">{item.pricingStrategy}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setEditingItem(editingItem === item.stream ? null : item.stream)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Settings size={18} className="text-slate-500" />
                    </button>
                  </td>
                </tr>
              ))}
              {items?.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No items yet. Create your first item above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {/* Event Log Tab Content */}
      {activeTab === "events" && <EventLogTab />}

      {/* Edit Modal */}
      <AnimatePresence>
        {editingItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setEditingItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const item = items?.find(i => i.stream === editingItem);
                if (!item) return null;
                return (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
                      <p className="text-sm text-slate-500">Manage inventory and pricing</p>
                    </div>

                    {/* Quantity Adjustment */}
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Adjust Quantity
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min={1}
                          value={quantityAdjust.amount}
                          onChange={(e) => setQuantityAdjust({ ...quantityAdjust, amount: parseInt(e.target.value) || 1 })}
                          className="w-20 px-3 py-2 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                        />
                        <button
                          onClick={() => {
                            addSkus.mutate({
                              itemId: item.stream,
                              quantity: quantityAdjust.amount,
                              reason: quantityAdjust.reason || undefined,
                            });
                          }}
                          disabled={addSkus.isPending}
                          className="flex-1 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus size={16} />
                          Add
                        </button>
                        <button
                          onClick={() => {
                            // Get available SKUs to remove
                            const availableSkus = item.skus
                              ?.filter(s => s.status === SkuStatus.Available)
                              .slice(0, quantityAdjust.amount)
                              .map(s => s.sku) || [];
                            if (availableSkus.length > 0) {
                              removeSkus.mutate({
                                itemId: item.stream,
                                skus: availableSkus,
                                reason: quantityAdjust.reason || "Removed by admin",
                              });
                            }
                          }}
                          disabled={removeSkus.isPending || item.availableQuantity < quantityAdjust.amount}
                          className="flex-1 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <Minus size={16} />
                          Remove
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Reason (optional)"
                        value={quantityAdjust.reason}
                        onChange={(e) => setQuantityAdjust({ ...quantityAdjust, reason: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 text-sm"
                      />
                    </div>

                    {/* Price Adjustment */}
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Set Base Price
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={priceAdjust.newPrice || item.basePrice}
                            onChange={(e) => setPriceAdjust({ newPrice: parseFloat(e.target.value) || 0 })}
                            className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                          />
                        </div>
                        <button
                          onClick={() => {
                            setBasePrice.mutate({
                              itemId: item.stream,
                              newPrice: priceAdjust.newPrice || item.basePrice,
                            });
                          }}
                          disabled={setBasePrice.isPending}
                          className="px-4 py-2 bg-brand-100 hover:bg-brand-200 text-brand-700 font-medium rounded-lg transition-colors"
                        >
                          Update
                        </button>
                      </div>
                    </div>

                    {/* Pricing Strategy */}
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Pricing Strategy
                      </label>
                      <div className="flex gap-2">
                        {pricingOptions.map((strat) => (
                          <button
                            key={strat}
                            onClick={() => {
                              setPricingStrategy.mutate({
                                itemId: item.stream,
                                strategy: strat,
                              });
                            }}
                            className={clsx(
                              "flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors capitalize",
                              item.pricingStrategy === strat
                                ? "bg-brand-600 text-white"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            )}
                          >
                            {strat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setEditingItem(null)}
                      className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
                    >
                      Done
                    </button>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

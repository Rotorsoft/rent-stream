import { useState } from "react";
import { Link } from "react-router-dom";
import { trpc } from "../utils/trpc";
import { ItemCategory } from "@rent-stream/domain/schemas";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Search, CheckCircle2, Clock, AlertCircle, TrendingUp, Filter } from "lucide-react";
import clsx from "clsx";

const itemAnim = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const categoryOptions = [
  { value: undefined, label: "All Categories" },
  ...Object.values(ItemCategory).map(cat => ({ value: cat, label: cat }))
];

export function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | undefined>(undefined);
  const [showInStockOnly, setShowInStockOnly] = useState(false);

  const { data: items, isLoading, refetch } = trpc.listItems.useQuery(
    { category: selectedCategory, inStock: showInStockOnly ? true : undefined },
    { refetchOnWindowFocus: false }
  );

  trpc.onInventoryUpdate.useSubscription(undefined, {
    onData: () => {
      refetch();
    },
  });

  // Client-side search filtering
  const filteredItems = items?.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available": return "bg-green-100 text-green-700 border-green-200";
      case "OutOfStock": return "bg-red-100 text-red-700 border-red-200";
      case "Rented": return "bg-brand-100 text-brand-700 border-brand-200";
      case "Maintenance": return "bg-orange-100 text-orange-700 border-orange-200";
      case "Quarantined": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Available": return <CheckCircle2 size={14} />;
      case "OutOfStock": return <AlertCircle size={14} />;
      case "Rented": return <Clock size={14} />;
      case "Maintenance": return <AlertCircle size={14} />;
      default: return <Package size={14} />;
    }
  };

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  const getAvailabilityText = (available: number, total: number) => {
    if (available === 0) return "Out of stock";
    if (available === 1) return "Last one!";
    if (available <= 3) return `Only ${available} left`;
    return `${available} available`;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Inventory</h1>
          <p className="text-slate-500 mt-1">Browse and rent equipment.</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Search */}
          <div className="relative bg-white rounded-xl shadow-sm border border-slate-200">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="pl-10 pr-4 py-2.5 bg-transparent border-none focus:ring-0 text-sm w-full md:w-64 rounded-xl"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select
              value={selectedCategory || ""}
              onChange={(e) => setSelectedCategory(e.target.value as ItemCategory || undefined)}
              className="pl-9 pr-4 py-2.5 bg-white rounded-xl shadow-sm border border-slate-200 text-sm appearance-none cursor-pointer"
            >
              {categoryOptions.map((opt) => (
                <option key={opt.label} value={opt.value || ""}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* In Stock Toggle */}
          <button
            onClick={() => setShowInStockOnly(!showInStockOnly)}
            className={clsx(
              "px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border",
              showInStockOnly
                ? "bg-green-100 text-green-700 border-green-200"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            In Stock Only
          </button>
        </div>
      </div>

      {/* Item Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredItems?.length === 0 && (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-span-full text-center py-20 bg-white/50 rounded-3xl border border-dashed border-slate-300"
              >
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="text-slate-400" size={32} />
                </div>
                <h3 className="text-lg font-medium text-slate-900">No items found</h3>
                <p className="text-slate-500">Try adjusting your filters or search query.</p>
              </motion.div>
            )}
            {filteredItems?.map((item) => (
              <motion.div
                key={item.stream}
                layout
                initial={itemAnim.initial}
                animate={itemAnim.animate}
                exit={itemAnim.exit}
                transition={{ duration: 0.2 }}
              >
                <Link to={`/items/${item.stream}`} className="block h-full">
                  <div className="group h-full bg-white hover:bg-white/80 border border-slate-100 hover:border-brand-200 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-brand-500/10 transition-all duration-300 relative overflow-hidden flex flex-col">
                    {/* Thumbnail */}
                    {item.imageUrl ? (
                      <div className="h-36 overflow-hidden relative">
                        <img
                          src={item.imageUrl.replace("w=800", "w=400")}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* Price overlay */}
                        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-sm">
                          <span className="font-bold text-brand-600">{formatPrice(item.currentPrice)}</span>
                          <span className="text-xs text-slate-500">/day</span>
                          {item.currentPrice > item.basePrice && (
                            <TrendingUp size={12} className="inline ml-1 text-orange-500" />
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-36 bg-slate-50 flex items-center justify-center relative">
                        <Package className="text-slate-200" size={48} />
                        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-sm">
                          <span className="font-bold text-brand-600">{formatPrice(item.currentPrice)}</span>
                          <span className="text-xs text-slate-500">/day</span>
                        </div>
                      </div>
                    )}

                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-3">
                        <div className={clsx("px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5", getStatusColor(item.status))}>
                          {getStatusIcon(item.status)}
                          {item.status === "OutOfStock" ? "Out of Stock" : item.status}
                        </div>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                          {item.category}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-1 group-hover:text-brand-600 transition-colors">
                        {item.name}
                      </h3>

                      {/* Availability indicator */}
                      <div className={clsx(
                        "text-sm font-medium mb-3",
                        item.availableQuantity === 0 ? "text-red-600" :
                        item.availableQuantity <= 3 ? "text-orange-600" : "text-green-600"
                      )}>
                        {getAvailabilityText(item.availableQuantity, item.totalQuantity)}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                        <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                          {item.stream.split('-').pop()}
                        </span>
                        <span>•</span>
                        <span>{item.condition}</span>
                      </div>

                      <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center text-xs font-medium text-slate-400 group-hover:text-brand-500 transition-colors">
                        <span>View Details</span>
                        <span className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                          &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

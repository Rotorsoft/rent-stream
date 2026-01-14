import { useState } from "react";
import { Link } from "react-router-dom";
import { trpc } from "../utils/trpc";
import { ItemCondition } from "@rent-stream/domain/schemas";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Package, Search, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import clsx from "clsx";
import { StockPicturePicker } from "../components/StockPicturePicker";

const itemAnim = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export function Inventory() {
  const [newItemName, setNewItemName] = useState("");
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | undefined>(undefined);

  const { data: items, isLoading, refetch } = trpc.listItems.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  trpc.onInventoryUpdate.useSubscription(undefined, {
    onData: () => {
      refetch();
    },
  });

  const createItem = trpc.createItem.useMutation({
    onSuccess: async () => {
      setNewItemName("");
      setSelectedImageUrl(undefined);
      await refetch();
    },
  });

  const handleCreate = () => {
    createItem.mutate({
      name: newItemName,
      serialNumber: "SN-" + Math.floor(Math.random() * 10000),
      condition: ItemCondition.New,
      imageUrl: selectedImageUrl,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available": return "bg-green-100 text-green-700 border-green-200";
      case "Rented": return "bg-brand-100 text-brand-700 border-brand-200";
      case "Maintenance": return "bg-orange-100 text-orange-700 border-orange-200";
      case "Quarantined": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Available": return <CheckCircle2 size={14} />;
      case "Rented": return <Clock size={14} />;
      case "Maintenance": return <AlertCircle size={14} />;
      default: return <Package size={14} />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Inventory</h1>
          <p className="text-slate-500 mt-1">Manage your rental assets efficiently.</p>
        </div>
        
        <div className="flex gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search items..." 
              className="pl-10 pr-4 py-2 bg-transparent border-none focus:ring-0 text-sm w-full md:w-64"
            />
          </div>
        </div>
      </div>

      {/* Create New Item Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-6 rounded-2xl"
      >
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Add New Item</label>
            <div className="flex gap-3 items-center">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g. Sony A7III Camera Kit"
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none"
              />
              <StockPicturePicker value={selectedImageUrl} onChange={setSelectedImageUrl} />
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={createItem.isPending || !newItemName}
            className="w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-medium rounded-xl transition-all shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
          >
            {createItem.isPending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Plus size={18} />
                <span>Add Item</span>
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Item Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {items?.length === 0 && (
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
                <h3 className="text-lg font-medium text-slate-900">No items yet</h3>
                <p className="text-slate-500">Create your first item to get started.</p>
              </motion.div>
            )}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {items?.map((item: any) => (
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
                      <div className="h-32 overflow-hidden">
                        <img
                          src={item.imageUrl.replace("w=800", "w=400")}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="h-32 bg-slate-50 flex items-center justify-center">
                        <Package className="text-slate-200" size={48} />
                      </div>
                    )}

                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-3">
                        <div className={clsx("px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5", getStatusColor(item.status))}>
                          {getStatusIcon(item.status)}
                          {item.status}
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-1 group-hover:text-brand-600 transition-colors">
                        {item.name}
                      </h3>

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


import { Link, useParams } from "react-router-dom";
import { ActionButtons } from "../components/ActionButtons";
import { Timeline } from "../components/Timeline";
import { trpc } from "../utils/trpc";
import { motion } from "framer-motion";
import { ArrowLeft, Package, Activity, AlertTriangle, User, ImageIcon } from "lucide-react";
import clsx from "clsx";

export function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const utils = trpc.useUtils();

  const { data: snapshot, isLoading, refetch } = trpc.getItem.useQuery(id!, {
    enabled: !!id,
  });

  trpc.onInventoryUpdate.useSubscription(undefined, {
    onData: () => {
      refetch();
      utils.getHistory.invalidate(id!);
    },
  });

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  );
  
  if (!snapshot) return (
    <div className="text-center py-20">
      <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-slate-700">Item not found</h2>
      <Link to="/" className="text-brand-600 hover:underline mt-2 inline-block">Return to Inventory</Link>
    </div>
  );

  const item = { ...snapshot.state, id: id };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available": return "bg-green-100 text-green-700 border-green-200";
      case "Rented": return "bg-brand-100 text-brand-700 border-brand-200";
      case "Maintenance": return "bg-orange-100 text-orange-700 border-orange-200";
      case "Quarantined": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-start gap-4">
          <Link 
            to="/" 
            className="group p-2 -ml-2 rounded-xl hover:bg-white/50 transition-colors"
            title="Back to Inventory"
          >
            <ArrowLeft className="text-slate-500 group-hover:text-brand-600 transition-colors" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{item.name}</h1>
              <span className={clsx("px-3 py-1 rounded-full text-sm font-bold border", getStatusColor(item.status))}>
                {item.status}
              </span>
            </div>
            <p className="text-slate-500 flex items-center gap-2">
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-sm text-slate-600 border border-slate-200">
                {item.serialNumber}
              </span>
              <span>•</span>
              <span className="text-sm font-medium text-slate-600">{item.condition}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">

          {/* Item Image */}
          {item.imageUrl ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-2xl overflow-hidden"
            >
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-64 object-cover"
              />
            </motion.div>
          ) : (
            <div className="glass rounded-2xl h-48 flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No image available</p>
              </div>
            </div>
          )}

          {/* Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass p-5 rounded-2xl flex items-start gap-4">
              <div className="p-3 bg-brand-50 rounded-xl text-brand-600">
                <User size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Current Renter</p>
                <p className="text-lg font-semibold text-slate-900 mt-0.5">
                  {item.currentRenterId || "Not currently rented"}
                </p>
              </div>
            </div>

            <div className="glass p-5 rounded-2xl flex items-start gap-4">
              <div className={clsx("p-3 rounded-xl", item.damageReport ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600")}>
                <Activity size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Health Check</p>
                <p className="text-lg font-semibold text-slate-900 mt-0.5">
                  {item.damageReport ? "Damage Reported" : "Fully Operational"}
                </p>
              </div>
            </div>
          </div>

          {item.damageReport && (
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-red-50 border border-red-100 rounded-2xl p-5 flex gap-4"
              >
               <AlertTriangle className="text-red-600 shrink-0" />
               <div>
                 <h3 className="font-semibold text-red-900">Damage Report</h3>
                 <p className="text-red-700 mt-1">{item.damageReport}</p>
               </div>
             </motion.div>
          )}

          <div className="glass p-6 rounded-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Activity className="text-brand-500" size={20} />
              Event History
            </h2>
            <Timeline itemId={id!} />
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl sticky top-24">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Actions</h2>
            <ActionButtons
              item={item}
              refetch={() => {
                refetch();
                utils.getHistory.invalidate(id!);
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}


import { trpc } from "../utils/trpc";
import { CheckCircle2, AlertTriangle, PenTool, UserPlus, UserMinus, History } from "lucide-react";
import { motion } from "framer-motion";

export function Timeline({ itemId }: { itemId: string }) {
  const { data: history, isLoading, refetch } = trpc.getHistory.useQuery(itemId);

  trpc.onInventoryUpdate.useSubscription(undefined, {
    onData: () => {
      refetch();
    },
  });

  if (isLoading) return <div className="text-sm text-slate-500 italic">Loading history...</div>;
  if (!history || history.length === 0) return <div className="text-sm text-slate-500 italic">No history found.</div>;

  const getEventIcon = (eventName: string) => {
    switch (eventName) {
      case "ItemRented": return <UserPlus size={14} />;
      case "ItemReturned": return <UserMinus size={14} />;
      case "DamageReported": return <AlertTriangle size={14} />;
      case "MaintenanceScheduled": return <History size={14} />;
      case "MaintenanceCompleted": return <PenTool size={14} />;
      default: return <CheckCircle2 size={14} />;
    }
  };

  const getEventColor = (eventName: string) => {
    switch (eventName) {
      case "ItemRented": return "bg-brand-100 text-brand-600 ring-brand-200";
      case "DamageReported": return "bg-red-100 text-red-600 ring-red-200";
      case "MaintenanceScheduled": return "bg-orange-100 text-orange-600 ring-orange-200";
      default: return "bg-slate-100 text-slate-600 ring-slate-200";
    }
  };

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {history.map((event: any, eventIdx: number) => (
          <motion.li 
            key={event.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: eventIdx * 0.05 }}
          >
            <div className="relative pb-8">
              {eventIdx !== history.length - 1 ? (
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getEventColor(event.name)}`}>
                    {getEventIcon(event.name)}
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-1.5 space-y-2">
                  <div className="flex justify-between space-x-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {(event.name || 'Unknown Event').replace(/([A-Z])/g, ' $1').trim()} 
                      </p>
                    </div>
                    <div className="text-right text-sm whitespace-nowrap text-slate-500">
                      <time dateTime={event.created}>{new Date(event.created).toLocaleString()}</time>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 bg-slate-50 border border-slate-100 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                    {/* Pretty print JSON but hide empty objects */}
                    {Object.keys(event.data).length > 0 
                      ? Object.entries(event.data).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-semibold text-slate-500">{key}:</span> {String(value)}
                          </div>
                        ))
                      : <span className="text-slate-400 italic">No additional data</span>
                    }
                  </div>
                </div>
              </div>
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}


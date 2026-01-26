import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { trpc } from "../utils/trpc";
import { motion } from "framer-motion";
import { Filter, Calendar, ChevronLeft, ChevronRight, X, History } from "lucide-react";
import clsx from "clsx";

// Helper to format event data for display
function formatEventData(eventName: string, data: Record<string, unknown>): string {
  switch (eventName) {
    case "ItemCreated":
      return `Created with ${(data.initialSkus as string[])?.length || 0} units at $${data.basePrice}/day`;
    case "ItemRented":
      return `Rented ${(data.skus as string[])?.length || 1} unit(s) to ${data.renterId}`;
    case "ItemReturned":
      return `${(data.skusReturned as string[])?.length || 1} unit(s) returned`;
    case "SkusAdded":
      return `Added ${(data.skus as string[])?.length || 0} new SKUs`;
    case "SkusRemoved":
      return `Removed ${(data.skus as string[])?.length || 0} SKUs: ${data.reason}`;
    case "BasePriceSet":
      return `Price changed from $${data.previousPrice} to $${data.newPrice}`;
    case "PricingStrategyChanged":
      return `Strategy: ${data.previousStrategy} → ${data.newStrategy}`;
    case "DamageReported":
      return `${data.description}`;
    case "MaintenanceScheduled":
      return `${data.reason}`;
    case "MaintenanceCompleted":
      return data.notes ? `${data.notes}` : "Maintenance complete";
    case "ItemRetired":
      return `${data.reason}`;
    default:
      return "";
  }
}

// Helper to format relative time
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

const eventColorMap: Record<string, string> = {
  ItemCreated: "bg-green-100 text-green-700",
  ItemRented: "bg-blue-100 text-blue-700",
  ItemReturned: "bg-purple-100 text-purple-700",
  SkusAdded: "bg-emerald-100 text-emerald-700",
  SkusRemoved: "bg-red-100 text-red-700",
  BasePriceSet: "bg-orange-100 text-orange-700",
  PricingStrategyChanged: "bg-yellow-100 text-yellow-700",
  DamageReported: "bg-red-100 text-red-700",
  MaintenanceScheduled: "bg-amber-100 text-amber-700",
  MaintenanceCompleted: "bg-teal-100 text-teal-700",
  ItemRetired: "bg-slate-100 text-slate-700",
};

const PAGE_SIZE = 20;

export function EventLogTab() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse URL params
  const selectedTypes = searchParams.get("eventTypes")?.split(",").filter(Boolean) || [];
  const fromDate = searchParams.get("fromDate") || "";
  const toDate = searchParams.get("toDate") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  // Local filter state for UI (only used when filter panel is open)
  const [showFilters, setShowFilters] = useState(false);
  const [localTypes, setLocalTypes] = useState<string[]>([]);
  const [localFromDate, setLocalFromDate] = useState("");
  const [localToDate, setLocalToDate] = useState("");

  // Open filter panel and sync local state from URL
  const openFilters = () => {
    setLocalTypes(selectedTypes);
    setLocalFromDate(fromDate);
    setLocalToDate(toDate);
    setShowFilters(true);
  };

  const { data: eventTypes } = trpc.getEventTypes.useQuery();

  const { data, isLoading, refetch } = trpc.getEventLog.useQuery({
    names: selectedTypes.length > 0 ? selectedTypes : undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  }, {
    refetchOnWindowFocus: false,
  });

  trpc.onInventoryUpdate.useSubscription(undefined, {
    onData: () => refetch(),
  });

  const updateFilters = (updates: { types?: string[]; from?: string; to?: string; p?: number }) => {
    const newParams = new URLSearchParams(searchParams);

    // Always keep tab=events
    newParams.set("tab", "events");

    if (updates.types !== undefined) {
      if (updates.types.length > 0) {
        newParams.set("eventTypes", updates.types.join(","));
      } else {
        newParams.delete("eventTypes");
      }
    }

    if (updates.from !== undefined) {
      if (updates.from) {
        newParams.set("fromDate", updates.from);
      } else {
        newParams.delete("fromDate");
      }
    }

    if (updates.to !== undefined) {
      if (updates.to) {
        newParams.set("toDate", updates.to);
      } else {
        newParams.delete("toDate");
      }
    }

    if (updates.p !== undefined) {
      if (updates.p > 1) {
        newParams.set("page", String(updates.p));
      } else {
        newParams.delete("page");
      }
    }

    setSearchParams(newParams);
  };

  const applyFilters = () => {
    updateFilters({ types: localTypes, from: localFromDate, to: localToDate, p: 1 });
    setShowFilters(false);
  };

  const clearFilters = () => {
    setLocalTypes([]);
    setLocalFromDate("");
    setLocalToDate("");
    updateFilters({ types: [], from: "", to: "", p: 1 });
  };

  const toggleEventType = (type: string) => {
    setLocalTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const hasActiveFilters = selectedTypes.length > 0 || fromDate || toDate;
  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  return (
    <div className="space-y-6">
      {/* Header with filter controls */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 rounded-lg">
              <History className="text-brand-600" size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Event Log</h2>
              <p className="text-xs text-slate-500">
                {data ? `${data.total} event${data.total !== 1 ? "s" : ""}` : "Loading..."}
                {hasActiveFilters && " (filtered)"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
              >
                <X size={14} />
                Clear
              </button>
            )}
            <button
              onClick={() => showFilters ? setShowFilters(false) : openFilters()}
              className={clsx(
                "px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2",
                showFilters || hasActiveFilters
                  ? "bg-brand-100 text-brand-700"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
            >
              <Filter size={16} />
              Filters
              {hasActiveFilters && (
                <span className="bg-brand-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {(selectedTypes.length > 0 ? 1 : 0) + (fromDate ? 1 : 0) + (toDate ? 1 : 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Expandable filter panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-slate-100"
          >
            <div className="space-y-4">
              {/* Event type filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Event Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {eventTypes?.map((type) => (
                    <button
                      key={type}
                      onClick={() => toggleEventType(type)}
                      className={clsx(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                        localTypes.includes(type)
                          ? eventColorMap[type] || "bg-slate-200 text-slate-700"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {type.replace(/([A-Z])/g, " $1").trim()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date range filter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    <Calendar size={12} className="inline mr-1" />
                    From Date
                  </label>
                  <input
                    type="date"
                    value={localFromDate}
                    onChange={(e) => setLocalFromDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    <Calendar size={12} className="inline mr-1" />
                    To Date
                  </label>
                  <input
                    type="date"
                    value={localToDate}
                    onChange={(e) => setLocalToDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Apply button */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm rounded-lg transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && !showFilters && (
        <div className="flex flex-wrap gap-2">
          {selectedTypes.map((type) => (
            <span
              key={type}
              className={clsx(
                "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                eventColorMap[type] || "bg-slate-100 text-slate-600"
              )}
            >
              {type.replace(/([A-Z])/g, " $1").trim()}
              <button
                onClick={() => updateFilters({ types: selectedTypes.filter((t) => t !== type), p: 1 })}
                className="hover:opacity-70"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {fromDate && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 flex items-center gap-1">
              From: {new Date(fromDate).toLocaleDateString()}
              <button
                onClick={() => updateFilters({ from: "", p: 1 })}
                className="hover:opacity-70"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {toDate && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 flex items-center gap-1">
              To: {new Date(toDate).toLocaleDateString()}
              <button
                onClick={() => updateFilters({ to: "", p: 1 })}
                className="hover:opacity-70"
              >
                <X size={12} />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Event list */}
      <div className="glass rounded-2xl overflow-hidden">
        {isLoading && (
          <div className="px-6 py-12 text-center text-slate-500">
            <div className="animate-pulse">Loading events...</div>
          </div>
        )}

        {!isLoading && data?.events.length === 0 && (
          <div className="px-6 py-12 text-center text-slate-500">
            {hasActiveFilters
              ? "No events match your filters. Try adjusting your criteria."
              : "No events yet."}
          </div>
        )}

        {!isLoading && data && data.events.length > 0 && (
          <div className="divide-y divide-slate-100">
            {data.events.map((event, idx) => (
              <motion.div
                key={`${event.stream}-${event.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="px-4 py-3 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={clsx(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          eventColorMap[event.name] || "bg-slate-100 text-slate-600"
                        )}
                      >
                        {event.name.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <span className="text-sm text-slate-700 truncate">{event.itemName}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {formatEventData(event.name, event.data)}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {formatTimeAgo(event.created)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {data.offset + 1}-{Math.min(data.offset + data.events.length, data.total)} of{" "}
            {data.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateFilters({ p: page - 1 })}
              disabled={page <= 1}
              className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-3 py-1 text-sm font-medium text-slate-700">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => updateFilters({ p: page + 1 })}
              disabled={!data.hasMore}
              className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

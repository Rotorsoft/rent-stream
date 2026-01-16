import { useState } from "react";
import { trpc } from "../utils/trpc";
import { ItemStatus, ItemCondition } from "@rent-stream/domain/schemas";
import { Play, RotateCcw, OctagonAlert, ClipboardCheck, Wrench, CircleCheck, Trash2, Save, Send, Calendar, Archive, User } from "lucide-react";
import clsx from "clsx";

type ActionType = "inspect" | "damage" | "maintenance" | "complete-maintenance" | "retire" | "return" | null;

interface ActiveRental {
  rentalId: string;
  renterId: string;
  quantity: number;
  expectedReturnDate: string;
}

interface ItemProps {
  id: string;
  status: ItemStatus;
  condition: ItemCondition;
  availableQuantity: number;
  totalQuantity: number;
  currentPrice: number;
  activeRentals?: ActiveRental[];
  damageReport?: string;
  maintenanceReason?: string;
}

export function ActionButtons({ item, refetch }: { item: ItemProps; refetch: () => void }) {
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [selectedRentalId, setSelectedRentalId] = useState<string>("");
  const [rentQuantity, setRentQuantity] = useState(1);

  // Form states
  const [damageDescription, setDamageDescription] = useState("");
  const [inspectCondition, setInspectCondition] = useState<ItemCondition>(ItemCondition.Good);
  const [inspectNotes, setInspectNotes] = useState("");
  const [maintReason, setMaintReason] = useState("");
  const [maintDate, setMaintDate] = useState(new Date().toISOString().split('T')[0]);
  const [maintNotes, setMaintNotes] = useState("");
  const [retireReason, setRetireReason] = useState("");

  const onSuccess = () => {
    setActiveAction(null);
    setDamageDescription("");
    setMaintReason("");
    setRetireReason("");
    setMaintNotes("");
    setInspectNotes("");
    setSelectedRentalId("");
    setRentQuantity(1);
    refetch();
  };

  const rentItem = trpc.rentItem.useMutation({ onSuccess });
  const returnItem = trpc.returnItem.useMutation({ onSuccess });
  const reportDamage = trpc.reportDamage.useMutation({ onSuccess });
  const inspectItem = trpc.inspectItem.useMutation({ onSuccess });
  const scheduleMaintenance = trpc.scheduleMaintenance.useMutation({ onSuccess });
  const completeMaintenance = trpc.completeMaintenance.useMutation({ onSuccess });
  const retireItem = trpc.retireItem.useMutation({ onSuccess });

  const handleRent = () => {
    rentItem.mutate({
      itemId: item.id,
      renterId: "user-" + Math.random().toString(36).substr(2, 9),
      quantity: rentQuantity,
      expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  };

  const handleReturn = () => {
    if (!selectedRentalId) return;
    returnItem.mutate({ itemId: item.id, rentalId: selectedRentalId });
  };

  const handleInspect = () => {
    inspectItem.mutate({
      itemId: item.id,
      condition: inspectCondition,
      notes: inspectNotes,
    });
  };

  const handleReportDamage = () => {
    reportDamage.mutate({
      itemId: item.id,
      description: damageDescription,
    });
  };

  const handleScheduleMaint = () => {
    scheduleMaintenance.mutate({
      itemId: item.id,
      reason: maintReason,
      scheduledDate: new Date(maintDate).toISOString(),
    });
  };

  const handleCompleteMaint = () => {
    completeMaintenance.mutate({
      itemId: item.id,
      notes: maintNotes,
    });
  };

  const handleRetire = () => {
    retireItem.mutate({
      itemId: item.id,
      reason: retireReason,
    });
  };

  if (item.status === ItemStatus.Retired) {
    return <div className="p-4 bg-slate-50 text-slate-500 italic rounded-xl text-center border border-slate-200">This item is retired and cannot be modified.</div>;
  }

  const btnBase = "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm";
  const btnPrimary = "bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-500/30 hover:shadow-brand-500/40 active:transform active:scale-95";
  const btnSecondary = "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm active:bg-slate-100";
  const btnDanger = "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 hover:border-red-200";

  const hasActiveRentals = item.activeRentals && item.activeRentals.length > 0;
  const canRent = item.availableQuantity > 0 && item.status !== ItemStatus.Quarantined && item.status !== ItemStatus.Maintenance;

  return (
    <div className="flex flex-col gap-6">
      {/* Primary Actions */}
      <div className="flex flex-col gap-3">
        {/* Rent Action */}
        {canRent && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <select
                value={rentQuantity}
                onChange={(e) => setRentQuantity(parseInt(e.target.value))}
                className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium"
              >
                {Array.from({ length: Math.min(item.availableQuantity, 10) }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <button
                onClick={handleRent}
                disabled={rentItem.isPending}
                className={clsx(btnBase, btnPrimary, "flex-1 text-base")}
              >
                <Play size={18} fill="currentColor" />
                <span>{rentItem.isPending ? "Processing..." : `Rent ${rentQuantity > 1 ? `(${rentQuantity})` : ""}`}</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 text-center">
              ${(item.currentPrice * rentQuantity).toFixed(2)}/day for {rentQuantity} unit{rentQuantity > 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Return Action - Show if there are active rentals */}
        {hasActiveRentals && (
          <button
            onClick={() => setActiveAction(activeAction === 'return' ? null : 'return')}
            className={clsx(btnBase, btnPrimary, "w-full text-base", activeAction === 'return' && "ring-2 ring-brand-300")}
          >
            <RotateCcw size={18} />
            <span>Return Item</span>
          </button>
        )}
      </div>

      {/* Return Rental Selection */}
      {activeAction === 'return' && hasActiveRentals && (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <h4 className="font-medium text-slate-900 flex items-center gap-2">
            <User size={16} /> Select Rental to Return
          </h4>
          <div className="space-y-2">
            {item.activeRentals?.map((rental) => (
              <label
                key={rental.rentalId}
                className={clsx(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  selectedRentalId === rental.rentalId
                    ? "border-brand-500 bg-brand-50"
                    : "border-slate-200 bg-white hover:border-brand-300"
                )}
              >
                <input
                  type="radio"
                  name="rentalId"
                  value={rental.rentalId}
                  checked={selectedRentalId === rental.rentalId}
                  onChange={(e) => setSelectedRentalId(e.target.value)}
                  className="text-brand-600"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{rental.renterId}</p>
                  <p className="text-xs text-slate-500">
                    Qty: {rental.quantity} • Due: {new Date(rental.expectedReturnDate).toLocaleDateString()}
                  </p>
                </div>
              </label>
            ))}
          </div>
          <button
            onClick={handleReturn}
            disabled={returnItem.isPending || !selectedRentalId}
            className={clsx(btnBase, btnPrimary, "w-full")}
          >
            {returnItem.isPending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <RotateCcw size={16} />
            )}
            <span>{returnItem.isPending ? "Processing..." : "Confirm Return"}</span>
          </button>
        </div>
      )}

      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Management</h3>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setActiveAction(activeAction === 'inspect' ? null : 'inspect')}
            className={clsx(btnBase, btnSecondary, activeAction === 'inspect' && "ring-2 ring-brand-500 border-transparent")}
          >
            <ClipboardCheck size={16} /> <span>Inspect</span>
          </button>

          <button
            onClick={() => setActiveAction(activeAction === 'damage' ? null : 'damage')}
            className={clsx(btnBase, btnSecondary, activeAction === 'damage' && "ring-2 ring-red-500 border-transparent")}
          >
            <OctagonAlert size={16} /> <span>Report</span>
          </button>

          {item.status !== ItemStatus.Maintenance ? (
             <button
             onClick={() => setActiveAction(activeAction === 'maintenance' ? null : 'maintenance')}
             className={clsx(btnBase, btnSecondary, activeAction === 'maintenance' && "ring-2 ring-orange-500 border-transparent")}
           >
             <Wrench size={16} /> <span>Maintain</span>
           </button>
          ) : (
            <button
            onClick={() => setActiveAction(activeAction === 'complete-maintenance' ? null : 'complete-maintenance')}
            className={clsx(btnBase, "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100", activeAction === 'complete-maintenance' && "ring-2 ring-green-500 border-transparent")}
          >
            <CircleCheck size={16} /> <span>Complete</span>
          </button>
          )}

          <button
            onClick={() => setActiveAction(activeAction === 'retire' ? null : 'retire')}
            className={clsx(btnBase, btnDanger, activeAction === 'retire' && "ring-2 ring-red-500 border-transparent")}
          >
            <Trash2 size={16} /> <span>Retire</span>
          </button>
        </div>

        {/* Active Action Form */}
        {activeAction && activeAction !== 'return' && (
          <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-200">

            {/* Inspect Form */}
            {activeAction === 'inspect' && (
              <div className="space-y-3">
                <h4 className="font-medium text-slate-900 flex items-center gap-2"><ClipboardCheck size={16}/> Log Inspection</h4>
                <select
                  value={inspectCondition}
                  onChange={(e) => setInspectCondition(e.target.value as ItemCondition)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                >
                  {Object.values(ItemCondition).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <textarea
                  value={inspectNotes}
                  onChange={(e) => setInspectNotes(e.target.value)}
                  placeholder="Inspection notes (optional)..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg h-20 resize-none focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                />
                <button onClick={handleInspect} disabled={inspectItem.isPending} className={clsx(btnBase, btnPrimary, "w-full")}>
                  {inspectItem.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                  <span>{inspectItem.isPending ? "Saving..." : "Save Inspection"}</span>
                </button>
              </div>
            )}

            {/* Report Damage Form */}
            {activeAction === 'damage' && (
              <div className="space-y-3">
                <h4 className="font-medium text-red-900 flex items-center gap-2"><OctagonAlert size={16}/> Report Damage</h4>
                <textarea
                  value={damageDescription}
                  onChange={(e) => setDamageDescription(e.target.value)}
                  placeholder="Describe damage..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg h-24 resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                />
                <button onClick={handleReportDamage} disabled={reportDamage.isPending || !damageDescription} className={clsx(btnBase, "bg-red-600 text-white hover:bg-red-700 w-full")}>
                  {reportDamage.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
                  <span>{reportDamage.isPending ? "Reporting..." : "Submit Report"}</span>
                </button>
              </div>
            )}

            {/* Schedule Maintenance Form */}
            {activeAction === 'maintenance' && (
              <div className="space-y-3">
                <h4 className="font-medium text-orange-900 flex items-center gap-2"><Wrench size={16}/> Schedule Maintenance</h4>
                <input
                  type="text"
                  value={maintReason}
                  onChange={(e) => setMaintReason(e.target.value)}
                  placeholder="Reason for maintenance..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
                <input
                  type="date"
                  value={maintDate}
                  onChange={(e) => setMaintDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
                <button onClick={handleScheduleMaint} disabled={scheduleMaintenance.isPending || !maintReason} className={clsx(btnBase, "bg-orange-600 text-white hover:bg-orange-700 w-full")}>
                  {scheduleMaintenance.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Calendar size={16} />}
                  <span>{scheduleMaintenance.isPending ? "Scheduling..." : "Schedule Maintenance"}</span>
                </button>
              </div>
            )}

            {/* Complete Maintenance Form */}
            {activeAction === 'complete-maintenance' && (
              <div className="space-y-3">
                <h4 className="font-medium text-green-900 flex items-center gap-2"><CircleCheck size={16}/> Complete Maintenance</h4>
                <textarea
                  value={maintNotes}
                  onChange={(e) => setMaintNotes(e.target.value)}
                  placeholder="Maintenance notes (optional)..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg h-24 resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
                <button onClick={handleCompleteMaint} disabled={completeMaintenance.isPending} className={clsx(btnBase, "bg-green-600 text-white hover:bg-green-700 w-full")}>
                  {completeMaintenance.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CircleCheck size={16} />}
                  <span>{completeMaintenance.isPending ? "Completing..." : "Complete & Return"}</span>
                </button>
              </div>
            )}

             {/* Retire Form */}
             {activeAction === 'retire' && (
              <div className="space-y-3">
                <h4 className="font-medium text-red-900 flex items-center gap-2"><Trash2 size={16}/> Retire Item</h4>
                <p className="text-xs text-red-700 bg-red-100/50 p-2 rounded border border-red-100">
                  Warning: This action is permanent.
                </p>
                <textarea
                  value={retireReason}
                  onChange={(e) => setRetireReason(e.target.value)}
                  placeholder="Reason for retirement..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg h-20 resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                />
                <button onClick={handleRetire} disabled={retireItem.isPending || !retireReason} className={clsx(btnBase, "bg-red-700 text-white hover:bg-red-800 w-full")}>
                  {retireItem.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Archive size={16} />}
                  <span>{retireItem.isPending ? "Retiring..." : "Confirm Retirement"}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

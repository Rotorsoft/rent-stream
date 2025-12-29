import { useState } from "react";
import { trpc } from "../utils/trpc";
import { ItemStatus, ItemCondition } from "@rent-stream/domain/schemas";

type ActionType = "inspect" | "damage" | "maintenance" | "complete-maintenance" | "retire" | null;

export function ActionButtons({ item, refetch }: { item: any; refetch: () => void }) {
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  
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
    // Reset forms
    setDamageDescription("");
    setMaintReason("");
    setRetireReason("");
    setMaintNotes("");
    setInspectNotes("");
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
      expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  };

  const handleReturn = () => returnItem.mutate({ itemId: item.id });

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
    return <div className="text-gray-500 italic">This item is retired.</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Primary Actions */}
      <div className="flex flex-wrap gap-2">
        {item.status === ItemStatus.Available && (
          <button
            onClick={handleRent}
            disabled={rentItem.isPending}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {rentItem.isPending ? "Renting..." : "Rent Item"}
          </button>
        )}

        {(!!item.currentRenterId) && (
          <button
            onClick={handleReturn}
            disabled={returnItem.isPending}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {returnItem.isPending ? "Returning..." : "Return Item"}
          </button>
        )}
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Management</h3>
        
        {/* Management Buttons Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button 
            onClick={() => setActiveAction(activeAction === 'inspect' ? null : 'inspect')}
            className={`px-3 py-2 text-sm border rounded hover:bg-gray-50 ${activeAction === 'inspect' ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : ''}`}
          >
            Inspect
          </button>
          
          <button 
            onClick={() => setActiveAction(activeAction === 'damage' ? null : 'damage')}
            className={`px-3 py-2 text-sm border rounded hover:bg-gray-50 ${activeAction === 'damage' ? 'bg-red-50 border-red-200 ring-1 ring-red-200' : ''}`}
          >
            Report Damage
          </button>

          {item.status !== ItemStatus.Maintenance ? (
             <button 
             onClick={() => setActiveAction(activeAction === 'maintenance' ? null : 'maintenance')}
             className={`px-3 py-2 text-sm border rounded hover:bg-gray-50 ${activeAction === 'maintenance' ? 'bg-orange-50 border-orange-200 ring-1 ring-orange-200' : ''}`}
           >
             Schedule Maint.
           </button>
          ) : (
            <button 
            onClick={() => setActiveAction(activeAction === 'complete-maintenance' ? null : 'complete-maintenance')}
            className={`px-3 py-2 text-sm border rounded hover:bg-gray-50 ${activeAction === 'complete-maintenance' ? 'bg-green-50 border-green-200 ring-1 ring-green-200' : ''}`}
          >
            Complete Maint.
          </button>
          )}

          <button 
            onClick={() => setActiveAction(activeAction === 'retire' ? null : 'retire')}
            className={`px-3 py-2 text-sm border rounded hover:bg-gray-50 text-red-600 hover:text-red-700 ${activeAction === 'retire' ? 'bg-red-50 border-red-200 ring-1 ring-red-200' : ''}`}
          >
            Retire Item
          </button>
        </div>

        {/* Active Action Form */}
        {activeAction && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
            
            {/* Inspect Form */}
            {activeAction === 'inspect' && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Log Inspection</h4>
                <select
                  value={inspectCondition}
                  onChange={(e) => setInspectCondition(e.target.value as ItemCondition)}
                  className="w-full p-2 border rounded bg-white"
                >
                  {Object.values(ItemCondition).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <textarea
                  value={inspectNotes}
                  onChange={(e) => setInspectNotes(e.target.value)}
                  placeholder="Inspection notes (optional)..."
                  className="w-full p-2 border rounded h-20"
                />
                <button
                  onClick={handleInspect}
                  disabled={inspectItem.isPending}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {inspectItem.isPending ? "Saving..." : "Save Inspection"}
                </button>
              </div>
            )}

            {/* Report Damage Form */}
            {activeAction === 'damage' && (
              <div className="space-y-3">
                <h4 className="font-medium text-red-900">Report Damage</h4>
                <textarea
                  value={damageDescription}
                  onChange={(e) => setDamageDescription(e.target.value)}
                  placeholder="Describe damage..."
                  className="w-full p-2 border rounded h-24"
                />
                <button
                  onClick={handleReportDamage}
                  disabled={reportDamage.isPending || !damageDescription}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {reportDamage.isPending ? "Reporting..." : "Submit Report"}
                </button>
              </div>
            )}

            {/* Schedule Maintenance Form */}
            {activeAction === 'maintenance' && (
              <div className="space-y-3">
                <h4 className="font-medium text-orange-900">Schedule Maintenance</h4>
                <input
                  type="text"
                  value={maintReason}
                  onChange={(e) => setMaintReason(e.target.value)}
                  placeholder="Reason for maintenance..."
                  className="w-full p-2 border rounded"
                />
                <input
                  type="date"
                  value={maintDate}
                  onChange={(e) => setMaintDate(e.target.value)}
                  className="w-full p-2 border rounded"
                />
                <button
                  onClick={handleScheduleMaint}
                  disabled={scheduleMaintenance.isPending || !maintReason}
                  className="w-full bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
                >
                  {scheduleMaintenance.isPending ? "Scheduling..." : "Schedule Maintenance"}
                </button>
              </div>
            )}

            {/* Complete Maintenance Form */}
            {activeAction === 'complete-maintenance' && (
              <div className="space-y-3">
                <h4 className="font-medium text-green-900">Complete Maintenance</h4>
                <textarea
                  value={maintNotes}
                  onChange={(e) => setMaintNotes(e.target.value)}
                  placeholder="Maintenance notes (optional)..."
                  className="w-full p-2 border rounded h-24"
                />
                <button
                  onClick={handleCompleteMaint}
                  disabled={completeMaintenance.isPending}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {completeMaintenance.isPending ? "Completing..." : "Complete & Return to Service"}
                </button>
              </div>
            )}

             {/* Retire Form */}
             {activeAction === 'retire' && (
              <div className="space-y-3">
                <h4 className="font-medium text-red-900">Retire Item</h4>
                <p className="text-sm text-red-700 bg-red-50 p-2 rounded">
                  Warning: This action is permanent. The item will no longer be rentable.
                </p>
                <textarea
                  value={retireReason}
                  onChange={(e) => setRetireReason(e.target.value)}
                  placeholder="Reason for retirement..."
                  className="w-full p-2 border rounded h-20"
                />
                <button
                  onClick={handleRetire}
                  disabled={retireItem.isPending || !retireReason}
                  className="w-full bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800 disabled:opacity-50"
                >
                  {retireItem.isPending ? "Retiring..." : "Confirm Retirement"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
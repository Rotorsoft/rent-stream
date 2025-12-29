import { Link, useParams } from "react-router-dom";
import { ActionButtons } from "../components/ActionButtons";
import { Timeline } from "../components/Timeline";
import { trpc } from "../utils/trpc";

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

  if (isLoading) return <div className="p-8">Loading item...</div>;
  if (!snapshot) return <div className="p-8">Item not found.</div>;

  const item = { ...snapshot.state, id: id }; // Ensure ID is available

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link to="/" className="text-blue-600 hover:text-blue-800">
          &larr; Back to Inventory
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
        <span className={`px-3 py-1 rounded-full text-sm font-medium
          ${item.status === "Available" ? "bg-green-100 text-green-800" :
            item.status === "Rented" ? "bg-indigo-100 text-indigo-800" :
              item.status === "Quarantined" ? "bg-red-100 text-red-800" :
                "bg-gray-100 text-gray-800"}`}>
          {item.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Details</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
              <div>
                <dt className="text-sm font-medium text-gray-500">Condition</dt>
                <dd className="mt-1 text-sm text-gray-900">{item.condition}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Serial Number</dt>
                <dd className="mt-1 text-sm text-gray-900">{item.serialNumber}</dd>
              </div>
              {item.currentRenterId && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Current Renter</dt>
                  <dd className="mt-1 text-sm text-gray-900">{item.currentRenterId}</dd>
                </div>
              )}
              {item.damageReport && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-red-600">Damage Report</dt>
                  <dd className="mt-1 text-sm text-red-900 bg-red-50 p-2 rounded">{item.damageReport}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Event Timeline</h2>
            <Timeline itemId={id!} />
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Actions</h2>
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
    </div>
  );
}


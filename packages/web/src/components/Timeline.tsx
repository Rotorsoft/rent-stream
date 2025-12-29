import { trpc } from "../utils/trpc";

export function Timeline({ itemId }: { itemId: string }) {
  const { data: history, isLoading, refetch } = trpc.getHistory.useQuery(itemId);

  trpc.onInventoryUpdate.useSubscription(undefined, {
    onData: () => {
      refetch();
    },
  });

  if (isLoading) return <div>Loading history...</div>;
  if (!history || history.length === 0) return <div>No history found.</div>;

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {history.map((event: any, eventIdx: number) => (
          <li key={event.id}>
            <div className="relative pb-8">
              {eventIdx !== history.length - 1 ? (
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                    {/* Icon placeholder */}
                    <div className="h-2.5 w-2.5 rounded-full bg-white" />
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      {event.name}
                    </p>
                  </div>
                  <div className="text-right text-sm whitespace-nowrap text-gray-500">
                    <time dateTime={event.created}>{new Date(event.created).toLocaleString()}</time>
                  </div>
                </div>
              </div>
              <div className="ml-12 mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                <pre className="whitespace-pre-wrap font-mono text-xs">{JSON.stringify(event.data, null, 2)}</pre>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}


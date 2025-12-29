import { Link, Outlet } from "react-router-dom";

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex-shrink-0 flex items-center text-blue-600 font-bold text-xl">
                RentStream
              </Link>
              <div className="ml-6 flex space-x-8">
                <Link to="/" className="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-blue-600">
                  Inventory
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}


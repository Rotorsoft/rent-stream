import { Link, Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen font-sans text-slate-800">
      <nav className="fixed top-4 left-4 right-4 z-50 rounded-2xl glass px-6 py-4 flex justify-between items-center max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-accent-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-brand-500/50 transition-all duration-300">
            R
          </div>
          <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-brand-700 to-accent-600">
            RentStream
          </span>
        </Link>
        <div className="flex space-x-8">
          <Link 
            to="/" 
            className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors relative"
          >
            Inventory
            {location.pathname === "/" && (
              <motion.div 
                layoutId="underline" 
                className="absolute left-0 right-0 -bottom-1 h-0.5 bg-brand-500 rounded-full"
              />
            )}
          </Link>
          <a href="#" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">
            Analytics
          </a>
          <a href="#" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">
            Settings
          </a>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden">
             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Felix`} alt="User" />
          </div>
        </div>
      </nav>

      <main className="pt-28 pb-12 px-4 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}


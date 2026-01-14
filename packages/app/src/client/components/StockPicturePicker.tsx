import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Image as ImageIcon, Search, X } from "lucide-react";
import clsx from "clsx";
import { stockPictures } from "../data/stockPictures";

interface StockPicturePickerProps {
  value?: string;
  onChange: (url: string | undefined) => void;
}

export function StockPicturePicker({ value, onChange }: StockPicturePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter images locally by search query
  const filteredImages = useMemo(() => {
    if (!searchQuery.trim()) {
      return stockPictures;
    }
    const query = searchQuery.toLowerCase();
    return stockPictures.filter(
      (img) =>
        img.alt.toLowerCase().includes(query) ||
        img.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Get unique categories for display
  const categories = useMemo(() => {
    const cats = new Set(stockPictures.map((p) => p.category));
    return Array.from(cats).sort();
  }, []);

  const handleSelect = (url: string) => {
    onChange(url);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "relative w-12 h-12 rounded-xl border-2 transition-all duration-200 flex items-center justify-center overflow-hidden group",
          value
            ? "border-brand-300 bg-brand-50"
            : "border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50"
        )}
        title={value ? "Change image" : "Add image"}
      >
        {value ? (
          <>
            <img src={value.replace("w=800", "w=100")} alt="Selected" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ImageIcon size={18} className="text-white" />
            </div>
          </>
        ) : (
          <ImageIcon size={20} className="text-slate-400 group-hover:text-brand-500 transition-colors" />
        )}
      </button>

      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute -top-1 -right-1 w-5 h-5 bg-slate-600 hover:bg-slate-700 rounded-full flex items-center justify-center shadow-sm"
        >
          <X size={12} className="text-white" />
        </button>
      )}

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden"
          >
            <div className="p-4 space-y-4 max-h-[450px] overflow-y-auto">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search images..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none text-sm"
                  autoFocus
                />
              </div>

              {/* Category chips */}
              {!searchQuery && (
                <div className="flex flex-wrap gap-1.5">
                  {categories.slice(0, 8).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSearchQuery(cat)}
                      className="px-2 py-1 text-xs font-medium bg-slate-100 hover:bg-brand-100 text-slate-600 hover:text-brand-700 rounded-md transition-colors"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Results count */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  {filteredImages.length} images
                  {searchQuery && ` matching "${searchQuery}"`}
                </span>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-xs text-brand-600 hover:text-brand-800"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* No Results */}
              {filteredImages.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Search className="mx-auto mb-2 text-slate-300" size={24} />
                  <p className="text-sm">No images found</p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="mt-2 text-xs text-brand-600 hover:text-brand-800"
                  >
                    Show all images
                  </button>
                </div>
              )}

              {/* Image Grid */}
              {filteredImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {filteredImages.map((image) => {
                    const isSelected = value === image.url;
                    return (
                      <button
                        key={image.id}
                        type="button"
                        onClick={() => handleSelect(image.url)}
                        className={clsx(
                          "relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-150 group",
                          isSelected
                            ? "border-brand-500 ring-2 ring-brand-200"
                            : "border-transparent hover:border-brand-300"
                        )}
                      >
                        <img
                          src={image.thumbnail}
                          alt={image.alt}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />

                        {/* Hover overlay */}
                        <div className={clsx(
                          "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity",
                          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}>
                          <span className="absolute bottom-1 left-1 right-1 text-[10px] text-white font-medium truncate">
                            {image.category}
                          </span>
                        </div>

                        {/* Selection indicator */}
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Unit } from '../../types';

interface FilterBarProps {
  units: Unit[];
  onFilter: (filters: any) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ units, onFilter }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    planTypes: [] as string[],
    floors: [] as string[],
    orientations: [] as string[],
    bedroomCounts: [] as number[],
    bathroomCounts: [] as number[],
    priceRange: null as { min: number; max: number } | null
  });

  // Dynamically generate filter options from actual unit data
  const planTypes = [...new Set(units.map(unit => unit.planType))].sort();
  const floors = [...new Set(units.map(unit => unit.floor))].sort((a, b) => {
    // Custom sort: Garden first, then numbers ascending, then Penthouse last
    if (a === 'Garden') return -1;
    if (b === 'Garden') return 1;
    if (a === 'Penthouse') return 1;
    if (b === 'Penthouse') return -1;
    const aNum = parseInt(a);
    const bNum = parseInt(b);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum;
    }
    return a.localeCompare(b);
  });
  const orientations = [...new Set(units.map(unit => unit.orientation))].sort();
  const bedroomCounts = [...new Set(units.map(unit => unit.bedrooms))].sort((a, b) => a - b);
  const bathroomCounts = [...new Set(units.map(unit => unit.bathrooms))].sort((a, b) => a - b);

  // Get price range from actual units
  const prices = units.map(unit => unit.finalPrice);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const handleApplyFilters = () => {
    onFilter(filters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      planTypes: [],
      floors: [],
      orientations: [],
      bedroomCounts: [],
      bathroomCounts: [],
      priceRange: null
    };
    setFilters(clearedFilters);
    onFilter(clearedFilters);
  };

  const hasActiveFilters = filters.planTypes.length > 0 || 
                          filters.floors.length > 0 || 
                          filters.orientations.length > 0 || 
                          filters.bedroomCounts.length > 0 ||
                          filters.bathroomCounts.length > 0 ||
                          filters.priceRange !== null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
          hasActiveFilters 
            ? 'border-blue-300 bg-blue-50 text-blue-700' 
            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Filter className="h-4 w-4" />
        <span>Filters</span>
        {hasActiveFilters && (
          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
            Active
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Filter Units</h4>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Types
              </label>
              <div className="flex flex-wrap gap-2">
                {planTypes.map(type => (
                  <label key={type} className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={filters.planTypes.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(f => ({ ...f, planTypes: [...f.planTypes, type] }));
                        } else {
                          setFilters(f => ({ ...f, planTypes: f.planTypes.filter(t => t !== type) }));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Floors
              </label>
              <div className="flex flex-wrap gap-2">
                {floors.map(floor => (
                  <label key={floor} className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={filters.floors.includes(floor)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(f => ({ ...f, floors: [...f.floors, floor] }));
                        } else {
                          setFilters(f => ({ ...f, floors: f.floors.filter(fl => fl !== floor) }));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{floor}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orientations
              </label>
              <div className="flex flex-wrap gap-2">
                {orientations.map(orientation => (
                  <label key={orientation} className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={filters.orientations.includes(orientation)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(f => ({ ...f, orientations: [...f.orientations, orientation] }));
                        } else {
                          setFilters(f => ({ ...f, orientations: f.orientations.filter(o => o !== orientation) }));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{orientation}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bedrooms
              </label>
              <div className="flex flex-wrap gap-2">
                {bedroomCounts.map(count => (
                  <label key={count} className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={filters.bedroomCounts.includes(count)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(f => ({ ...f, bedroomCounts: [...f.bedroomCounts, count] }));
                        } else {
                          setFilters(f => ({ ...f, bedroomCounts: f.bedroomCounts.filter(c => c !== count) }));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{count}BR</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bathrooms
              </label>
              <div className="flex flex-wrap gap-2">
                {bathroomCounts.map(count => (
                  <label key={count} className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={filters.bathroomCounts.includes(count)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(f => ({ ...f, bathroomCounts: [...f.bathroomCounts, count] }));
                        } else {
                          setFilters(f => ({ ...f, bathroomCounts: f.bathroomCounts.filter(c => c !== count) }));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{count}BA</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Min Price</label>
                  <input
                    type="number"
                    placeholder={`${Math.floor(minPrice / 1000)}k`}
                    value={filters.priceRange?.min || ''}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : null;
                      setFilters(f => ({
                        ...f,
                        priceRange: value ? { min: value, max: f.priceRange?.max || maxPrice } : null
                      }));
                    }}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max Price</label>
                  <input
                    type="number"
                    placeholder={`${Math.ceil(maxPrice / 1000)}k`}
                    value={filters.priceRange?.max || ''}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : null;
                      setFilters(f => ({
                        ...f,
                        priceRange: value ? { min: f.priceRange?.min || minPrice, max: value } : null
                      }));
                    }}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={handleClearFilters}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear all filters
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-700 text-white text-sm rounded-lg hover:bg-blue-800 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
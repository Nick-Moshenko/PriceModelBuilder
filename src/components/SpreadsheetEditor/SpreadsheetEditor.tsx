import React, { useState } from 'react';
import { Unit } from '../../types';
import { UnitGrid } from './UnitGrid';
import { FilterBar } from './FilterBar';
import { BulkEditPanel } from './BulkEditPanel';

interface SpreadsheetEditorProps {
  units: Unit[];
  onUnitsChange: (units: Unit[]) => void;
}

export const SpreadsheetEditor: React.FC<SpreadsheetEditorProps> = ({
  units,
  onUnitsChange
}) => {
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>(units);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [showBulkEdit, setShowBulkEdit] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleFilter = (filters: any) => {
    let filtered = units;
    
    if (filters.planTypes?.length > 0) {
      filtered = filtered.filter(unit => filters.planTypes.includes(unit.planType));
    }
    
    if (filters.floors?.length > 0) {
      filtered = filtered.filter(unit => filters.floors.includes(unit.floor));
    }
    
    if (filters.orientations?.length > 0) {
      filtered = filtered.filter(unit => filters.orientations.includes(unit.orientation));
    }
    
    if (filters.bedroomCounts?.length > 0) {
      filtered = filtered.filter(unit => filters.bedroomCounts.includes(unit.bedrooms));
    }
    
    if (filters.bathroomCounts?.length > 0) {
      filtered = filtered.filter(unit => filters.bathroomCounts.includes(unit.bathrooms));
    }
    
    if (filters.priceRange) {
      const { min, max } = filters.priceRange;
      filtered = filtered.filter(unit => 
        unit.finalPrice >= min && unit.finalPrice <= max
      );
    }
    
    setFilteredUnits(filtered);
  };

  const handleUnitUpdate = (unitId: string, updates: Partial<Unit>) => {
    const updatedUnits = units.map(unit =>
      unit.id === unitId ? { ...unit, ...updates } : unit
    );
    onUnitsChange(updatedUnits);
  };

  const handleBulkEdit = (adjustment: any) => {
    if (selectedUnits.length === 0) return;

    const updatedUnits = units.map(unit => {
      if (selectedUnits.includes(unit.id)) {
        let newPrice: number;
        let newPricePerSqft: number;
        
        switch (adjustment.type) {
          case 'final_price':
            newPrice = adjustment.value;
            newPricePerSqft = newPrice / unit.sqft;
            break;
          case 'price_per_sqft':
            newPricePerSqft = adjustment.value;
            newPrice = newPricePerSqft * unit.sqft;
            break;
          default:
            return unit;
        }

        // Apply rounding to final price (round to nearest $1,000)
        newPrice = Math.round(newPrice / 1000) * 1000;
        newPricePerSqft = newPrice / unit.sqft;

        return {
          ...unit,
          finalPrice: newPrice,
          finalPricePerSqft: newPricePerSqft
        };
      }
      return unit;
    });

    onUnitsChange(updatedUnits);
    setSelectedUnits([]);
    setShowBulkEdit(false);
  };

  React.useEffect(() => {
    setFilteredUnits(units);
  }, [units]);

  // Dynamically determine floor order from actual unit data
  const getFloorOrder = (units: Unit[]) => {
    const floors = [...new Set(units.map(unit => unit.floor))];
    return floors.sort((a, b) => {
      // Custom sort: Penthouse first, then numbers descending, then Garden last
      if (a === 'Penthouse') return -1;
      if (b === 'Penthouse') return 1;
      if (a === 'Garden') return 1;
      if (b === 'Garden') return -1;
      // Handle numeric floors
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return bNum - aNum; // Descending order for display (higher floors first)
      }
      return a.localeCompare(b);
    });
  };

  const floorOrder = getFloorOrder(filteredUnits);
  const groupedUnits = filteredUnits.reduce((acc, unit) => {
    if (!acc[unit.floor]) acc[unit.floor] = [];
    acc[unit.floor].push(unit);
    return acc;
  }, {} as Record<string, Unit[]>);
  return (
    <div>
      <div className="p-6 border-b border-gray-200">
        <FilterBar units={units} onFilter={handleFilter} />
        
        <div className="flex items-center justify-between mt-4">
          <div>
            <p className="text-sm text-gray-500">
              {filteredUnits.length} units shown • {selectedUnits.length} selected
            </p>
          </div>
          
          {selectedUnits.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowBulkEdit(true)}
                className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
              >
                Bulk Edit ({selectedUnits.length})
              </button>
              <button
                onClick={() => setSelectedUnits([])}
                className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {showBulkEdit && (
          <BulkEditPanel
            selectedCount={selectedUnits.length}
            onApply={handleBulkEdit}
            onCancel={() => setShowBulkEdit(false)}
          />
        )}
      </div>

      <div className="space-y-4">
        {floorOrder.map(floor => {
          const floorUnits = groupedUnits[floor] || [];
          if (floorUnits.length === 0) return null;

          const floorRevenue = floorUnits.reduce((sum, unit) => sum + unit.finalPrice, 0);
          const avgPricePerSqft = floorUnits.reduce((sum, unit) => sum + unit.finalPricePerSqft, 0) / floorUnits.length;

          return (
            <div key={floor} className="border border-gray-200 rounded-lg">
              <div className="p-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {floor === 'Garden' ? 'Garden Level' : 
                       floor === 'Penthouse' ? 'Penthouse' : 
                       !isNaN(parseInt(floor)) ? `Floor ${floor}` : floor}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {floorUnits.length} units • {formatCurrency(floorRevenue)} total
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      Avg: {formatCurrency(avgPricePerSqft)}/sqft
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <UnitGrid
                  units={floorUnits}
                  selectedUnits={selectedUnits}
                  onSelectionChange={setSelectedUnits}
                  onUnitUpdate={handleUnitUpdate}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Totals */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {filteredUnits.length}
            </div>
            <div className="text-gray-500">Total Units</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(filteredUnits.reduce((sum, unit) => sum + unit.finalPrice, 0))}
            </div>
            <div className="text-gray-500">Total Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(filteredUnits.reduce((sum, unit) => sum + unit.finalPricePerSqft, 0) / filteredUnits.length)}
            </div>
            <div className="text-gray-500">Avg $/sqft</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(filteredUnits.reduce((sum, unit) => sum + unit.sqft, 0) / filteredUnits.length).toLocaleString()}
            </div>
            <div className="text-gray-500">Avg Size</div>
          </div>
        </div>
      </div>
    </div>
  );
};
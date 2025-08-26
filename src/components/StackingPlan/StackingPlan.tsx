import React from 'react';
import { Unit } from '../../types';
import { Building, Eye } from 'lucide-react';

interface StackingPlanProps {
  units: Unit[];
  onUnitHover?: (unit: Unit | null) => void;
  onUnitUpdate?: (unitId: string, updates: Partial<Unit>) => void;
}

export const StackingPlan: React.FC<StackingPlanProps> = ({
  units,
  onUnitHover,
  onUnitUpdate
}) => {
  const [editingCell, setEditingCell] = React.useState<{ unitId: string; field: string } | null>(null);
  const [editValue, setEditValue] = React.useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleCellEdit = (unitId: string, field: string, currentValue: any) => {
    if (!onUnitUpdate) return;
    setEditingCell({ unitId, field });
    setEditValue(String(currentValue));
  };

  const handleCellSave = () => {
    if (!editingCell || !onUnitUpdate) return;

    const { unitId, field } = editingCell;
    const numValue = parseFloat(editValue);
    
    if (isNaN(numValue) || numValue <= 0) {
      handleCellCancel();
      return;
    }
    
    if (field === 'finalPrice') {
      const unit = units.find(u => u.id === unitId);
      if (unit) {
        onUnitUpdate(unitId, {
          finalPrice: numValue,
          finalPricePerSqft: numValue / unit.sqft
        });
      }
    } else if (field === 'finalPricePerSqft') {
      const unit = units.find(u => u.id === unitId);
      if (unit) {
        onUnitUpdate(unitId, {
          finalPrice: numValue * unit.sqft,
          finalPricePerSqft: numValue
        });
      }
    }

    setEditingCell(null);
    setEditValue('');
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

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

  const floorOrder = getFloorOrder(units);

  const getPriceColor = (pricePerSqft: number) => {
    if (pricePerSqft < 1200) return 'bg-green-100 border-green-300 text-green-800';
    if (pricePerSqft < 1400) return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    if (pricePerSqft < 1600) return 'bg-orange-100 border-orange-300 text-orange-800';
    return 'bg-red-100 border-red-300 text-red-800';
  };

  // Group units by floor and sort units within each floor numerically
  const groupedUnits = floorOrder.reduce((acc, floor) => {
    const floorUnits = units.filter(u => u.floor === floor);
    // Sort units numerically by unit number
    floorUnits.sort((a, b) => {
      const aNum = parseInt(a.unit);
      const bNum = parseInt(b.unit);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      return a.unit.localeCompare(b.unit);
    });
    acc[floor] = floorUnits;
    return acc;
  }, {} as Record<string, Unit[]>);

  // Calculate the maximum number of units on any floor for consistent grid
  const maxUnitsPerFloor = Math.max(...floorOrder.map(floor => groupedUnits[floor]?.length || 0));
  return (
    <div className="h-full flex flex-col">
      <div className="p-6 flex-shrink-0">
        <div className="flex items-center space-x-2 mb-4">
          <Eye className="h-4 w-4 text-gray-400" />
          <p className="text-sm text-gray-500">
            Live preview of pricing across all floors and units {onUnitUpdate && '• Click prices to edit'}
          </p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-6">
        <div className="space-y-4">
          {floorOrder.map(floor => {
            const floorUnits = groupedUnits[floor] || [];
            if (floorUnits.length === 0) return null;
            
            const floorRevenue = floorUnits.reduce((sum, unit) => sum + unit.finalPrice, 0);
            
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
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${maxUnitsPerFloor}, 1fr)` }}>
                    {floorUnits.map(unit => (
                      <div
                        key={unit.id}
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${getPriceColor(unit.finalPricePerSqft)}`}
                        onMouseEnter={() => onUnitHover?.(unit)}
                        onMouseLeave={() => onUnitHover?.(null)}
                      >
                        <div className="text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900">Unit {unit.unit}</span>
                            <span className="text-xs bg-white bg-opacity-50 px-1 py-0.5 rounded">{unit.orientation}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{unit.planType}</span>
                            <span className="text-gray-600 text-xs">{unit.bedrooms}BR</span>
                          </div>
                          <div className="text-gray-600 text-xs">
                            {unit.sqft.toLocaleString()} sf
                          </div>
                          <div className="font-medium">
                            {editingCell?.unitId === unit.id && editingCell?.field === 'finalPrice' ? (
                              <input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleCellSave}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleCellSave();
                                  if (e.key === 'Escape') handleCellCancel();
                                  e.stopPropagation(); // Prevent event bubbling
                                }}
                                className="w-full px-1 py-0.5 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <div 
                                className={`${onUnitUpdate ? 'hover:bg-white hover:bg-opacity-40 px-1 py-0.5 rounded cursor-pointer' : ''} text-xs`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCellEdit(unit.id, 'finalPrice', unit.finalPrice);
                                }}
                              >
                                {new Intl.NumberFormat('en-CA', {
                                  style: 'currency',
                                  currency: 'CAD',
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                  notation: 'compact'
                                }).format(unit.finalPrice)}
                              </div>
                            )}
                          </div>
                          <div className="text-xs">
                            {editingCell?.unitId === unit.id && editingCell?.field === 'finalPricePerSqft' ? (
                              <input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleCellSave}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleCellSave();
                                  if (e.key === 'Escape') handleCellCancel();
                                  e.stopPropagation(); // Prevent event bubbling
                                }}
                                className="w-full px-1 py-0.5 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <div 
                                className={`${onUnitUpdate ? 'hover:bg-white hover:bg-opacity-40 px-1 py-0.5 rounded cursor-pointer' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCellEdit(unit.id, 'finalPricePerSqft', unit.finalPricePerSqft);
                                }}
                              >
                                {new Intl.NumberFormat('en-CA', {
                                  style: 'currency',
                                  currency: 'CAD',
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                  notation: 'compact'
                                }).format(unit.finalPricePerSqft)}/sf
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Fill empty grid cells to maintain alignment */}
                    {Array.from({ length: maxUnitsPerFloor - floorUnits.length }).map((_, index) => (
                      <div key={`empty-${index}`} className="invisible"></div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-shrink-0 m-6 mt-0 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {units.length}
              </div>
              <div className="text-gray-500">Total Units</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(units.reduce((sum, unit) => sum + unit.finalPrice, 0))}
              </div>
              <div className="text-gray-500">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(units.reduce((sum, unit) => sum + unit.finalPricePerSqft, 0) / units.length)}
              </div>
              <div className="text-gray-500">Avg $/sqft</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(units.reduce((sum, unit) => sum + unit.sqft, 0) / units.length).toLocaleString()}
              </div>
              <div className="text-gray-500">Avg Size</div>
            </div>
          </div>
        </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { Unit } from '../../types';
import { ToggleLeft, ToggleRight } from 'lucide-react';

interface ListPricingItem {
  category: string;
  value: string;
  adjustment: number;
}

interface ListPricingPanelProps {
  units: Unit[];
  listPricing: ListPricingItem[];
  onListPricingChange: (items: ListPricingItem[]) => void;
  basePricingMode?: 'plan' | 'floor';
  onBasePricingModeChange?: (mode: 'plan' | 'floor') => void;
}

interface SizeRange {
  min: number;
  max: number;
  label: string;
}
export const ListPricingPanel: React.FC<ListPricingPanelProps> = ({
  units,
  listPricing,
  onListPricingChange,
  basePricingMode: propBasePricingMode,
  onBasePricingModeChange
}) => {
  // Use prop value if provided, otherwise default to 'plan'
  const basePricingMode = propBasePricingMode || 'plan';
  const [tempValues, setTempValues] = useState<Record<string, string>>({});

  // Helper function to handle adjustment changes
  const handleAdjustmentChange = (category: string, value: string, adjustment: number) => {
    const updatedItems = pricingItems.map(item =>
      item.category === category && item.value === value
        ? { ...item, adjustment }
        : item
    );
    setPricingItems(updatedItems);
    onListPricingChange(updatedItems);
  };

  // When base pricing mode changes, clear the other mode's values
  const handleBasePricingModeChange = (newMode: 'plan' | 'floor') => {
    console.log('ListPricingPanel: handleBasePricingModeChange called with:', newMode);
    console.log('ListPricingPanel: current basePricingMode:', basePricingMode);
    console.log('ListPricingPanel: onBasePricingModeChange function:', onBasePricingModeChange);
    if (onBasePricingModeChange) {
      onBasePricingModeChange(newMode);
    }
  };

  // Extract unique values from actual unit data
  const planTypes = [...new Set(units.map(unit => unit.planType))].sort();
  const orientations = [...new Set(units.map(unit => unit.orientation))].sort();
  const floors = [...new Set(units.map(unit => unit.floor))].sort((a, b) => {
    // Custom sort for floors: Garden, numbers ascending, Penthouse
    if (a === 'Garden') return -1;
    if (b === 'Garden') return 1;
    if (a === 'Penthouse') return 1;
    if (b === 'Penthouse') return -1;
    return parseInt(a) - parseInt(b);
  });
  const bedroomCounts = [...new Set(units.map(unit => unit.bedrooms))].sort((a, b) => a - b);
  const bathroomCounts = [...new Set(units.map(unit => unit.bathrooms))].sort((a, b) => a - b);

  // Create SQFT ranges
  const createSqftRanges = (): SizeRange[] => {
    const sqftValues = units.map(unit => unit.sqft).sort((a, b) => a - b);
    const min = sqftValues[0];
    const max = sqftValues[sqftValues.length - 1];
    const range = max - min;
    const step = range / 5;

    return Array.from({ length: 5 }, (_, i) => {
      const rangeMin = Math.floor(min + (step * i));
      const rangeMax = i === 4 ? max : Math.floor(min + (step * (i + 1)) - 1);
      return {
        min: rangeMin,
        max: rangeMax,
        label: `${rangeMin.toLocaleString()} - ${rangeMax.toLocaleString()} sqft`
      };
    });
  };

  // Create Outdoor ranges
  const createOutdoorRanges = (): SizeRange[] => {
    const outdoorValues = units.map(unit => unit.outdoorSqft).sort((a, b) => a - b);
    const min = outdoorValues[0];
    const max = outdoorValues[outdoorValues.length - 1];
    
    // Handle case where all units have the same outdoor space
    if (min === max) {
      return [{
        min,
        max,
        label: min === 0 ? 'No outdoor space' : `${min.toLocaleString()} sqft outdoor`
      }];
    }

    const range = max - min;
    const step = range / 5;

    return Array.from({ length: 5 }, (_, i) => {
      const rangeMin = Math.floor(min + (step * i));
      const rangeMax = i === 4 ? max : Math.floor(min + (step * (i + 1)) - 1);
      return {
        min: rangeMin,
        max: rangeMax,
        label: rangeMin === 0 && rangeMax === 0 ? 'No outdoor space' : 
               `${rangeMin.toLocaleString()} - ${rangeMax.toLocaleString()} sqft outdoor`
      };
    });
  };

  const sqftRanges = createSqftRanges();
  const outdoorRanges = createOutdoorRanges();

  // Initialize pricing items - always create full set if we have units
  const [pricingItems, setPricingItems] = useState<ListPricingItem[]>(() => {
    if (units.length > 0) {
      const initialItems: ListPricingItem[] = [
        // Base pricing items
        ...planTypes.map(type => ({ category: 'basePricingPlan', value: type, adjustment: 0 })),
        ...floors.map(floor => ({ category: 'basePricingFloor', value: floor, adjustment: 0 })),
        // Regular pricing items
        ...planTypes.map(type => ({ category: 'planType', value: type, adjustment: 0 })),
        ...orientations.map(orientation => ({ category: 'orientation', value: orientation, adjustment: 0 })),
        ...floors.map(floor => ({ category: 'floor', value: floor, adjustment: 0 })),
        ...bedroomCounts.map(count => ({ category: 'bedrooms', value: count.toString(), adjustment: 0 })),
        ...bathroomCounts.map(count => ({ category: 'bathrooms', value: count.toString(), adjustment: 0 })),
        ...sqftRanges.map(range => ({ category: 'sqft', value: `${range.min}-${range.max}`, adjustment: 0 })),
        ...outdoorRanges.map(range => ({ category: 'outdoor', value: `${range.min}-${range.max}`, adjustment: 0 }))
      ];
      
      // Merge with existing listPricing values
      return initialItems.map(item => {
        const existing = listPricing.find(lp => lp.category === item.category && lp.value === item.value);
        return existing ? existing : item;
      });
    }
    return listPricing;
  });

  // Update pricing items when listPricing prop changes
  useEffect(() => {
    if (units.length > 0) {
      const initialItems: ListPricingItem[] = [
        // Base pricing items
        ...planTypes.map(type => ({ category: 'basePricingPlan', value: type, adjustment: 0 })),
        ...floors.map(floor => ({ category: 'basePricingFloor', value: floor, adjustment: 0 })),
        // Regular pricing items
        ...planTypes.map(type => ({ category: 'planType', value: type, adjustment: 0 })),
        ...orientations.map(orientation => ({ category: 'orientation', value: orientation, adjustment: 0 })),
        ...floors.map(floor => ({ category: 'floor', value: floor, adjustment: 0 })),
        ...bedroomCounts.map(count => ({ category: 'bedrooms', value: count.toString(), adjustment: 0 })),
        ...bathroomCounts.map(count => ({ category: 'bathrooms', value: count.toString(), adjustment: 0 })),
        ...sqftRanges.map(range => ({ category: 'sqft', value: `${range.min}-${range.max}`, adjustment: 0 })),
        ...outdoorRanges.map(range => ({ category: 'outdoor', value: `${range.min}-${range.max}`, adjustment: 0 }))
      ];
      
      // Merge with existing listPricing values
      const mergedItems = initialItems.map(item => {
        const existing = listPricing.find(lp => lp.category === item.category && lp.value === item.value);
        return existing ? existing : item;
      });
      
      // Only update if the items have actually changed
      setPricingItems(prevItems => {
        if (JSON.stringify(prevItems) !== JSON.stringify(mergedItems)) {
          return mergedItems;
        }
        return prevItems;
      });
    }
  }, [listPricing, units.length]);

  const handleTempValueChange = (category: string, value: string, tempValue: string) => {
    const key = `${category}-${value}`;
    setTempValues(prev => ({ ...prev, [key]: tempValue }));
  };

  const handleAdjustmentCommit = (category: string, value: string, adjustment: number) => {
    const updatedItems = pricingItems.map(item =>
      item.category === category && item.value === value
        ? { ...item, adjustment }
        : item
    );
    setPricingItems(updatedItems);
    onListPricingChange(updatedItems);
    
    // Clear temp value
    const key = `${category}-${value}`;
    setTempValues(prev => {
      const newTempValues = { ...prev };
      delete newTempValues[key];
      return newTempValues;
    });
  };

  const handleInputBlur = (category: string, value: string, inputValue: string) => {
    const numValue = parseFloat(inputValue) || 0;
    handleAdjustmentCommit(category, value, numValue);
  };

  const handleInputKeyPress = (e: React.KeyboardEvent, category: string, value: string, inputValue: string) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      const numValue = parseFloat(inputValue) || 0;
      handleAdjustmentCommit(category, value, numValue);
      (e.target as HTMLInputElement).blur();
    }
  };

  const getInputValue = (category: string, value: string, currentAdjustment: number) => {
    const key = `${category}-${value}`;
    return tempValues[key] !== undefined ? tempValues[key] : currentAdjustment.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'basePricingPlan': return 'Base Pricing - Plan Types';
      case 'basePricingFloor': return 'Base Pricing - Floors';
      case 'planType': return 'Plan Types';
      case 'orientation': return 'Orientations';
      case 'floor': return 'Floors';
      case 'bedrooms': return 'Bedrooms';
      case 'bathrooms': return 'Bathrooms';
      case 'sqft': return 'Unit Size (SQFT)';
      case 'outdoor': return 'Outdoor Space';
      default: return category;
    }
  };

  const getValueLabel = (category: string, value: string) => {
    switch (category) {
      case 'basePricingPlan': return value;
      case 'basePricingFloor':
        if (value === 'Garden') return 'Garden Level';
        if (value === 'Penthouse') return 'Penthouse';
        if (!isNaN(parseInt(value))) return `Floor ${value}`;
        return value;
      case 'bedrooms': return `${value} bedroom${value !== '1' ? 's' : ''}`;
      case 'bathrooms': return `${value} bathroom${value !== '1' ? 's' : ''}`;
      case 'floor':
        if (value === 'Garden') return 'Garden Level';
        if (value === 'Penthouse') return 'Penthouse';
        if (!isNaN(parseInt(value))) return `Floor ${value}`;
        return value;
      case 'sqft':
        const sqftRange = sqftRanges.find(r => `${r.min}-${r.max}` === value);
        return sqftRange ? sqftRange.label : value;
      case 'outdoor':
        const outdoorRange = outdoorRanges.find(r => `${r.min}-${r.max}` === value);
        return outdoorRange ? outdoorRange.label : value;
      default: return value;
    }
  };

  const categories = ['basePricingPlan', 'basePricingFloor', 'planType', 'orientation', 'floor', 'bedrooms', 'bathrooms', 'sqft', 'outdoor'];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Price Builder</h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure base pricing and adjustments for specific categories. Positive values increase price, negative values decrease price.
        </p>
      </div>

      {/* Base Pricing Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Base Pricing</h3>
            <p className="text-sm text-blue-700 mt-1">
              Set base $/sqft pricing for plan types or floors. This overrides the imported base prices.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`text-sm font-medium ${basePricingMode === 'plan' ? 'text-blue-900' : 'text-blue-600'}`}>
              By Plan
            </span>
            <button
              type="button"
              onClick={() => handleBasePricingModeChange(basePricingMode === 'plan' ? 'floor' : 'plan')}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              {console.log('Toggle button rendered, current mode:', basePricingMode)}
              {basePricingMode === 'plan' ? (
                <ToggleLeft className="h-6 w-6" />
              ) : (
                <ToggleRight className="h-6 w-6" />
              )}
            </button>
            <span className={`text-sm font-medium ${basePricingMode === 'floor' ? 'text-blue-900' : 'text-blue-600'}`}>
              By Floor
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="col-span-full text-xs text-gray-500 mb-2">
              Debug: Mode={basePricingMode}, Total items={pricingItems.length}, 
              Plan items={pricingItems.filter(item => item.category === 'basePricingPlan').length},
              Floor items={pricingItems.filter(item => item.category === 'basePricingFloor').length}
            </div>
          )}
          
          {basePricingMode === 'plan' && 
            pricingItems
              .filter(item => item.category === 'basePricingPlan')
              .map(item => (
                <div key={`${item.category}-${item.value}`} className="space-y-2">
                  <label className="block text-sm font-medium text-blue-800">
                    {getValueLabel(item.category, item.value)}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 text-sm">
                      CAD $
                    </span>
                    <input
                      type="number"
                      value={getInputValue(item.category, item.value, item.adjustment)}
                      onChange={(e) => handleTempValueChange(item.category, item.value, e.target.value)}
                      onBlur={(e) => handleInputBlur(item.category, item.value, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const numValue = parseFloat((e.target as HTMLInputElement).value) || 0;
                          handleAdjustmentCommit(item.category, item.value, numValue);
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      className="w-full pl-12 pr-12 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-600 text-sm">
                      /sqft
                    </span>
                  </div>
                  {item.adjustment !== 0 && (
                    <p className="text-xs text-blue-700">
                      Base price: {formatCurrency(item.adjustment)}/sqft
                    </p>
                  )}
                </div>
              ))
          }
          
          {basePricingMode === 'floor' && 
            pricingItems
              .filter(item => item.category === 'basePricingFloor')
              .map(item => (
                <div key={`${item.category}-${item.value}`} className="space-y-2">
                  <label className="block text-sm font-medium text-blue-800">
                    {getValueLabel(item.category, item.value)}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 text-sm">
                      CAD $
                    </span>
                    <input
                      type="number"
                      value={getInputValue(item.category, item.value, item.adjustment)}
                      onChange={(e) => handleTempValueChange(item.category, item.value, e.target.value)}
                      onBlur={(e) => handleInputBlur(item.category, item.value, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const numValue = parseFloat((e.target as HTMLInputElement).value) || 0;
                          handleAdjustmentCommit(item.category, item.value, numValue);
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      className="w-full pl-12 pr-12 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-600 text-sm">
                      /sqft
                    </span>
                  </div>
                  {item.adjustment !== 0 && (
                    <p className="text-xs text-blue-700">
                      Base price: {formatCurrency(item.adjustment)}/sqft
                    </p>
                  )}
                </div>
              ))
          }
        </div>
      </div>

      {categories.map(category => {
        // Skip base pricing categories as they're handled separately above
        if (category === 'basePricingPlan' || category === 'basePricingFloor') {
          return null;
        }
        
        const categoryItems = pricingItems.filter(item => item.category === category);
        if (categoryItems.length === 0) return null;

        return (
          <div key={category} className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4">{getCategoryLabel(category)}</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryItems.map(item => (
                <div key={`${item.category}-${item.value}`} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {getValueLabel(item.category, item.value)}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      CAD $
                    </span>
                    <input
                      type="number"
                      value={getInputValue(item.category, item.value, item.adjustment)}
                      onChange={(e) => handleTempValueChange(item.category, item.value, e.target.value)}
                      onBlur={(e) => handleInputBlur(item.category, item.value, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const numValue = parseFloat((e.target as HTMLInputElement).value) || 0;
                          handleAdjustmentCommit(item.category, item.value, numValue);
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  {item.adjustment !== 0 && (
                    <p className={`text-xs ${item.adjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.adjustment > 0 ? '+' : ''}{formatCurrency(item.adjustment)} adjustment
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">How List Pricing Works</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Base Pricing:</strong> Sets the base $/sqft price for plan types or floors (overrides imported base prices)</li>
          <li>• Each unit will receive adjustments based on its characteristics</li>
          <li>• Multiple adjustments stack (e.g., plan type + orientation + floor)</li>
          <li>• Positive values increase the unit price, negative values decrease it</li>
          <li>• Global constraints (min/max price per sqft) still apply</li>
          <li>• Final prices are rounded according to your rounding rule</li>
        </ul>
      </div>
    </div>
  );
};
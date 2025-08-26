import React, { useState } from 'react';
import { Rule } from '../../types';
import { X, Check } from 'lucide-react';
import { Unit } from '../../types';

interface RuleFormProps {
  units: Unit[];
  onSave: (rule: Omit<Rule, 'id' | 'order'>) => void;
  onCancel: () => void;
  editingRule?: Rule;
}

export const RuleForm: React.FC<RuleFormProps> = ({ units, onSave, onCancel, editingRule }) => {
  const [tempAdjustmentValue, setTempAdjustmentValue] = useState('');

  const [rule, setRule] = useState<Omit<Rule, 'id' | 'order'>>(() => {
    if (editingRule) {
      return {
        name: editingRule.name,
        enabled: editingRule.enabled,
        criteria: editingRule.criteria,
        adjustment: editingRule.adjustment
      };
    }
    return {
      name: '',
      enabled: true,
      criteria: {},
      adjustment: {
        type: 'percentage',
        value: 0
      }
    };
  });

  const [selectedPlanTypes, setSelectedPlanTypes] = useState<string[]>(
    editingRule?.criteria.planTypes || []
  );
  const [selectedOrientations, setSelectedOrientations] = useState<string[]>(
    editingRule?.criteria.orientations || []
  );
  const [selectedFloors, setSelectedFloors] = useState<string[]>(
    editingRule?.criteria.floors || []
  );
  const [floorRange, setFloorRange] = useState<{ startFloor: string; endFloor: string } | null>(
    editingRule?.criteria.floorRange || null
  );
  const [selectedBedroomCounts, setSelectedBedroomCounts] = useState<number[]>(
    editingRule?.criteria.bedroomCounts || []
  );
  const [selectedBathroomCounts, setSelectedBathroomCounts] = useState<number[]>(
    editingRule?.criteria.bathroomCounts || []
  );

  // Initialize temp adjustment value
  React.useEffect(() => {
    setTempAdjustmentValue(rule.adjustment.value.toString());
  }, [rule.adjustment.value]);

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

  const handleSave = () => {
    if (!rule.name.trim()) return;

    const criteria: Rule['criteria'] = {};
    if (selectedPlanTypes.length > 0) criteria.planTypes = selectedPlanTypes;
    if (selectedOrientations.length > 0) criteria.orientations = selectedOrientations;
    if (selectedFloors.length > 0) criteria.floors = selectedFloors;
    if (floorRange && floorRange.startFloor && floorRange.endFloor) {
      criteria.floorRange = floorRange;
    }
    if (selectedBedroomCounts.length > 0) criteria.bedroomCounts = selectedBedroomCounts;
    if (selectedBathroomCounts.length > 0) criteria.bathroomCounts = selectedBathroomCounts;

    onSave({
      ...rule,
      criteria
    });
  };

  const handleAdjustmentValueBlur = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setRule({
      ...rule,
      adjustment: {
        ...rule.adjustment,
        value: numValue
      }
    });
  };

  const handleAdjustmentValueKeyPress = (e: React.KeyboardEvent, value: string) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      const numValue = parseFloat(value) || 0;
      setRule({
        ...rule,
        adjustment: {
          ...rule.adjustment,
          value: numValue
        }
      });
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      // Reset to current value on escape
      setTempAdjustmentValue(rule.adjustment.value.toString());
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900">
          {editingRule ? 'Edit Rule' : 'Create New Rule'}
        </h4>
        <div className="flex items-center space-x-2">
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rule Name
        </label>
        <input
          type="text"
          value={rule.name}
          onChange={(e) => setRule({ ...rule, name: e.target.value })}
          placeholder="e.g., Southwest Orientation Premium"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Plan Types (optional)
          </label>
          <div className="space-y-2">
            {planTypes.map(type => (
              <label key={type} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedPlanTypes.includes(type)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPlanTypes([...selectedPlanTypes, type]);
                    } else {
                      setSelectedPlanTypes(selectedPlanTypes.filter(t => t !== type));
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
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Orientations (optional)
          </label>
          <div className="space-y-2">
            {orientations.map(orientation => (
              <label key={orientation} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedOrientations.includes(orientation)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedOrientations([...selectedOrientations, orientation]);
                    } else {
                      setSelectedOrientations(selectedOrientations.filter(o => o !== orientation));
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
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Floors (optional)
          </label>
          <div className="space-y-2">
            {floors.map(floor => (
              <label key={floor} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedFloors.includes(floor)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedFloors([...selectedFloors, floor]);
                    } else {
                      setSelectedFloors(selectedFloors.filter(f => f !== floor));
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
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Bedrooms (optional)
          </label>
          <div className="space-y-2">
            {bedroomCounts.map(count => (
              <label key={count} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedBedroomCounts.includes(count)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedBedroomCounts([...selectedBedroomCounts, count]);
                    } else {
                      setSelectedBedroomCounts(selectedBedroomCounts.filter(c => c !== count));
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{count} bedroom{count !== 1 ? 's' : ''}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Bathrooms (optional)
          </label>
          <div className="space-y-2">
            {bathroomCounts.map(count => (
              <label key={count} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedBathroomCounts.includes(count)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedBathroomCounts([...selectedBathroomCounts, count]);
                    } else {
                      setSelectedBathroomCounts(selectedBathroomCounts.filter(c => c !== count));
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{count} bathroom{count !== 1 ? 's' : ''}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="col-span-2">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <label className="block text-sm font-medium text-blue-900 mb-3">
              Floor Range (optional) - Incremental Effect
            </label>
            <p className="text-xs text-blue-700 mb-3">
              Apply adjustment incrementally across floor levels. Each higher floor gets an additional multiplier.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-blue-800 mb-1">
                  Start Floor
                </label>
                <select
                  value={floorRange?.startFloor || ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      setFloorRange(prev => ({
                        startFloor: e.target.value,
                        endFloor: prev?.endFloor || e.target.value
                      }));
                    } else {
                      setFloorRange(null);
                    }
                  }}
                  className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select start floor</option>
                  {floors.map(floor => (
                    <option key={floor} value={floor}>{floor}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-800 mb-1">
                  End Floor
                </label>
                <select
                  value={floorRange?.endFloor || ''}
                  onChange={(e) => {
                    if (floorRange && e.target.value) {
                      setFloorRange(prev => ({
                        startFloor: prev?.startFloor || e.target.value,
                        endFloor: e.target.value
                      }));
                    }
                  }}
                  disabled={!floorRange?.startFloor}
                  className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select end floor</option>
                  {floors.map(floor => (
                    <option key={floor} value={floor}>{floor}</option>
                  ))}
                </select>
              </div>
            </div>
            {floorRange?.startFloor && floorRange?.endFloor && (
              <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-800">
                <strong>Example:</strong> Floor {floorRange.startFloor} gets 1× adjustment, 
                next floor gets 2× adjustment, and so on through Floor {floorRange.endFloor}.
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Adjustment
          </label>
          <div className="space-y-3">
            <select
              value={rule.adjustment.type}
              onChange={(e) => setRule({
                ...rule,
                adjustment: {
                  ...rule.adjustment,
                  type: e.target.value as 'fixed' | 'percentage' | 'per_sqft'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (CAD $)</option>
              <option value="per_sqft">Per Square Foot (CAD $/sqft)</option>
            </select>
            
            <div className="relative">
              {rule.adjustment.type === 'fixed' && (
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                  CAD $
                </span>
              )}
              {rule.adjustment.type === 'percentage' && (
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                  %
                </span>
              )}
              {rule.adjustment.type === 'per_sqft' && (
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                  CAD $
                </span>
              )}
              <input
                type="number"
                value={tempAdjustmentValue}
                onChange={(e) => setTempAdjustmentValue(e.target.value)}
                onBlur={(e) => handleAdjustmentValueBlur(e.target.value)}
                onKeyPress={(e) => handleAdjustmentValueKeyPress(e, (e.target as HTMLInputElement).value)}
                className={`w-full py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  rule.adjustment.type === 'fixed' ? 'pl-12 pr-3' :
                  rule.adjustment.type === 'percentage' ? 'px-3 pr-8' :
                  rule.adjustment.type === 'per_sqft' ? 'pl-12 pr-3' : 'px-3'
                }`}
                placeholder="Enter value"
              />
              {rule.adjustment.type === 'per_sqft' && (
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                  /sqft
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!rule.name.trim()}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="h-4 w-4" />
          <span>Save Rule</span>
        </button>
      </div>
    </div>
  );
};
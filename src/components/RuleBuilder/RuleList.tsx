import React from 'react';
import { Rule } from '../../types';
import { GripVertical, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

interface RuleListProps {
  rules: Rule[];
  onUpdate: (ruleId: string, updates: Partial<Rule>) => void;
  onDelete: (ruleId: string) => void;
  onReorder: (rules: Rule[]) => void;
  onEdit: (rule: Rule) => void;
}

export const RuleList: React.FC<RuleListProps> = ({
  rules,
  onUpdate,
  onDelete,
  onReorder,
  onEdit
}) => {
  const formatAdjustment = (adjustment: Rule['adjustment']) => {
    switch (adjustment.type) {
      case 'fixed':
        return `+${new Intl.NumberFormat('en-CA', {
          style: 'currency',
          currency: 'CAD',
          minimumFractionDigits: 0,
        }).format(adjustment.value)}`;
      case 'percentage':
        return `+${adjustment.value}%`;
      case 'per_sqft':
        return `+${new Intl.NumberFormat('en-CA', {
          style: 'currency',
          currency: 'CAD',
          minimumFractionDigits: 0,
        }).format(adjustment.value)}/sqft`;
      case 'per_floor':
        const floorRange = adjustment.floorRange;
        const rangeText = floorRange ? ` (${floorRange.startFloor}-${floorRange.endFloor})` : '';
        return `+${new Intl.NumberFormat('en-CA', {
          style: 'currency',
          currency: 'CAD',
          minimumFractionDigits: 0,
        }).format(adjustment.value)}/floor${rangeText}`;
      default:
        return '';
    }
  };

  const formatCriteria = (criteria: Rule['criteria']) => {
    const parts: string[] = [];
    
    if (criteria.planTypes?.length) {
      parts.push(`Plan: ${criteria.planTypes.join(', ')}`);
    }
    if (criteria.orientations?.length) {
      parts.push(`Orientation: ${criteria.orientations.join(', ')}`);
    }
    if (criteria.floors?.length) {
      parts.push(`Floor: ${criteria.floors.join(', ')}`);
    }
    if (criteria.bedroomCounts?.length) {
      parts.push(`Bedrooms: ${criteria.bedroomCounts.join(', ')}`);
    }
    if (criteria.bathroomCounts?.length) {
      parts.push(`Bathrooms: ${criteria.bathroomCounts.join(', ')}`);
    }
    if (criteria.sizeBands?.length) {
      parts.push(`Size: ${criteria.sizeBands.map(band => `${band.min}-${band.max} sqft`).join(', ')}`);
    }
    if (criteria.outdoorBands?.length) {
      parts.push(`Outdoor: ${criteria.outdoorBands.map(band => `${band.min}-${band.max} sqft`).join(', ')}`);
    }
    
    return parts.join(' • ') || 'All units';
  };

  if (rules.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No rules defined yet. Create your first pricing rule to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rules.map((rule, index) => (
        <div
          key={rule.id}
          className={`flex items-center space-x-4 p-4 border rounded-lg transition-all ${
            rule.enabled 
              ? 'border-gray-200 bg-white' 
              : 'border-gray-200 bg-gray-50 opacity-60'
          }`}
        >
          <div className="flex items-center space-x-2 text-gray-400">
            <GripVertical className="h-4 w-4 cursor-move" />
            <span className="text-sm font-medium">{index + 1}</span>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{rule.name}</h4>
                <p className="text-sm text-gray-500 mt-1">{formatCriteria(rule.criteria)}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  rule.adjustment.type === 'fixed' ? 'bg-blue-100 text-blue-700' :
                  rule.adjustment.type === 'percentage' ? 'bg-green-100 text-green-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {formatAdjustment(rule.adjustment)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onUpdate(rule.id, { enabled: !rule.enabled })}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {rule.enabled ? (
                <ToggleRight className="h-5 w-5 text-blue-600" />
              ) : (
                <ToggleLeft className="h-5 w-5" />
              )}
            </button>
            
            <button
              onClick={() => onEdit(rule)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              title="Edit Rule"
            >
              <Edit className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => onDelete(rule.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
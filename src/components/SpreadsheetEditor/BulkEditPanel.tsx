import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface BulkEditPanelProps {
  selectedCount: number;
  onApply: (adjustment: { type: 'final_price' | 'price_per_sqft'; value: number }) => void;
  onCancel: () => void;
}

export const BulkEditPanel: React.FC<BulkEditPanelProps> = ({
  selectedCount,
  onApply,
  onCancel
}) => {
  const [adjustmentType, setAdjustmentType] = useState<'final_price' | 'price_per_sqft'>('final_price');
  const [adjustmentValue, setAdjustmentValue] = useState(0);

  const handleApply = () => {
    onApply({
      type: adjustmentType,
      value: adjustmentValue
    });
  };

  return (
    <div className="p-4 bg-blue-50 border-b border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900">
          Bulk Edit - {selectedCount} units selected
        </h4>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Adjustment Type
          </label>
          <select
            value={adjustmentType}
            onChange={(e) => setAdjustmentType(e.target.value as typeof adjustmentType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="final_price">Final Price (CAD $)</option>
            <option value="price_per_sqft">Price Per SqFt (CAD $/sqft)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Value
          </label>
          <div className="relative">
            {adjustmentType === 'final_price' && (
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                CAD $
              </span>
            )}
            {adjustmentType === 'price_per_sqft' && (
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                CAD $
              </span>
            )}
            <input
              type="number"
              value={adjustmentValue}
              onChange={(e) => setAdjustmentValue(Number(e.target.value))}
              className={`w-full py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                adjustmentType === 'final_price' ? 'pl-12 pr-3' :
                'pl-12 pr-3'
              }`}
              placeholder="Enter value"
            />
            {adjustmentType === 'price_per_sqft' && (
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                /sqft
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
          >
            <Check className="h-4 w-4" />
            <span>Apply to {selectedCount} units</span>
          </button>
        </div>
      </div>
    </div>
  );
};
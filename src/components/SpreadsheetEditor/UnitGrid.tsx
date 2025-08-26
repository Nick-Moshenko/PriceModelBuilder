import React, { useState } from 'react';
import { Unit } from '../../types';

interface UnitGridProps {
  units: Unit[];
  selectedUnits: string[];
  onSelectionChange: (selected: string[]) => void;
  onUnitUpdate: (unitId: string, updates: Partial<Unit>) => void;
}

export const UnitGrid: React.FC<UnitGridProps> = ({
  units,
  selectedUnits,
  onSelectionChange,
  onUnitUpdate
}) => {
  const [editingCell, setEditingCell] = useState<{ unitId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleCellEdit = (unitId: string, field: string, currentValue: any) => {
    setEditingCell({ unitId, field });
    setEditValue(String(currentValue));
  };

  const handleCellSave = () => {
    if (!editingCell) return;

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

  const handleSelectAll = () => {
    if (selectedUnits.length === units.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(units.map(unit => unit.id));
    }
  };

  const handleSelectUnit = (unitId: string) => {
    if (selectedUnits.includes(unitId)) {
      onSelectionChange(selectedUnits.filter(id => id !== unitId));
    } else {
      onSelectionChange([...selectedUnits, unitId]);
    }
  };

  const getPremiumsText = (premiums: Unit['premiums']) => {
    if (premiums.length === 0) return '—';
    return premiums.map(p => `${p.name}: ${formatCurrency(p.amount)}`).join(', ');
  };

  return (
    <>
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="w-12 px-4 py-3 text-left">
              <input
                type="checkbox"
                checked={selectedUnits.length === units.length && units.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Unit
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Floor
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Plan
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Bed/Bath
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sqft
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Orientation
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Outdoor
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Base Price
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Premiums
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Final Price
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              $/Sqft
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {units.map((unit, index) => (
            <tr
              key={unit.id}
              className={`hover:bg-gray-50 transition-colors ${
                selectedUnits.includes(unit.id) ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
            >
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedUnits.includes(unit.id)}
                  onChange={() => handleSelectUnit(unit.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </td>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                {unit.floor}-{unit.unit}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">
                {unit.floor}
              </td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                  {unit.planType}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">
                {unit.bedrooms}BR/{unit.bathrooms}BA
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">
                {unit.sqft.toLocaleString()}
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  ['SW', 'SE'].includes(unit.orientation) 
                    ? 'bg-orange-100 text-orange-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {unit.orientation}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">
                {unit.outdoorSqft} sqft
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">
                {formatCurrency(unit.basePrice)}
              </td>
              <td className="px-4 py-3 text-xs text-gray-500 max-w-32 truncate">
                {getPremiumsText(unit.premiums)}
              </td>
              <td className="px-4 py-3">
                {editingCell?.unitId === unit.id && editingCell?.field === 'finalPrice' ? (
                  <input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleCellSave}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleCellSave();
                      if (e.key === 'Escape') handleCellCancel();
                      e.stopPropagation(); // Prevent event bubbling
                    }}
                    className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                ) : (
                  <div
                    onClick={() => handleCellEdit(unit.id, 'finalPrice', unit.finalPrice)}
                    className="text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                  >
                    {formatCurrency(unit.finalPrice)}
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                {editingCell?.unitId === unit.id && editingCell?.field === 'finalPricePerSqft' ? (
                  <input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleCellSave}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleCellSave();
                      if (e.key === 'Escape') handleCellCancel();
                      e.stopPropagation(); // Prevent event bubbling
                    }}
                    className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                ) : (
                  <div
                    onClick={() => handleCellEdit(unit.id, 'finalPricePerSqft', unit.finalPricePerSqft)}
                    className="text-sm text-gray-700 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                  >
                    {formatCurrency(unit.finalPricePerSqft)}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {units.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No units match the current filters.</p>
        </div>
      )}
    </>
  );
};
import React from 'react';
import { GlobalSettings } from '../../types';

const { useState } = React;

interface GlobalSettingsPanelProps {
  settings: GlobalSettings;
  onChange: (settings: GlobalSettings) => void;
}

export const GlobalSettingsPanel: React.FC<GlobalSettingsPanelProps> = ({
  settings,
  onChange
}) => {
  const [tempValues, setTempValues] = useState({
    minPricePerSqft: settings.minPricePerSqft.toString(),
    maxPricePerSqft: settings.maxPricePerSqft.toString()
  });

  // Update temp values when settings change
  React.useEffect(() => {
    setTempValues({
      minPricePerSqft: settings.minPricePerSqft.toString(),
      maxPricePerSqft: settings.maxPricePerSqft.toString()
    });
  }, [settings]);

  const handleInputBlur = (field: 'minPricePerSqft' | 'maxPricePerSqft', value: string) => {
    const numValue = parseFloat(value) || 0;
    onChange({
      ...settings,
      [field]: numValue
    });
  };

  const handleInputKeyPress = (e: React.KeyboardEvent, field: 'minPricePerSqft' | 'maxPricePerSqft', value: string) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      const numValue = parseFloat(value) || 0;
      onChange({
        ...settings,
        [field]: numValue
      });
      (e.target as HTMLInputElement).blur();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Global Constraints</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum $/sqft
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              CAD $
            </span>
            <input
              type="number"
              value={tempValues.minPricePerSqft}
              onChange={(e) => setTempValues(prev => ({ ...prev, minPricePerSqft: e.target.value }))}
              onBlur={(e) => handleInputBlur('minPricePerSqft', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const numValue = parseFloat((e.target as HTMLInputElement).value) || 0;
                  onChange({
                    ...settings,
                    minPricePerSqft: numValue
                  });
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum $/sqft
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              CAD $
            </span>
            <input
              type="number"
              value={tempValues.maxPricePerSqft}
              onChange={(e) => setTempValues(prev => ({ ...prev, maxPricePerSqft: e.target.value }))}
              onBlur={(e) => handleInputBlur('maxPricePerSqft', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const numValue = parseFloat((e.target as HTMLInputElement).value) || 0;
                  onChange({
                    ...settings,
                    maxPricePerSqft: numValue
                  });
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rounding Rule
          </label>
          <select
            value={settings.roundingRule}
            onChange={(e) => onChange({
              ...settings,
              roundingRule: Number(e.target.value)
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={1000}>Nearest $1,000</option>
            <option value={5000}>Nearest $5,000</option>
            <option value={10000}>Nearest $10,000</option>
          </select>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600">
          <p><strong>Current Settings:</strong> Units will be constrained between {formatCurrency(settings.minPricePerSqft)}/sqft and {formatCurrency(settings.maxPricePerSqft)}/sqft, with final prices rounded to the nearest {formatCurrency(settings.roundingRule)}.</p>
        </div>
      </div>
    </div>
  );
};
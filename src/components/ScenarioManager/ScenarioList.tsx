import React, { useState } from 'react';
import { Scenario } from '../../types';
import { Plus, Copy, Trash2, Edit, Check } from 'lucide-react';

interface ScenarioListProps {
  scenarios: Scenario[];
  activeScenario: string;
  onScenarioSelect: (scenarioId: string) => void;
  onCreateScenario: (name: string) => void;
  onDuplicateScenario: (scenarioId: string) => void;
  onDeleteScenario: (scenarioId: string) => void;
}

export const ScenarioList: React.FC<ScenarioListProps> = ({
  scenarios,
  activeScenario,
  onScenarioSelect,
  onCreateScenario,
  onDuplicateScenario,
  onDeleteScenario
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');

  const handleCreate = () => {
    if (newScenarioName.trim()) {
      onCreateScenario(newScenarioName);
      setNewScenarioName('');
      setIsCreating(false);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Scenarios</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center space-x-1 px-3 py-1.5 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm"
        >
          <Plus className="h-4 w-4" />
          <span>New</span>
        </button>
      </div>

      {isCreating && (
        <div className="flex items-center space-x-2 p-3 bg-white border border-gray-200 rounded-lg">
          <input
            type="text"
            value={newScenarioName}
            onChange={(e) => setNewScenarioName(e.target.value)}
            placeholder="Scenario name"
            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <button
            onClick={handleCreate}
            className="p-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Check className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {scenarios.map((scenario) => (
          <div
            key={scenario.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
              activeScenario === scenario.id
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => onScenarioSelect(scenario.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-gray-900">{scenario.name}</h3>
                  {scenario.isBaseline && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                      Baseline
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Version {scenario.version} • {scenario.createdBy}
                </p>
                <p className="text-sm font-medium text-gray-900 mt-2">
                  Revenue: {formatCurrency(scenario.revenueSummary.totalRevenue)}
                </p>
                {scenario.revenueSummary.deltaFromBaseline !== 0 && (
                  <p className={`text-sm mt-1 ${
                    scenario.revenueSummary.deltaFromBaseline > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {scenario.revenueSummary.deltaFromBaseline > 0 ? '+' : ''}
                    {formatCurrency(scenario.revenueSummary.deltaFromBaseline)} 
                    ({scenario.revenueSummary.deltaPercentage > 0 ? '+' : ''}
                    {scenario.revenueSummary.deltaPercentage.toFixed(1)}%)
                  </p>
                )}
              </div>
              
              {!scenario.isBaseline && (
                <div className="flex items-center space-x-1 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateScenario(scenario.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteScenario(scenario.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
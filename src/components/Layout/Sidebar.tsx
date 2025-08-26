import React from 'react';
import { FileText, BarChart3, GitCompare, Settings2, ChevronLeft, ChevronRight, Plus, Copy, Trash2, Edit2, Check, X } from 'lucide-react';
import { Scenario } from '../../types';

export type SidebarTab = 'scenarios' | 'compare' | 'reports' | 'settings';

interface SidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  scenarios: Scenario[];
  activeScenario: string;
  onScenarioSelect: (scenarioId: string) => void;
  onCreateScenario: (name: string) => void;
  onDuplicateScenario: (scenarioId: string) => void;
  onDeleteScenario: (scenarioId: string) => void;
  onRenameScenario: (scenarioId: string, newName: string) => void;
  selectedComparisons: string[];
  onScenarioSelectionChange: (scenarioIds: string[]) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  isCollapsed, 
  onToggleCollapse,
  scenarios,
  activeScenario,
  onScenarioSelect,
  onCreateScenario,
  onDuplicateScenario,
  onDeleteScenario,
  onRenameScenario,
  selectedComparisons,
  onScenarioSelectionChange
}) => {
  const [isCreatingScenario, setIsCreatingScenario] = React.useState(false);
  const [newScenarioName, setNewScenarioName] = React.useState('');
  const [editingScenarioId, setEditingScenarioId] = React.useState<string | null>(null);
  const [editingScenarioName, setEditingScenarioName] = React.useState('');

  const tabs = [
    { id: 'scenarios' as const, name: 'Scenarios', icon: FileText },
    { id: 'compare' as const, name: 'Compare', icon: GitCompare },
    { id: 'reports' as const, name: 'Reports', icon: BarChart3 },
    { id: 'settings' as const, name: 'Settings', icon: Settings2 },
  ];

  const handleCreateScenario = () => {
    if (newScenarioName.trim()) {
      onCreateScenario(newScenarioName);
      setNewScenarioName('');
      setIsCreatingScenario(false);
    }
  };

  const handleStartRename = (scenario: Scenario) => {
    setEditingScenarioId(scenario.id);
    setEditingScenarioName(scenario.name);
  };

  const handleSaveRename = () => {
    if (editingScenarioId && editingScenarioName.trim()) {
      onRenameScenario(editingScenarioId, editingScenarioName.trim());
    }
    setEditingScenarioId(null);
    setEditingScenarioName('');
  };

  const handleCancelRename = () => {
    setEditingScenarioId(null);
    setEditingScenarioName('');
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
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-gray-50 border-r border-gray-200 h-full transition-all duration-300 ease-in-out relative`}>
      {/* Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-8 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors z-10"
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>

      <div className={`${isCollapsed ? 'pt-6 px-2' : 'p-4'} transition-all duration-300 h-full overflow-y-auto`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              title={isCollapsed ? tab.name : undefined}
              className={`w-full flex items-center rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-100'
              } ${
                isCollapsed 
                  ? 'justify-center px-2 py-3' 
                  : 'space-x-3 px-4 py-3 text-left'
              }`}
            >
              <Icon className="h-5 w-5" />
              {!isCollapsed && <span className="font-medium">{tab.name}</span>}
            </button>
          );
        })}

        {/* Scenarios Submenu */}
        {activeTab === 'scenarios' && !isCollapsed && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Scenarios
              </h3>
              <button
                onClick={() => setIsCreatingScenario(true)}
                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="New Scenario"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* New Scenario Form */}
            {isCreatingScenario && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newScenarioName}
                  onChange={(e) => setNewScenarioName(e.target.value)}
                  placeholder="Scenario name"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleCreateScenario();
                    if (e.key === 'Escape') {
                      setIsCreatingScenario(false);
                      setNewScenarioName('');
                    }
                  }}
                  autoFocus
                />
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handleCreateScenario}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setIsCreatingScenario(false);
                      setNewScenarioName('');
                    }}
                    className="px-2 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Scenarios List */}
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className={`p-2 rounded-lg cursor-pointer transition-all group ${
                    activeScenario === scenario.id
                      ? 'bg-blue-100 border border-blue-200'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => onScenarioSelect(scenario.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1">
                        {editingScenarioId === scenario.id ? (
                          <div className="flex items-center space-x-1 flex-1">
                            <input
                              type="text"
                              value={editingScenarioName}
                              onChange={(e) => setEditingScenarioName(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') handleSaveRename();
                                if (e.key === 'Escape') handleCancelRename();
                              }}
                              className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveRename();
                              }}
                              className="p-1 text-green-600 hover:text-green-700 rounded transition-colors"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelRename();
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {scenario.name}
                          </h4>
                        )}
                        {scenario.isBaseline && (
                          <span className="px-1 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                            Base
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatCurrency(scenario.revenueSummary.totalRevenue)}
                      </p>
                      {Math.abs(scenario.revenueSummary.deltaFromBaseline) >= 1 && (
                        <p className={`text-xs mt-0.5 ${
                          scenario.revenueSummary.deltaFromBaseline > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {scenario.revenueSummary.deltaFromBaseline > 0 ? '+' : ''}
                          {scenario.revenueSummary.deltaPercentage.toFixed(1)}%
                        </p>
                      )}
                    </div>
                    
                    {!scenario.isBaseline && editingScenarioId !== scenario.id && (
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartRename(scenario);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                          title="Rename"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateScenario(scenario.id);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteScenario(scenario.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Comparison Submenu */}
        {activeTab === 'compare' && !isCollapsed && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Compare Scenarios
              </h3>
              <span className="text-xs text-gray-400">
                {selectedComparisons.length}/3
              </span>
            </div>
            
            <div className="text-xs text-gray-500 mb-3">
              Select up to 3 scenarios to compare
            </div>

            {/* Scenarios List for Comparison */}
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  onClick={() => {
                    if (selectedComparisons.includes(scenario.id)) {
                      onScenarioSelectionChange(selectedComparisons.filter(id => id !== scenario.id));
                    } else if (selectedComparisons.length < 3) {
                      onScenarioSelectionChange([...selectedComparisons, scenario.id]);
                    }
                  }}
                  className={`p-2 rounded-lg cursor-pointer transition-all ${
                    selectedComparisons.includes(scenario.id)
                      ? 'bg-blue-100 border border-blue-200'
                      : selectedComparisons.length >= 3 
                        ? 'opacity-50 cursor-not-allowed hover:bg-gray-50'
                        : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {scenario.name}
                        </h4>
                        {scenario.isBaseline && (
                          <span className="px-1 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                            Base
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatCurrency(scenario.revenueSummary.totalRevenue)}
                      </p>
                      {Math.abs(scenario.revenueSummary.deltaFromBaseline) >= 1 && (
                        <p className={`text-xs mt-0.5 ${
                          scenario.revenueSummary.deltaFromBaseline > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {scenario.revenueSummary.deltaFromBaseline > 0 ? '+' : ''}
                          {scenario.revenueSummary.deltaPercentage.toFixed(1)}%
                        </p>
                      )}
                    </div>
                    
                    {selectedComparisons.includes(scenario.id) && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center ml-2">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
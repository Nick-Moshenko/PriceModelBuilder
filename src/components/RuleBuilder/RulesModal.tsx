import React from 'react';
import { X, Settings, List, Sliders } from 'lucide-react';
import { Rule, GlobalSettings } from '../../types';
import { RuleList } from './RuleList';
import { RuleForm } from './RuleForm';
import { GlobalSettingsPanel } from './GlobalSettingsPanel';
import { ListPricingPanel } from './ListPricingPanel';
import { Unit } from '../../types';

interface ListPricingItem {
  category: string;
  value: string;
  adjustment: number;
}

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: Unit[];
  rules: Rule[];
  globalSettings: GlobalSettings;
  onRulesChange: (rules: Rule[]) => void;
  onGlobalSettingsChange: (settings: GlobalSettings) => void;
  listPricing?: ListPricingItem[];
  onListPricingChange?: (items: ListPricingItem[]) => void;
  basePricingMode?: 'plan' | 'floor';
  onBasePricingModeChange?: (mode: 'plan' | 'floor') => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({
  isOpen,
  onClose,
  units,
  rules,
  globalSettings,
  onRulesChange,
  onGlobalSettingsChange,
  listPricing = [],
  onListPricingChange = () => {},
  basePricingMode = 'plan',
  onBasePricingModeChange = () => {}
}) => {
  const [activeMode, setActiveMode] = React.useState<'rules' | 'list' | 'settings'>('rules');
  const [isCreatingRule, setIsCreatingRule] = React.useState(false);
  const [editingRule, setEditingRule] = React.useState<Rule | null>(null);

  if (!isOpen) return null;

  const handleCreateRule = (rule: Omit<Rule, 'id' | 'order'>) => {
    const newRule: Rule = {
      ...rule,
      id: `rule-${Date.now()}`,
      order: rules.length
    };
    onRulesChange([...rules, newRule]);
    setIsCreatingRule(false);
  };

  const handleUpdateRuleProperty = (ruleId: string, updates: Partial<Rule>) => {
    onRulesChange(rules.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ));
  };

  const handleUpdateRule = (updatedRule: Omit<Rule, 'id' | 'order'>) => {
    if (!editingRule) return;
    
    const updated: Rule = {
      ...updatedRule,
      id: editingRule.id,
      order: editingRule.order
    };
    
    onRulesChange(rules.map(rule => 
      rule.id === editingRule.id ? updated : rule
    ));
    setEditingRule(null);
  };

  const handleEditRule = (rule: Rule) => {
    setEditingRule(rule);
    setIsCreatingRule(false);
  };
  const handleDeleteRule = (ruleId: string) => {
    onRulesChange(rules.filter(rule => rule.id !== ruleId));
  };

  const handleReorderRules = (reorderedRules: Rule[]) => {
    onRulesChange(reorderedRules.map((rule, index) => ({ ...rule, order: index })));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="absolute right-0 top-0 h-full w-full max-w-4xl bg-white shadow-xl transform transition-transform">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Pricing Configuration</h2>
              <p className="text-sm text-gray-500 mt-1">
                Configure pricing rules, list pricing, and global settings
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Mode Toggle */}
            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
              <button
                onClick={() => {
                  setActiveMode('rules');
                  setIsCreatingRule(false);
                  setEditingRule(null);
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeMode === 'rules'
                    ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Settings className="h-4 w-4" />
                <span>Rules</span>
              </button>
              <button
                onClick={() => {
                  setActiveMode('list');
                  setIsCreatingRule(false);
                  setEditingRule(null);
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeMode === 'list'
                    ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="h-4 w-4" />
                <span>List</span>
              </button>
              <button
                onClick={() => {
                  setActiveMode('settings');
                  setIsCreatingRule(false);
                  setEditingRule(null);
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeMode === 'settings'
                    ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Sliders className="h-4 w-4" />
                <span>Settings</span>
              </button>
            </div>

            {activeMode === 'rules' && (
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Pricing Rules</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Rules are applied in order. Drag to reorder rule precedence.
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {rules.length > 0 && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete all ${rules.length} rules? This action cannot be undone.`)) {
                              onRulesChange([]);
                            }
                          }}
                          className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Delete All Rules
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setIsCreatingRule(true);
                          setEditingRule(null);
                        }}
                        className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                      >
                        Add Rule
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {(isCreatingRule || editingRule) && (
                    <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-lg">
                      <RuleForm
                        units={units}
                        onSave={editingRule ? handleUpdateRule : handleCreateRule}
                        onCancel={() => {
                          setIsCreatingRule(false);
                          setEditingRule(null);
                        }}
                        editingRule={editingRule || undefined}
                      />
                    </div>
                  )}

                  <RuleList
                    rules={rules}
                    onUpdate={handleUpdateRuleProperty}
                    onDelete={handleDeleteRule}
                    onReorder={handleReorderRules}
                    onEdit={handleEditRule}
                  />
                </div>
              </div>
            )}

            {activeMode === 'list' && (
              <div className="bg-white border border-gray-200 rounded-lg">
                {/*<div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">List Pricing</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Configure base pricing and adjustments for specific categories.
                      </p>
                    </div>
                  </div>
                </div>*/}
                <div className="p-6">
                  <ListPricingPanel
                    units={units}
                    listPricing={listPricing}
                    onListPricingChange={onListPricingChange}
                    basePricingMode={basePricingMode}
                    onBasePricingModeChange={onBasePricingModeChange}
                  />
                </div>
              </div>
            )}

            {activeMode === 'settings' && (
              <GlobalSettingsPanel 
                settings={globalSettings}
                onChange={onGlobalSettingsChange}
              />
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {activeMode === 'rules' && `${rules.length} rule${rules.length !== 1 ? 's' : ''} configured`}
              {activeMode === 'list' && `${listPricing.filter(item => item.adjustment !== 0).length} pricing items configured`}
                {activeMode === 'settings' && 'Global pricing constraints and rounding rules'}
                
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
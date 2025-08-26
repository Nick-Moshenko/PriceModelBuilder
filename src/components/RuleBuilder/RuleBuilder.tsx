import React, { useState } from 'react';
import { Rule, GlobalSettings } from '../../types';
import { RuleList } from './RuleList';
import { RuleForm } from './RuleForm';
import { GlobalSettingsPanel } from './GlobalSettingsPanel';

interface RuleBuilderProps {
  rules: Rule[];
  globalSettings: GlobalSettings;
  onRulesChange: (rules: Rule[]) => void;
  onGlobalSettingsChange: (settings: GlobalSettings) => void;
}

export const RuleBuilder: React.FC<RuleBuilderProps> = ({
  rules,
  globalSettings,
  onRulesChange,
  onGlobalSettingsChange
}) => {
  const [isCreatingRule, setIsCreatingRule] = useState(false);

  const handleCreateRule = (rule: Omit<Rule, 'id' | 'order'>) => {
    const newRule: Rule = {
      ...rule,
      id: `rule-${Date.now()}`,
      order: rules.length
    };
    onRulesChange([...rules, newRule]);
    setIsCreatingRule(false);
  };

  const handleUpdateRule = (ruleId: string, updates: Partial<Rule>) => {
    onRulesChange(rules.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ));
  };

  const handleDeleteRule = (ruleId: string) => {
    onRulesChange(rules.filter(rule => rule.id !== ruleId));
  };

  const handleReorderRules = (reorderedRules: Rule[]) => {
    onRulesChange(reorderedRules.map((rule, index) => ({ ...rule, order: index })));
  };

  return (
    <div className="space-y-6">
      <GlobalSettingsPanel 
        settings={globalSettings}
        onChange={onGlobalSettingsChange}
      />
      
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Pricing Rules</h3>
              <p className="text-sm text-gray-500 mt-1">
                Rules are applied in order. Drag to reorder rule precedence.
              </p>
            </div>
            <button
              onClick={() => setIsCreatingRule(true)}
              className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
            >
              Add Rule
            </button>
          </div>
        </div>

        <div className="p-6">
          {isCreatingRule && (
            <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-lg">
              <RuleForm
                onSave={handleCreateRule}
                onCancel={() => setIsCreatingRule(false)}
              />
            </div>
          )}

          <RuleList
            rules={rules}
            onUpdate={handleUpdateRule}
            onDelete={handleDeleteRule}
            onReorder={handleReorderRules}
          />
        </div>
      </div>
    </div>
  );
};
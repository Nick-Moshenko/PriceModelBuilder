import React from 'react';
import { EditorMode } from '../../types';
import { Settings, Table } from 'lucide-react';

interface EditorToggleProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
}

export const EditorToggle: React.FC<EditorToggleProps> = ({ mode, onModeChange }) => {
  return (
    <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
      <button
        onClick={() => onModeChange('rules')}
        className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
          mode === 'rules'
            ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Settings className="h-4 w-4" />
        <span>Rule Builder</span>
      </button>
      <button
        onClick={() => onModeChange('spreadsheet')}
        className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
          mode === 'spreadsheet'
            ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Table className="h-4 w-4" />
        <span>Spreadsheet Editor</span>
      </button>
    </div>
  );
};
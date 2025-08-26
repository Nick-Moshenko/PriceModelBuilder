import React, { useState } from 'react';
import { Building, Plus, ChevronDown } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

interface ProjectSelectorProps {
  projects: Project[];
  activeProject: string;
  onProjectSelect: (projectId: string) => void;
  onCreateProject: () => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  activeProject,
  onProjectSelect,
  onCreateProject
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const activeProjectData = projects.find(p => p.id === activeProject);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Building className="h-4 w-4" />
        <div className="text-left">
          <div className="text-sm font-medium">
            {activeProjectData?.name || 'Select Project'}
          </div>
          {activeProjectData?.description && (
            <div className="text-xs text-gray-500 truncate max-w-32">
              {activeProjectData.description}
            </div>
          )}
        </div>
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-200">
            <h4 className="font-medium text-gray-900">Select Project</h4>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {projects.map(project => (
              <button
                key={project.id}
                onClick={() => {
                  onProjectSelect(project.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                  activeProject === project.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                }`}
              >
                <div className="font-medium text-gray-900">{project.name}</div>
                {project.description && (
                  <div className="text-sm text-gray-500 mt-1">{project.description}</div>
                )}
                <div className="text-xs text-gray-400 mt-1">
                  Created {new Date(project.created_at).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>

          <div className="p-3 border-t border-gray-200">
            <button
              onClick={() => {
                onCreateProject();
                setIsOpen(false);
              }}
              className="flex items-center space-x-2 w-full px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Project</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
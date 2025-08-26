import React from 'react';
import { Building, Settings, Download, Upload, FileUp } from 'lucide-react';
import { UserMenu } from '../Auth/UserMenu';
import { ProjectSelector } from '../ProjectSetup/ProjectSelector';

interface HeaderProps {
  projects: any[];
  activeProject: string;
  onProjectSelect: (projectId: string) => void;
  onCreateProject: () => void;
  onExport: () => void;
  onPushLive: () => void;
  onImport: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  projects,
  activeProject,
  onProjectSelect,
  onCreateProject,
  onExport, 
  onPushLive, 
  onImport 
}) => {
  const activeProjectData = projects.find(p => p.id === activeProject);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Building className="h-8 w-8 text-blue-700" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Price Model Builder</h1>
              <p className="text-sm text-gray-500">
                Project: {activeProjectData?.name || 'No project selected'}
              </p>
            </div>
          </div>
          
          <ProjectSelector
            projects={projects}
            activeProject={activeProject}
            onProjectSelect={onProjectSelect}
            onCreateProject={onCreateProject}
          />
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={onImport}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FileUp className="h-4 w-4" />
            <span>Import</span>
          </button>
          
          <button
            onClick={onExport}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          
          <button
            onClick={onPushLive}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Push to Live</span>
          </button>
          
          <div className="border-l border-gray-200 pl-4">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
};
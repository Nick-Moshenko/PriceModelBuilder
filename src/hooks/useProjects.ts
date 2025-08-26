import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const useProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user's projects
  const loadProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setActiveProject('');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching projects:', fetchError);
        throw fetchError;
      }

      setProjects(data || []);
      
      // Set active project to first project if none selected
      if (data && data.length > 0 && !activeProject) {
        setActiveProject(data[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load projects:', err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [user, activeProject]);

  // Create new project
  const createProject = useCallback(async (name: string, description?: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name,
          description
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        throw error;
      }

      await loadProjects();
      setActiveProject(data.id);
      return data.id;
    } catch (err: any) {
      console.error('Failed to create project:', err);
      throw err;
    }
  }, [user, loadProjects]);

  // Load projects when user changes
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return {
    projects,
    activeProject,
    setActiveProject,
    loading,
    error,
    createProject,
    refreshProjects: loadProjects
  };
};
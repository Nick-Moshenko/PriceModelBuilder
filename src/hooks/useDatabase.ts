import { useState, useEffect, useCallback } from 'react';
import { DatabaseService } from '../services/database';
import { Scenario, Unit, Rule, GlobalSettings } from '../types';

export const useDatabase = (projectId: string) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load scenarios from database
  const loadScenarios = useCallback(async () => {
    if (!projectId) {
      setScenarios([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Loading scenarios from database...');
      const data = await DatabaseService.getScenarios(projectId);
      console.log('Loaded scenarios:', data.length);
      setScenarios(data);
    } catch (err) {
      console.error('Error loading scenarios:', err);
      setError('Failed to load scenarios from database. Please check your Supabase connection.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Create new scenario
  const createScenario = useCallback(async (name: string) => {
    if (!projectId) throw new Error('No project selected');

    try {
      const scenarioId = await DatabaseService.createScenario(projectId, name);
      await loadScenarios(); // Reload to get the new scenario
      return scenarioId;
    } catch (err) {
      console.error('Error creating scenario:', err);
      setError('Failed to create scenario');
      throw err;
    }
  }, [projectId, loadScenarios]);

  // Duplicate scenario
  const duplicateScenario = useCallback(async (scenarioId: string) => {
    try {
      const newScenarioId = await DatabaseService.duplicateScenario(scenarioId);
      await loadScenarios(); // Reload to get the duplicated scenario
      return newScenarioId;
    } catch (err) {
      console.error('Error duplicating scenario:', err);
      setError('Failed to duplicate scenario');
      throw err;
    }
  }, [loadScenarios]);

  // Delete scenario
  const deleteScenario = useCallback(async (scenarioId: string) => {
    try {
      await DatabaseService.deleteScenario(scenarioId);
      await loadScenarios(); // Reload to reflect deletion
    } catch (err) {
      console.error('Error deleting scenario:', err);
      setError('Failed to delete scenario');
      throw err;
    }
  }, [loadScenarios]);

  // Update scenario
  const updateScenario = useCallback(async (scenarioId: string, updates: Partial<Scenario>) => {
    try {
      await DatabaseService.updateScenario(scenarioId, updates);
      await loadScenarios(); // Reload to get updated data
    } catch (err) {
      console.error('Error updating scenario:', err);
      setError('Failed to update scenario');
      throw err;
    }
  }, [loadScenarios]);

  // Rename scenario
  const renameScenario = useCallback(async (scenarioId: string, newName: string) => {
    try {
      await DatabaseService.updateScenario(scenarioId, { name: newName });
      await loadScenarios(); // Reload to get updated data
    } catch (err) {
      console.error('Error renaming scenario:', err);
      setError('Failed to rename scenario');
      throw err;
    }
  }, [loadScenarios]);
  // Import units to baseline
  const importUnitsToBaseline = useCallback(async (units: Unit[], mode: 'override' | 'append') => {
    if (!projectId) throw new Error('No project selected');

    try {
      await DatabaseService.importUnitsToBaseline(projectId, units, mode);
      await loadScenarios(); // Reload to get updated data
    } catch (err) {
      console.error('Error importing units:', err);
      setError('Failed to import units');
      throw err;
    }
  }, [projectId, loadScenarios]);
  // Load data on mount
  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);

  return {
    scenarios,
    loading,
    error,
    createScenario,
    duplicateScenario,
    deleteScenario,
    updateScenario,
    renameScenario,
    importUnitsToBaseline,
    refreshScenarios: loadScenarios
  };
};
import React, { useState, useCallback, useMemo } from 'react';
import { Building, Table, Settings } from 'lucide-react';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { useDatabase } from './hooks/useDatabase';
import { useProjects } from './hooks/useProjects';
import { Header } from './components/Layout/Header';
import { Sidebar, SidebarTab } from './components/Layout/Sidebar';
import { RulesModal } from './components/RuleBuilder/RulesModal';
import { ImportModal } from './components/DataImport/ImportModal';
import { ProjectCreationModal } from './components/ProjectSetup/ProjectCreationModal';
import { SpreadsheetEditor } from './components/SpreadsheetEditor/SpreadsheetEditor';
import { StackingPlan } from './components/StackingPlan/StackingPlan';
import { RevenueChart } from './components/ComparisonView/RevenueChart';
import { ComparisonTable } from './components/ComparisonView/ComparisonTable';
import { Scenario, Unit, Rule, GlobalSettings, Premium, RevenueSummary, ListPricingItem } from './types';

function AppContent() {
  // Project management
  const { 
    projects, 
    activeProject, 
    setActiveProject, 
    loading: projectsLoading, 
    error: projectsError, 
    createProject 
  } = useProjects();

  // Database hook
  const { 
    scenarios, 
    loading, 
    error, 
    createScenario, 
    duplicateScenario, 
    deleteScenario, 
    updateScenario,
    renameScenario,
    importUnitsToBaseline
  } = useDatabase(activeProject);

  // State management
  const [activeTab, setActiveTab] = useState<SidebarTab>('scenarios');
  const [activeScenarioId, setActiveScenarioId] = useState<string>('');
  const [stackingPlanMode, setStackingPlanMode] = useState<'stacking' | 'spreadsheet'>('stacking');
  const [selectedComparisons, setSelectedComparisons] = useState<string[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [projectCreationModalOpen, setProjectCreationModalOpen] = useState(false);

  // Set active scenario to baseline when scenarios load
  React.useEffect(() => {
    if (scenarios.length > 0 && !activeScenarioId) {
      const baseline = scenarios.find(s => s.isBaseline);
      if (baseline) {
        setActiveScenarioId(baseline.id);
        setSelectedComparisons([baseline.id]);
      } else {
        setActiveScenarioId(scenarios[0].id);
        setSelectedComparisons([scenarios[0].id]);
      }
    }
  }, [scenarios, activeScenarioId]);

  // Get active scenario
  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0];

  // Calculate revenue summary for a scenario
  const calculateRevenueSummary = useCallback((units: Unit[], isBaseline = false): RevenueSummary => {
    const totalRevenue = units.reduce((sum, unit) => sum + unit.finalPrice, 0);
    
    // Calculate delta from baseline
    let deltaFromBaseline = 0;
    let deltaPercentage = 0;
    
    if (!isBaseline) {
      // Find the baseline scenario
      const baselineScenario = scenarios.find(s => s.isBaseline);
      if (baselineScenario) {
        const baselineRevenue = baselineScenario.units.reduce((sum, unit) => sum + unit.finalPrice, 0);
        deltaFromBaseline = totalRevenue - baselineRevenue;
        deltaPercentage = baselineRevenue > 0 ? ((deltaFromBaseline / baselineRevenue) * 100) : 0;
      }
    }
    // For baseline scenarios, delta remains 0

    // Per-floor revenue - dynamically get all floors from units
    const perFloorRevenue: Record<string, number> = {};
    const floors = [...new Set(units.map(u => u.floor))];
    floors.forEach(floor => {
      perFloorRevenue[floor] = units
        .filter(u => u.floor === floor)
        .reduce((sum, u) => sum + u.finalPrice, 0);
    });

    // Per-plan type revenue - dynamically get all plan types from units
    const perPlanTypeRevenue: Record<string, number> = {};
    const planTypes = [...new Set(units.map(u => u.planType))];
    planTypes.forEach(planType => {
      perPlanTypeRevenue[planType] = units
        .filter(u => u.planType === planType)
        .reduce((sum, u) => sum + u.finalPrice, 0);
    });

    // Unit count by price range
    const unitCountByPriceRange = {
      'Under $1M': units.filter(u => u.finalPrice < 1000000).length,
      '$1M-$1.5M': units.filter(u => u.finalPrice >= 1000000 && u.finalPrice < 1500000).length,
      '$1.5M-$2M': units.filter(u => u.finalPrice >= 1500000 && u.finalPrice < 2000000).length,
      'Over $2M': units.filter(u => u.finalPrice >= 2000000).length,
    };

    return {
      totalRevenue,
      deltaFromBaseline,
      deltaPercentage,
      perFloorRevenue,
      perPlanTypeRevenue,
      unitCountByPriceRange
    };
  }, [scenarios]);

  // Apply rules to units (moved to a separate function for reuse)
  const applyRulesToUnits = useCallback((units: Unit[], rules: Rule[], globalSettings: GlobalSettings): Unit[] => {
    return units.map(unit => {
      let finalPrice = unit.basePrice;
      const premiums: Premium[] = [];

      // Apply each enabled rule in order
      rules
        .filter(rule => rule.enabled)
        .sort((a, b) => a.order - b.order)
        .forEach(rule => {
          let matches = true;

          // Check criteria
          if (rule.criteria.planTypes?.length && !rule.criteria.planTypes.includes(unit.planType)) {
            matches = false;
          }
          if (rule.criteria.orientations?.length && !rule.criteria.orientations.includes(unit.orientation)) {
            matches = false;
          }
          if (rule.criteria.floors?.length && !rule.criteria.floors.includes(unit.floor)) {
            matches = false;
          }
          if (rule.criteria.sizeBands?.length) {
            const matchesSize = rule.criteria.sizeBands.some(band => 
              unit.sqft >= band.min && unit.sqft <= band.max
            );
            if (!matchesSize) matches = false;
          }
          if (rule.criteria.outdoorBands?.length) {
            const matchesOutdoor = rule.criteria.outdoorBands.some(band => 
              unit.outdoorSqft >= band.min && unit.outdoorSqft <= band.max
            );
            if (!matchesOutdoor) matches = false;
          }
          if (rule.criteria.bedroomCounts?.length && !rule.criteria.bedroomCounts.includes(unit.bedrooms)) {
            matches = false;
          }
          if (rule.criteria.bathroomCounts?.length && !rule.criteria.bathroomCounts.includes(unit.bathrooms)) {
            matches = false;
          }
          if (rule.criteria.floorRange) {
            const { startFloor, endFloor } = rule.criteria.floorRange;
            const floorLevel = getFloorLevel(unit.floor, startFloor, endFloor, units);
           console.log(`Unit ${unit.id} on floor ${unit.floor}: floorLevel = ${floorLevel}, range: ${startFloor}-${endFloor}`);
            if (floorLevel === 0) {
              matches = false;
            }
          }

          if (matches) {
            let adjustment = 0;
            let floorMultiplier = 1;
            
            // Calculate floor multiplier if floor range is specified
            if (rule.criteria.floorRange) {
              const { startFloor, endFloor } = rule.criteria.floorRange;
              floorMultiplier = getFloorLevel(unit.floor, startFloor, endFloor, units);
             console.log(`Applying floor multiplier ${floorMultiplier} to unit ${unit.id}`);
            }
            
            switch (rule.adjustment.type) {
              case 'fixed':
                adjustment = rule.adjustment.value * floorMultiplier;
               console.log(`Fixed adjustment: ${rule.adjustment.value} * ${floorMultiplier} = ${adjustment}`);
                break;
              case 'percentage':
                adjustment = finalPrice * (rule.adjustment.value / 100) * floorMultiplier;
               console.log(`Percentage adjustment: ${finalPrice} * ${rule.adjustment.value}% * ${floorMultiplier} = ${adjustment}`);
                break;
              case 'per_sqft':
                adjustment = rule.adjustment.value * unit.sqft * floorMultiplier;
               console.log(`Per sqft adjustment: ${rule.adjustment.value} * ${unit.sqft} * ${floorMultiplier} = ${adjustment}`);
                break;
            }

            if (adjustment !== 0) {
              let premiumName = rule.name;
              if (rule.criteria.floorRange && floorMultiplier > 1) {
                premiumName = `${rule.name} (Floor ${unit.floor} - ${floorMultiplier}x)`;
              }
             console.log(`Adding premium: ${premiumName} = ${adjustment}`);
              
              premiums.push({
                id: rule.id,
                name: premiumName,
                type: rule.adjustment.type,
                value: rule.adjustment.value,
                amount: adjustment
              });
              finalPrice += adjustment;
            }
          }
        });

      // Apply global constraints
      const pricePerSqft = finalPrice / unit.sqft;
      if (pricePerSqft < globalSettings.minPricePerSqft) {
        finalPrice = globalSettings.minPricePerSqft * unit.sqft;
      }
      if (pricePerSqft > globalSettings.maxPricePerSqft) {
        finalPrice = globalSettings.maxPricePerSqft * unit.sqft;
      }

      // Apply rounding
      finalPrice = Math.round(finalPrice / globalSettings.roundingRule) * globalSettings.roundingRule;

      return {
        ...unit,
        finalPrice,
        finalPricePerSqft: finalPrice / unit.sqft,
        premiums
      };
    });
  }, []);

  // Apply list pricing to units
  const applyListPricingToUnits = useCallback((units: Unit[], listPricing: ListPricingItem[], globalSettings: GlobalSettings, basePricingMode: 'plan' | 'floor' = 'plan'): Unit[] => {
    return units.map(unit => {
      let basePrice = unit.basePrice;
      let basePricePerSqft = unit.basePricePerSqft;
      let finalPrice = unit.basePrice; // Start fresh from base price
      const premiums: Premium[] = []; // Start with empty premiums

      // First, apply base pricing - only apply values that are greater than 0
      listPricing.forEach(item => {
        if (item.adjustment <= 0) return; // Only apply if there's a positive value

        let matches = false;

        switch (item.category) {
          case 'basePricingPlan':
            matches = basePricingMode === 'plan' && unit.planType === item.value;
            if (matches) {
              basePricePerSqft = item.adjustment;
              basePrice = basePricePerSqft * unit.sqft;
              finalPrice = basePrice;
              console.log(`Applied base pricing for plan ${item.value}: ${basePricePerSqft}/sqft, total: ${basePrice}`);
            }
            break;
          case 'basePricingFloor':
            matches = basePricingMode === 'floor' && unit.floor === item.value;
            if (matches) {
              basePricePerSqft = item.adjustment;
              basePrice = basePricePerSqft * unit.sqft;
              finalPrice = basePrice;
              console.log(`Applied base pricing for floor ${item.value}: ${basePricePerSqft}/sqft, total: ${basePrice}`);
            }
            break;
        }
      });

      // Apply list pricing adjustments
      listPricing.forEach(item => {
        if (item.adjustment === 0) return;

        // Skip base pricing categories as they're handled above
        if (item.category === 'basePricingPlan' || item.category === 'basePricingFloor') {
          return;
        }

        let matches = false;
        let categoryLabel = '';

        switch (item.category) {
          case 'planType':
            matches = unit.planType === item.value;
            categoryLabel = `Plan Type: ${item.value}`;
            break;
          case 'orientation':
            matches = unit.orientation === item.value;
            categoryLabel = `Orientation: ${item.value}`;
            break;
          case 'floor':
            matches = unit.floor === item.value;
            categoryLabel = `Floor: ${item.value}`;
            break;
          case 'bedrooms':
            matches = unit.bedrooms === parseInt(item.value);
            categoryLabel = `${item.value} Bedroom${item.value !== '1' ? 's' : ''}`;
            break;
          case 'bathrooms':
            matches = unit.bathrooms === parseFloat(item.value);
            categoryLabel = `${item.value} Bathroom${item.value !== '1' ? 's' : ''}`;
            break;
        }

        if (matches) {
          premiums.push({
            id: `list-${item.category}-${item.value}`,
            name: categoryLabel,
            type: 'fixed',
            value: item.adjustment,
            amount: item.adjustment
          });
          finalPrice += item.adjustment;
        }
      });

      // Apply global constraints, but skip minimum price check if base pricing was applied
      const pricePerSqft = finalPrice / unit.sqft;
      const hasBasePricing = listPricing.some(item => 
        (basePricingMode === 'plan' && item.category === 'basePricingPlan' && unit.planType === item.value && item.adjustment > 0) ||
        (basePricingMode === 'floor' && item.category === 'basePricingFloor' && unit.floor === item.value && item.adjustment > 0)
      );
      
      // Only apply minimum price constraint if no base pricing was set
      if (!hasBasePricing && pricePerSqft < globalSettings.minPricePerSqft) {
        finalPrice = globalSettings.minPricePerSqft * unit.sqft;
      }
      // Always apply maximum price constraint
      if (pricePerSqft > globalSettings.maxPricePerSqft) {
        finalPrice = globalSettings.maxPricePerSqft * unit.sqft;
      }

      // Apply rounding
      finalPrice = Math.round(finalPrice / globalSettings.roundingRule) * globalSettings.roundingRule;

      return {
        ...unit,
        basePrice,
        basePricePerSqft,
        finalPrice,
        finalPricePerSqft: finalPrice / unit.sqft,
        premiums
      };
    });
  }, []);

  // Update scenario with rule application
  const handleUpdateScenario = useCallback(async (scenarioId: string, updates: Partial<Scenario>) => {
    console.log('App: handleUpdateScenario called with:', { scenarioId, updates });
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    let updatedScenario = { ...scenario, ...updates };
    
    // Recalculate units if rules, list pricing, or settings changed
    if (updates.rules || updates.listPricing || updates.globalSettings) {
      // Start with truly base units (no premiums, original base prices)
      const baseUnits = scenario.units.map(unit => ({
        ...unit,
        finalPrice: unit.basePrice,
        finalPricePerSqft: unit.basePricePerSqft,
        premiums: []
      }));
      
      let newUnits = baseUnits;
      
      // Apply list pricing first (includes base pricing)
      if (updatedScenario.listPricing && updatedScenario.listPricing.length > 0) {
        // Get the current base pricing mode from the modal state
        const basePricingMode = updatedScenario.basePricingMode || 'plan';
        newUnits = applyListPricingToUnits(
          newUnits,
          updatedScenario.listPricing,
          updatedScenario.globalSettings,
          basePricingMode
        );
      }
      
      // Then apply rules on top of list pricing
      if (updatedScenario.rules && updatedScenario.rules.length > 0) {
        newUnits = applyRulesToUnits(
          newUnits,
          updatedScenario.rules,
          updatedScenario.globalSettings
        );
      }
      
      updatedScenario.units = newUnits;
    }
    
    // Only pass the specific updates that were requested, not the entire scenario
    const dbUpdates: Partial<Scenario> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.globalSettings !== undefined) dbUpdates.globalSettings = updates.globalSettings;
    if (updates.listPricing !== undefined) dbUpdates.listPricing = updates.listPricing;
    if (updates.basePricingMode !== undefined) dbUpdates.basePricingMode = updates.basePricingMode;
    if (updates.rules !== undefined) dbUpdates.rules = updates.rules;
    if (updatedScenario.units !== scenario.units) dbUpdates.units = updatedScenario.units;
    
    await updateScenario(scenarioId, dbUpdates);
  }, [scenarios, applyRulesToUnits, applyListPricingToUnits, updateScenario]);

  // Helper function to calculate floor level for per_floor adjustments
  const getFloorLevel = useCallback((unitFloor: string, startFloor: string, endFloor: string, units: Unit[]): number => {
    // Create ordered list of floors
    const allFloors = [...new Set(units.map(u => u.floor))];
   console.log('All floors available:', allFloors);
    const orderedFloors = allFloors.sort((a, b) => {
      // Custom sort: Garden first, then numbers ascending, then Penthouse last
      if (a === 'Garden') return -1;
      if (b === 'Garden') return 1;
      if (a === 'Penthouse') return 1;
      if (b === 'Penthouse') return -1;
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      return a.localeCompare(b);
    });
   console.log('Ordered floors:', orderedFloors);

    const startIndex = orderedFloors.indexOf(startFloor);
    const endIndex = orderedFloors.indexOf(endFloor);
    const unitIndex = orderedFloors.indexOf(unitFloor);
   console.log(`Floor indices - start: ${startIndex}, end: ${endIndex}, unit: ${unitIndex}`);

    // Check if unit floor is within the specified range
    if (startIndex === -1 || endIndex === -1 || unitIndex === -1) return 0;
    if (unitIndex < startIndex || unitIndex > endIndex) return 0;

    // Calculate floor level (1-based, relative to start floor)
   const floorLevel = unitIndex - startIndex + 1;
   console.log(`Floor level for ${unitFloor}: ${floorLevel}`);
   return floorLevel;
  }, []);

  // Handle rules change
  const handleRulesChange = useCallback((rules: Rule[]) => {
    handleUpdateScenario(activeScenarioId, { rules });
  }, [activeScenarioId, handleUpdateScenario]);

  // Handle global settings change
  const handleGlobalSettingsChange = useCallback((globalSettings: GlobalSettings) => {
    handleUpdateScenario(activeScenarioId, { globalSettings });
  }, [activeScenarioId, handleUpdateScenario]);

  // Handle list pricing change
  const handleListPricingChange = useCallback((listPricing: ListPricingItem[]) => {
    handleUpdateScenario(activeScenarioId, { listPricing });
  }, [activeScenarioId, handleUpdateScenario]);

  // Handle base pricing mode change
  const handleBasePricingModeChange = useCallback((basePricingMode: 'plan' | 'floor') => {
    console.log('App: handleBasePricingModeChange called with:', basePricingMode);
    console.log('App: activeScenarioId:', activeScenarioId);
    console.log('App: current activeScenario basePricingMode:', activeScenario?.basePricingMode);
    handleUpdateScenario(activeScenarioId, { basePricingMode });
  }, [activeScenarioId, handleUpdateScenario]);

  // Handle units change (from spreadsheet editor)
  const handleUnitsChange = useCallback((units: Unit[]) => {
    if (activeScenario) {
      updateScenario(activeScenarioId, { units });
    }
  }, [activeScenarioId, activeScenario, updateScenario]);

  // Handle single unit update (from stacking plan)
  const handleSingleUnitUpdate = useCallback((unitId: string, updates: Partial<Unit>) => {
    if (activeScenario) {
      const updatedUnits = activeScenario.units.map(unit => 
        unit.id === unitId ? { ...unit, ...updates } : unit
      );
      updateScenario(activeScenarioId, { units: updatedUnits });
    }
  }, [activeScenarioId, activeScenario, updateScenario]);

  // Scenario management
  const handleCreateScenario = useCallback(async (name: string) => {
    if (!activeProject) {
      console.error('No active project selected');
      return;
    }

    try {
      const scenarioId = await createScenario(name);
      setActiveScenarioId(scenarioId);
    } catch (err) {
      console.error('Failed to create scenario:', err);
    }
  }, [createScenario]);

  const handleDuplicateScenario = useCallback(async (scenarioId: string) => {
    try {
      const newScenarioId = await duplicateScenario(scenarioId);
      setActiveScenarioId(newScenarioId);
    } catch (err) {
      console.error('Failed to duplicate scenario:', err);
    }
  }, [duplicateScenario]);

  const handleDeleteScenario = useCallback(async (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (scenario?.isBaseline) return; // Don't delete baseline
    
    try {
      await deleteScenario(scenarioId);
      if (activeScenarioId === scenarioId) {
        const baseline = scenarios.find(s => s.isBaseline);
        setActiveScenarioId(baseline?.id || scenarios[0]?.id || '');
      }
    } catch (err) {
      console.error('Failed to delete scenario:', err);
    }
  }, [scenarios, activeScenarioId, deleteScenario]);

  const handleRenameScenario = useCallback(async (scenarioId: string, newName: string) => {
    try {
      await renameScenario(scenarioId, newName);
    } catch (err) {
      console.error('Failed to rename scenario:', err);
    }
  }, [renameScenario]);
  // Export and push live handlers
  const handleExport = useCallback(() => {
    if (!activeScenario || !activeProject) return;
    
    // Create CSV data
    const csvData = activeScenario.units.map(unit => ({
      Unit: unit.unit,
      Floor: unit.floor,
      'Plan Type': unit.planType,
      'Square Feet': unit.sqft,
      Orientation: unit.orientation,
      'Outdoor Space': unit.outdoorSqft,
      'Base Price': unit.basePrice,
      'Final Price': unit.finalPrice,
      'Price per SqFt': unit.finalPricePerSqft,
      Premiums: unit.premiums.map(p => `${p.name}: $${p.amount}`).join('; ')
    }));

    // Convert to CSV string
    const headers = Object.keys(csvData[0]);
    const csvString = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');

    // Download file
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeScenario.name.replace(/\s+/g, '_')}_pricing.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeScenario]);

  const handlePushLive = useCallback(() => {
    if (!activeScenario || !activeProject) return;
    
    // In a real app, this would make an API call
    alert(`Successfully pushed "${activeScenario.name}" to live pricing model!\n\nUnits updated: ${activeScenario.units.length}\nTotal revenue: ${new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
    }).format(activeScenario.revenueSummary.totalRevenue)}`);
  }, [activeScenario]);

  // Handle import
  const handleImport = useCallback(async (units: Unit[], mode: 'override' | 'append') => {
    if (!activeProject) {
      console.error('No active project selected');
      return;
    }

    try {
      await importUnitsToBaseline(units, mode);
      setImportModalOpen(false);
    } catch (err) {
      console.error('Failed to import units:', err);
    }
  }, [activeProject, importUnitsToBaseline]);

  // Project management handlers
  const handleCreateProject = useCallback(async (name: string, description?: string) => {
    try {
      await createProject(name, description);
    } catch (err) {
      console.error('Failed to create project:', err);
      throw err;
    }
  }, [createProject]);

  // Loading and error states
  if (projectsLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {projectsLoading ? 'Loading projects...' : 'Loading scenarios from database...'}
          </p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment on first load</p>
        </div>
      </div>
    );
  }

  if (projectsError || error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">{projectsError || error}</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
            <h3 className="font-medium text-yellow-800 mb-2">Setup Required:</h3>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. Click "Connect to Supabase" in the top right</li>
              <li>2. Set up your Supabase project</li>
              <li>3. The database will be automatically initialized</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // Show project creation modal if no projects exist
  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Price Model Builder</h2>
          <p className="text-gray-600 mb-6">
            Get started by creating your first project. You'll be able to manage pricing scenarios, 
            import unit data, and build comprehensive pricing models.
          </p>
          <button
            onClick={() => setProjectCreationModalOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Project
          </button>
        </div>
        
        <ProjectCreationModal
          isOpen={projectCreationModalOpen}
          onClose={() => setProjectCreationModalOpen(false)}
          onCreateProject={handleCreateProject}
        />
      </div>
    );
  }

  if (!activeProject || !activeScenario) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-gray-600 mb-4">
            {!activeProject ? 'No project selected.' : 'No scenarios available.'}
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <h3 className="font-medium text-blue-800 mb-2">Getting Started:</h3>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. {!activeProject ? 'Select a project from the header' : 'Make sure Supabase is connected'}</li>
              <li>2. {!activeProject ? 'Or create a new project' : 'The database will automatically create a baseline scenario'}</li>
              <li>3. {!activeProject ? 'Import your unit data to get started' : 'If issues persist, check the browser console for errors'}</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // Render main content based on active tab
  const renderMainContent = () => {
    switch (activeTab) {
      case 'scenarios':
        return (
          <div className="space-y-6">
            {/* Scenario Header */}
            {/*<div>
              <h1 className="text-2xl font-bold text-gray-900">{activeScenario.name}</h1>
              <p className="text-gray-600 mt-1">
                Version {activeScenario.version} • Created by {activeScenario.createdBy}
              </p>
            </div>*/}
              
            <div className="relative">
              {/* Stacking Plan / Spreadsheet Editor */}
              <div>
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {stackingPlanMode === 'stacking' ? (
                          <>
                            <Building className="h-5 w-5 text-gray-600" />
                            <h3 className="text-lg font-semibold text-gray-900">{activeScenario.name}</h3>
                          </>
                        ) : (
                          <>
                            <Table className="h-5 w-5 text-gray-600" />
                            <h3 className="text-lg font-semibold text-gray-900">{activeScenario.name}</h3>
                          </>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
                          <button
                            onClick={() => setStackingPlanMode('stacking')}
                            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-colors text-sm ${
                              stackingPlanMode === 'stacking'
                                ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            <Building className="h-4 w-4" />
                            <span>Stacking</span>
                          </button>
                          <button
                            onClick={() => setStackingPlanMode('spreadsheet')}
                            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-colors text-sm ${
                              stackingPlanMode === 'spreadsheet'
                                ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            <Table className="h-4 w-4" />
                            <span>Spreadsheet</span>
                          </button>
                        </div>
                        <button
                          onClick={() => setRulesModalOpen(true)}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                        >
                          <Settings className="h-4 w-4" />
                          <span>Rules & Settings</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-0">
                    {stackingPlanMode === 'stacking' ? (
                      <StackingPlan 
                        units={activeScenario.units} 
                        onUnitUpdate={handleSingleUnitUpdate}
                      />
                    ) : (
                      <SpreadsheetEditor
                        units={activeScenario.units}
                        onUnitsChange={handleUnitsChange}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('en-CA', {
                    style: 'currency',
                    currency: 'CAD',
                    minimumFractionDigits: 0,
                  }).format(activeScenario.revenueSummary.totalRevenue)}
                </div>
                <div className="text-sm text-gray-600">Total Revenue</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className={`text-2xl font-bold ${
                  Math.abs(activeScenario.revenueSummary.deltaFromBaseline) < 1 ? 'text-gray-900' :
                  activeScenario.revenueSummary.deltaFromBaseline > 0 ? 'text-green-600' :
                  'text-red-600'
                }`}>
                  {Math.abs(activeScenario.revenueSummary.deltaFromBaseline) < 1 ? '—' : (
                    <>
                      {activeScenario.revenueSummary.deltaFromBaseline > 0 ? '+' : ''}
                      {new Intl.NumberFormat('en-CA', {
                        style: 'currency',
                        currency: 'CAD',
                        minimumFractionDigits: 0,
                      }).format(activeScenario.revenueSummary.deltaFromBaseline)}
                    </>
                  )}
                </div>
                <div className="text-sm text-gray-600">vs Baseline</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className={`text-2xl font-bold ${
                  Math.abs(activeScenario.revenueSummary.deltaPercentage) < 0.1 ? 'text-gray-900' :
                  activeScenario.revenueSummary.deltaPercentage > 0 ? 'text-green-600' :
                  'text-red-600'
                }`}>
                  {Math.abs(activeScenario.revenueSummary.deltaPercentage) < 0.1 ? '—' : (
                    <>
                      {activeScenario.revenueSummary.deltaPercentage > 0 ? '+' : ''}
                      {activeScenario.revenueSummary.deltaPercentage.toFixed(1)}%
                    </>
                  )}
                </div>
                <div className="text-sm text-gray-600">Change</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">
                  {activeScenario.units.length}
                </div>
                <div className="text-sm text-gray-600">Units</div>
              </div>
            </div>
          </div>
        );

      case 'compare':
        return (
          <div className="space-y-6">
            {selectedComparisons.length > 0 && (
              <>
                <RevenueChart scenarios={scenarios.filter(s => selectedComparisons.includes(s.id))} />
                <ComparisonTable scenarios={scenarios.filter(s => selectedComparisons.includes(s.id))} />
              </>
            )}

            {selectedComparisons.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                <p className="text-gray-500">Select up to 3 scenarios from the sidebar to compare</p>
              </div>
            )}
          </div>
        );

      case 'reports':
        return (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Reports & Analytics</h2>
            <p className="text-gray-600 mb-8">Advanced reporting features coming soon</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="p-6 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Revenue Trends</h3>
                <p className="text-sm text-gray-600">Track pricing changes over time</p>
              </div>
              <div className="p-6 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Market Analysis</h3>
                <p className="text-sm text-gray-600">Compare with market benchmarks</p>
              </div>
              <div className="p-6 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Performance Metrics</h3>
                <p className="text-sm text-gray-600">Scenario success analytics</p>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Settings</h2>
            <p className="text-gray-600 mb-8">Configure global project preferences</p>
            <div className="max-w-md mx-auto space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg text-left">
                <h3 className="font-semibold text-gray-900 mb-2">Default Constraints</h3>
                <p className="text-sm text-gray-600">Set default min/max pricing and rounding rules</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg text-left">
                <h3 className="font-semibold text-gray-900 mb-2">User Permissions</h3>
                <p className="text-sm text-gray-600">Manage team access and approval workflows</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg text-left">
                <h3 className="font-semibold text-gray-900 mb-2">Integration Settings</h3>
                <p className="text-sm text-gray-600">Configure external system connections</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        projects={projects}
        activeProject={activeProject}
        onProjectSelect={setActiveProject}
        onCreateProject={() => setProjectCreationModalOpen(true)}
        onExport={handleExport} 
        onPushLive={handlePushLive} 
        onImport={() => setImportModalOpen(true)}
      />
      
      <div className="flex h-[calc(100vh-80px)]">
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          scenarios={scenarios}
          activeScenario={activeScenarioId}
          onScenarioSelect={setActiveScenarioId}
          onCreateScenario={handleCreateScenario}
          onDuplicateScenario={handleDuplicateScenario}
          onDeleteScenario={handleDeleteScenario}
          onRenameScenario={handleRenameScenario}
          selectedComparisons={selectedComparisons}
          onScenarioSelectionChange={setSelectedComparisons}
        />
        
        <div className="flex-1 flex flex-col">
          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            {renderMainContent()}
          </main>
        </div>
      </div>

      {/* Rules Modal */}
      <RulesModal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
        units={activeScenario?.units || []}
        rules={activeScenario?.rules || []}
        globalSettings={activeScenario?.globalSettings || { minPricePerSqft: 1100, maxPricePerSqft: 1900, roundingRule: 1000 }}
        onRulesChange={handleRulesChange}
        onGlobalSettingsChange={handleGlobalSettingsChange}
        listPricing={activeScenario?.listPricing || []}
        onListPricingChange={handleListPricingChange}
        basePricingMode={activeScenario?.basePricingMode || 'plan'}
        onBasePricingModeChange={handleBasePricingModeChange}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImport}
        existingUnits={activeScenario?.units || []}
        globalMinPricePerSqft={activeScenario?.globalSettings?.minPricePerSqft || 1100}
      />

      {/* Project Creation Modal */}
      <ProjectCreationModal
        isOpen={projectCreationModalOpen}
        onClose={() => setProjectCreationModalOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AppContent />
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;
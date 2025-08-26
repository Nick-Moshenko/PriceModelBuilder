import { supabase } from '../lib/supabase';
import { Unit, Scenario, Rule, GlobalSettings, Premium, RevenueSummary, ListPricingItem } from '../types';

// Database service functions
export class DatabaseService {
  // Units
  static async getUnits(projectId: string): Promise<Unit[]> {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('project_id', projectId)
        .order('floor', { ascending: true })
        .order('unit_number', { ascending: true });

      if (error) {
        console.error('Error fetching units:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('No units found, returning empty array');
        return [];
      }

      return data.map(unit => ({
        id: `${unit.floor.toLowerCase()}-${unit.unit_number}`,
        dbId: unit.id,
        floor: unit.floor,
        unit: unit.unit_number,
        planType: unit.plan_type,
        sqft: unit.sqft,
        basePricePerSqft: unit.base_price_per_sqft,
        orientation: unit.orientation,
        outdoorSqft: unit.outdoor_sqft,
        bedrooms: unit.bedrooms,
        bathrooms: unit.bathrooms,
        basePrice: unit.base_price,
        finalPrice: unit.base_price,
        finalPricePerSqft: unit.base_price_per_sqft,
        premiums: []
      }));
    } catch (err) {
      console.error('Failed to fetch units:', err);
      return [];
    }
  }

  // Scenarios
  static async getScenarios(projectId: string): Promise<Scenario[]> {
    try {
      const { data: scenariosData, error: scenariosError } = await supabase
        .from('scenarios')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (scenariosError) {
        console.error('Error fetching scenarios:', scenariosError);
        throw scenariosError;
      }

      if (!scenariosData || scenariosData.length === 0) {
        console.warn('No scenarios found, creating baseline scenario');
        await this.createBaselineScenario(projectId);
        return this.getScenarios(projectId); // Recursive call to get the newly created baseline
      }

      const scenarios: Scenario[] = [];

      for (const scenario of scenariosData) {
        try {
          // Get rules for this scenario
          const { data: rulesData, error: rulesError } = await supabase
            .from('rules')
            .select('*')
            .eq('scenario_id', scenario.id)
            .order('order_index', { ascending: true });

          if (rulesError) {
            console.error('Error fetching rules for scenario:', scenario.id, rulesError);
            continue; // Skip this scenario but continue with others
          }

          // Get unit prices for this scenario
          const { data: unitPricesData, error: unitPricesError } = await supabase
            .from('unit_prices')
            .select(`
              *,
              units (
                id,
                floor,
                unit_number,
                plan_type,
                sqft,
                base_price_per_sqft,
                orientation,
                outdoor_sqft,
                bedrooms,
                bathrooms,
                base_price
              )
            `)
            .eq('scenario_id', scenario.id);

          if (unitPricesError) {
            console.error('Error fetching unit prices for scenario:', scenario.id, unitPricesError);
            continue; // Skip this scenario but continue with others
          }

          // Transform rules
          const rules: Rule[] = (rulesData || []).map(rule => ({
            id: rule.id,
            name: rule.name,
            enabled: rule.enabled,
            order: rule.order_index,
            criteria: rule.criteria || {},
            adjustment: rule.adjustment
          }));

          // Transform units with pricing
          const units: Unit[] = (unitPricesData || []).map((unitPrice: any) => ({
            id: `${unitPrice.units.floor.toLowerCase()}-${unitPrice.units.unit_number}`,
            dbId: unitPrice.units.id,
            floor: unitPrice.units.floor,
            unit: unitPrice.units.unit_number,
            planType: unitPrice.units.plan_type,
            sqft: unitPrice.units.sqft,
            basePricePerSqft: unitPrice.units.base_price_per_sqft,
            orientation: unitPrice.units.orientation,
            outdoorSqft: unitPrice.units.outdoor_sqft,
            bedrooms: unitPrice.units.bedrooms,
            bathrooms: unitPrice.units.bathrooms,
            basePrice: unitPrice.units.base_price,
            finalPrice: unitPrice.final_price,
            finalPricePerSqft: unitPrice.final_price_per_sqft,
            premiums: unitPrice.premiums || []
          }));

          // Calculate revenue summary
          const revenueSummary = this.calculateRevenueSummary(units, scenario.is_baseline, scenarios);

          scenarios.push({
            id: scenario.id,
            name: scenario.name,
            version: scenario.version,
            createdBy: scenario.created_by,
            createdAt: scenario.created_at,
            rules,
            globalSettings: scenario.global_settings || {
              minPricePerSqft: 1100,
              maxPricePerSqft: 1900,
              roundingRule: 1000
            },
            units,
            revenueSummary,
            isBaseline: scenario.is_baseline,
            listPricing: scenario.list_pricing || [],
            basePricingMode: scenario.base_pricing_mode || 'plan'
          });
        } catch (scenarioError) {
          console.error('Error processing scenario:', scenario.id, scenarioError);
          continue; // Skip this scenario but continue with others
        }
      }

      return scenarios;
    } catch (err) {
      console.error('Failed to fetch scenarios:', err);
      return [];
    }
  }

  // Create baseline scenario if none exists
  static async createBaselineScenario(projectId: string): Promise<void> {
    try {
      console.log('Creating baseline scenario...');

      // Create baseline scenario
      const { data: scenarioData, error: scenarioError } = await supabase
        .from('scenarios')
        .insert({
          project_id: projectId,
          name: 'Baseline Scenario',
          version: '1.0',
          created_by: 'System',
          is_baseline: true,
          global_settings: {
            minPricePerSqft: 1100,
            maxPricePerSqft: 1900,
            roundingRule: 1000
          }
        })
        .select()
        .single();

      if (scenarioError) {
        console.error('Error creating baseline scenario:', scenarioError);
        throw scenarioError;
      }

      // Get all units to create baseline unit prices
      const { data: unitsData, error: unitsError } = await supabase
        .from('units')
        .select('*')
        .eq('project_id', projectId);

      if (unitsError) {
        console.error('Error fetching units for baseline:', unitsError);
        throw unitsError;
      }

      if (!unitsData || unitsData.length === 0) {
        console.warn('No units found to create baseline prices');
        return;
      }

      // Create unit prices for baseline scenario
      const unitPricesInserts = unitsData.map(unit => ({
        scenario_id: scenarioData.id,
        unit_id: unit.id,
        final_price: unit.base_price,
        final_price_per_sqft: unit.base_price_per_sqft,
        premiums: []
      }));

      const { error: unitPricesError } = await supabase
        .from('unit_prices')
        .insert(unitPricesInserts);

      if (unitPricesError) {
        console.error('Error creating baseline unit prices:', unitPricesError);
        throw unitPricesError;
      }

      console.log('Baseline scenario created successfully');
    } catch (err) {
      console.error('Failed to create baseline scenario:', err);
      throw err;
    }
  }

  static async createScenario(projectId: string, name: string, createdBy: string = 'Current User'): Promise<string> {
    // Get baseline scenario unit prices to use as starting point
    const { data: baselineScenario, error: baselineError } = await supabase
      .from('scenarios')
      .select('id')
      .eq('project_id', projectId)
      .eq('is_baseline', true)
      .single();

    if (baselineError) {
      console.error('Error fetching baseline scenario:', baselineError);
      throw baselineError;
    }

    // Get baseline unit prices
    const { data: baselineUnitPrices, error: baselineUnitPricesError } = await supabase
      .from('unit_prices')
      .select('unit_id, final_price, final_price_per_sqft, premiums')
      .eq('scenario_id', baselineScenario.id);

    if (baselineUnitPricesError) {
      console.error('Error fetching baseline unit prices:', baselineUnitPricesError);
      throw baselineUnitPricesError;
    }

    // Create scenario
    const { data: scenarioData, error: scenarioError } = await supabase
      .from('scenarios')
      .insert({
        project_id: projectId,
        name,
        created_by: createdBy,
        is_baseline: false
      })
      .select()
      .single();

    if (scenarioError) {
      console.error('Error creating scenario:', scenarioError);
      throw scenarioError;
    }

    // Create unit prices for the new scenario (starting with baseline prices)
    const unitPricesInserts = baselineUnitPrices.map(unitPrice => ({
      scenario_id: scenarioData.id,
      unit_id: unitPrice.unit_id,
      final_price: unitPrice.final_price,
      final_price_per_sqft: unitPrice.final_price_per_sqft,
      premiums: unitPrice.premiums || []
    }));

    const { error: unitPricesError } = await supabase
      .from('unit_prices')
      .insert(unitPricesInserts);

    if (unitPricesError) {
      console.error('Error creating unit prices:', unitPricesError);
      throw unitPricesError;
    }

    return scenarioData.id;
  }

  static async duplicateScenario(scenarioId: string): Promise<string> {
    // Get original scenario
    const { data: originalScenario, error: scenarioError } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', scenarioId)
      .single();

    if (scenarioError) {
      console.error('Error fetching original scenario:', scenarioError);
      throw scenarioError;
    }

    // Create new scenario
    const { data: newScenario, error: newScenarioError } = await supabase
      .from('scenarios')
      .insert({
        project_id: originalScenario.project_id,
        name: `${originalScenario.name} (Copy)`,
        version: '1.0',
        created_by: originalScenario.created_by,
        is_baseline: false,
        global_settings: originalScenario.global_settings
      })
      .select()
      .single();

    if (newScenarioError) {
      console.error('Error creating duplicate scenario:', newScenarioError);
      throw newScenarioError;
    }

    // Copy rules
    const { data: originalRules, error: rulesError } = await supabase
      .from('rules')
      .select('*')
      .eq('scenario_id', scenarioId);

    if (rulesError) {
      console.error('Error fetching original rules:', rulesError);
      throw rulesError;
    }

    if (originalRules.length > 0) {
      const rulesInserts = originalRules.map(rule => ({
        scenario_id: newScenario.id,
        name: rule.name,
        enabled: rule.enabled,
        order_index: rule.order_index,
        criteria: rule.criteria,
        adjustment: rule.adjustment
      }));

      const { error: newRulesError } = await supabase
        .from('rules')
        .insert(rulesInserts);

      if (newRulesError) {
        console.error('Error creating duplicate rules:', newRulesError);
        throw newRulesError;
      }
    }

    // Copy unit prices
    const { data: originalUnitPrices, error: unitPricesError } = await supabase
      .from('unit_prices')
      .select('*')
      .eq('scenario_id', scenarioId);

    if (unitPricesError) {
      console.error('Error fetching original unit prices:', unitPricesError);
      throw unitPricesError;
    }

    const unitPricesInserts = originalUnitPrices.map(unitPrice => ({
      scenario_id: newScenario.id,
      unit_id: unitPrice.unit_id,
      final_price: unitPrice.final_price,
      final_price_per_sqft: unitPrice.final_price_per_sqft,
      premiums: unitPrice.premiums
    }));

    const { error: newUnitPricesError } = await supabase
      .from('unit_prices')
      .insert(unitPricesInserts);

    if (newUnitPricesError) {
      console.error('Error creating duplicate unit prices:', newUnitPricesError);
      throw newUnitPricesError;
    }

    return newScenario.id;
  }

  static async deleteScenario(scenarioId: string): Promise<void> {
    const { error } = await supabase
      .from('scenarios')
      .delete()
      .eq('id', scenarioId);

    if (error) {
      console.error('Error deleting scenario:', error);
      throw error;
    }
  }

  static async updateScenario(scenarioId: string, updates: Partial<Scenario>): Promise<void> {
    // Update scenario metadata
    if (updates.name || updates.globalSettings || updates.listPricing !== undefined || updates.basePricingMode !== undefined) {
      const { error: scenarioError } = await supabase
        .from('scenarios')
        .update({
          ...(updates.name && { name: updates.name }),
          ...(updates.globalSettings && { global_settings: updates.globalSettings }),
          ...(updates.listPricing !== undefined && { list_pricing: updates.listPricing }),
          ...(updates.basePricingMode !== undefined && { base_pricing_mode: updates.basePricingMode }),
          updated_at: new Date().toISOString()
        })
        .eq('id', scenarioId);

      if (scenarioError) {
        console.error('Error updating scenario:', scenarioError);
        throw scenarioError;
      }
    }

    // Update rules ONLY if rules are explicitly provided in the updates
    if (updates.rules !== undefined) {
      // Delete existing rules
      const { error: deleteRulesError } = await supabase
        .from('rules')
        .delete()
        .eq('scenario_id', scenarioId);

      if (deleteRulesError) {
        console.error('Error deleting existing rules:', deleteRulesError);
        throw deleteRulesError;
      }

      // Insert new rules
      if (updates.rules.length > 0) {
        const rulesInserts = updates.rules.map(rule => ({
          scenario_id: scenarioId,
          name: rule.name,
          enabled: rule.enabled,
          order_index: rule.order,
          criteria: rule.criteria,
          adjustment: rule.adjustment
        }));

        const { error: insertRulesError } = await supabase
          .from('rules')
          .insert(rulesInserts);

        if (insertRulesError) {
          console.error('Error inserting new rules:', insertRulesError);
          throw insertRulesError;
        }
      }
    }

    // Update unit prices if provided
    if (updates.units) {
      const unitPricesUpdates = updates.units.map(unit => ({
        scenario_id: scenarioId,
        unit_id: unit.dbId,
        final_price: unit.finalPrice,
        final_price_per_sqft: unit.finalPricePerSqft,
        premiums: unit.premiums,
        ...(updates.basePricingMode !== undefined && { base_pricing_mode: updates.basePricingMode }),
        updated_at: new Date().toISOString()
      }));

      for (const unitPriceUpdate of unitPricesUpdates) {
        const { error } = await supabase
          .from('unit_prices')
          .upsert(unitPriceUpdate, {
            onConflict: 'scenario_id,unit_id'
          });

        if (error) {
          console.error('Error updating unit price:', error);
          throw error;
        }
      }
    }
  }

  // Import units to baseline scenario
  static async importUnitsToBaseline(projectId: string, units: Unit[], mode: 'override' | 'append'): Promise<void> {
    try {
      // Get all scenarios before making changes
      const { data: allScenarios, error: scenariosError } = await supabase
        .from('scenarios')
        .select('id, is_baseline')
        .eq('project_id', projectId);

      if (scenariosError) {
        console.error('Error fetching scenarios for update:', scenariosError);
        throw scenariosError;
      }

      if (mode === 'override') {
        // Delete existing units
        const { error: deleteError } = await supabase
          .from('units')
          .delete()
          .eq('project_id', projectId);

        if (deleteError) {
          console.error('Error deleting existing units:', deleteError);
          throw deleteError;
        }

        // Delete all existing unit prices for all scenarios
        for (const scenario of allScenarios || []) {
          await supabase
            .from('unit_prices')
            .delete()
            .eq('scenario_id', scenario.id);
        }
      }

      // Insert new units
      const unitsInserts = units.map(unit => ({
        id: this.getUnitDbId(unit.id),
        project_id: projectId,
        floor: unit.floor,
        unit_number: unit.unit,
        plan_type: unit.planType,
        sqft: unit.sqft,
        base_price_per_sqft: unit.basePricePerSqft,
        orientation: unit.orientation,
        outdoor_sqft: unit.outdoorSqft,
        bedrooms: unit.bedrooms,
        bathrooms: unit.bathrooms,
        base_price: unit.basePrice
      }));

      const { data: insertedUnits, error: insertError } = await supabase
        .from('units')
        .insert(unitsInserts)
        .select('id, floor, unit_number');

      if (insertError) {
        console.error('Error inserting units:', insertError);
        throw insertError;
      }

      // Create a mapping of user-friendly ID to database UUID
      const unitIdMap = new Map<string, string>();
      insertedUnits?.forEach(unit => {
        const userFriendlyId = `${unit.floor.toLowerCase()}-${unit.unit_number}`;
        unitIdMap.set(userFriendlyId, unit.id);
      });

      // Update units array with database IDs
      const unitsWithDbIds = units.map(unit => ({
        ...unit,
        dbId: unitIdMap.get(unit.id) || ''
      }));

      // Update baseline scenario with new unit data
      for (const scenario of allScenarios || []) {
        if (scenario.is_baseline) {
          // For baseline scenario, use base prices
          const unitPricesInserts = unitsWithDbIds.map(unit => ({
            scenario_id: scenario.id,
            unit_id: unit.dbId,
            final_price: unit.basePrice,
            final_price_per_sqft: unit.basePricePerSqft,
            premiums: []
          }));

          const { error: unitPricesError } = await supabase
            .from('unit_prices')
            .insert(unitPricesInserts);

          if (unitPricesError) {
            console.error('Error inserting baseline unit prices:', unitPricesError);
            throw unitPricesError;
          }
        }
      }

      // Recalculate all non-baseline scenarios
      await this.recalculateAllNonBaselineScenarios(projectId, unitsWithDbIds);

      console.log(`Successfully imported ${units.length} units in ${mode} mode`);
    } catch (err) {
      console.error('Failed to import units:', err);
      throw err;
    }
  }

  // Helper method to recalculate all non-baseline scenarios
  private static async recalculateAllNonBaselineScenarios(projectId: string, units: Unit[]): Promise<void> {
    try {
      // Get all non-baseline scenarios with their rules and settings
      const { data: scenarios, error: scenariosError } = await supabase
        .from('scenarios')
        .select(`
          id,
          global_settings,
          list_pricing,
          rules (
            id,
            name,
            enabled,
            order_index,
            criteria,
            adjustment
          )
        `)
        .eq('project_id', projectId)
        .eq('is_baseline', false);

      if (scenariosError) {
        console.error('Error fetching scenarios for recalculation:', scenariosError);
        throw scenariosError;
      }

      // Recalculate each scenario
      for (const scenario of scenarios || []) {
        if (scenario.list_pricing && scenario.list_pricing.some((item: ListPricingItem) => item.adjustment !== 0)) {
          await this.recalculateScenarioWithListPricing(
            scenario.id,
            units,
            scenario.list_pricing,
            scenario.global_settings,
            scenario.rules || []
          );
        } else {
          await this.recalculateScenarioWithNewUnits(
            scenario.id,
            units,
            scenario.rules || [],
            scenario.global_settings
          );
        }
      }
    } catch (err) {
      console.error('Failed to recalculate non-baseline scenarios:', err);
      throw err;
    }
  }
  // Helper method to recalculate a scenario with new units
  private static async recalculateScenarioWithNewUnits(
    scenarioId: string, 
    units: Unit[], 
    rules: any[], 
    globalSettings: any
  ): Promise<void> {
    try {
      // Transform rules to proper format
      const transformedRules: Rule[] = rules.map(rule => ({
        id: rule.id,
        name: rule.name,
        enabled: rule.enabled,
        order: rule.order_index,
        criteria: rule.criteria || {},
        adjustment: rule.adjustment
      }));

      // Apply rules to units
      const processedUnits = this.applyRulesToUnits(units, transformedRules, globalSettings);

      // Insert new unit prices for this scenario
      const unitPricesInserts = processedUnits.map(unit => ({
        scenario_id: scenarioId,
        unit_id: unit.dbId,
        final_price: unit.finalPrice,
        final_price_per_sqft: unit.finalPricePerSqft,
        premiums: unit.premiums
      }));

      const { error: unitPricesError } = await supabase
        .from('unit_prices')
        .insert(unitPricesInserts);

      if (unitPricesError) {
        console.error('Error inserting recalculated unit prices:', unitPricesError);
        throw unitPricesError;
      }

      console.log(`Recalculated scenario ${scenarioId} with ${units.length} units`);
    } catch (err) {
      console.error('Failed to recalculate scenario:', scenarioId, err);
      throw err;
    }
  }

  // Helper method to recalculate a scenario with list pricing
  private static async recalculateScenarioWithListPricing(
    scenarioId: string, 
    units: Unit[], 
    listPricing: ListPricingItem[], 
    globalSettings: any,
    rules: any[] = [],
    basePricingMode: 'plan' | 'floor' = 'plan'
  ): Promise<void> {
    try {
      const transformedRules: Rule[] = rules.map(rule => ({
        id: rule.id,
        name: rule.name,
        enabled: rule.enabled,
        order: rule.order_index,
        criteria: rule.criteria || {},
        adjustment: rule.adjustment
      }));

      // Start with truly base units (reset to original base prices)
      let processedUnits = units.map(unit => ({
        ...unit,
        finalPrice: unit.basePrice,
        finalPricePerSqft: unit.basePricePerSqft,
        premiums: []
      }));
      
      // Apply list pricing first (includes base pricing)
      processedUnits = this.applyListPricingToUnits(processedUnits, listPricing, globalSettings, basePricingMode);
      
      // Then apply rules on top of list pricing
      processedUnits = this.applyRulesToUnits(processedUnits, transformedRules, globalSettings);

      // Insert new unit prices for this scenario
      const unitPricesInserts = processedUnits.map(unit => ({
        scenario_id: scenarioId,
        unit_id: unit.dbId,
        final_price: unit.finalPrice,
        final_price_per_sqft: unit.finalPricePerSqft,
        premiums: unit.premiums
      }));

      const { error: unitPricesError } = await supabase
        .from('unit_prices')
        .insert(unitPricesInserts);

      if (unitPricesError) {
        console.error('Error inserting recalculated unit prices with list pricing:', unitPricesError);
        throw unitPricesError;
      }

      console.log(`Recalculated scenario ${scenarioId} with list pricing for ${units.length} units`);
    } catch (err) {
      console.error('Failed to recalculate scenario with list pricing:', scenarioId, err);
      throw err;
    }
  }

  // Static method to apply rules to units (moved from App.tsx logic)
  private static applyRulesToUnits(units: Unit[], rules: Rule[], globalSettings: any): Unit[] {
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
            const floorLevel = this.getFloorLevel(unit.floor, startFloor, endFloor, units);
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
              floorMultiplier = this.getFloorLevel(unit.floor, startFloor, endFloor, units);
            }
            
            switch (rule.adjustment.type) {
              case 'fixed':
                adjustment = rule.adjustment.value * floorMultiplier;
                break;
              case 'percentage':
                adjustment = finalPrice * (rule.adjustment.value / 100) * floorMultiplier;
                break;
              case 'per_sqft':
                adjustment = rule.adjustment.value * unit.sqft * floorMultiplier;
                break;
            }

            if (adjustment !== 0) {
              let premiumName = rule.name;
              if (rule.criteria.floorRange && floorMultiplier > 1) {
                premiumName = `${rule.name} (Floor ${unit.floor} - ${floorMultiplier}x)`;
              }
              
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
          basePricingMode: (scenario as any).base_pricing_mode || 'plan'
        });

      // Apply global constraints
      const pricePerSqft = finalPrice / unit.sqft;
      if (globalSettings.minPricePerSqft && pricePerSqft < globalSettings.minPricePerSqft) {
        finalPrice = globalSettings.minPricePerSqft * unit.sqft;
      }
      if (globalSettings.maxPricePerSqft && pricePerSqft > globalSettings.maxPricePerSqft) {
        finalPrice = globalSettings.maxPricePerSqft * unit.sqft;
      }

      // Apply rounding
      if (globalSettings.roundingRule) {
        finalPrice = Math.round(finalPrice / globalSettings.roundingRule) * globalSettings.roundingRule;
      }

      return {
        ...unit,
        finalPrice,
        finalPricePerSqft: finalPrice / unit.sqft,
        premiums
      };
    });
  }

  // Apply list pricing to units
  private static applyListPricingToUnits(units: Unit[], listPricing: ListPricingItem[], globalSettings: any): Unit[] {
    return units.map(unit => {
      let basePrice = unit.basePrice;
      let basePricePerSqft = unit.basePricePerSqft;
      let finalPrice = unit.basePrice;
      const premiums: Premium[] = []; // Start fresh - no existing premiums

      // First, apply base pricing - only apply values that are greater than 0
      listPricing.forEach(item => {
        if (item.adjustment <= 0) return; // Only apply if there's a positive value

        let matches = false;

        switch (item.category) {
          case 'basePricingPlan':
            matches = unit.planType === item.value;
            if (matches) {
              basePricePerSqft = item.adjustment;
              basePrice = basePricePerSqft * unit.sqft;
              finalPrice = basePrice;
              console.log(`Applied base pricing for plan ${item.value}: ${basePricePerSqft}/sqft, total: ${basePrice}`);
            }
            break;
          case 'basePricingFloor':
            matches = unit.floor === item.value;
            if (matches) {
              basePricePerSqft = item.adjustment;
              basePrice = basePricePerSqft * unit.sqft;
              finalPrice = basePrice;
              console.log(`Applied base pricing for floor ${item.value}: ${basePricePerSqft}/sqft, total: ${basePrice}`);
            }
            break;
        }
      });

      // Then apply other list pricing adjustments
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
          case 'sqft':
            const [sqftMin, sqftMax] = item.value.split('-').map(Number);
            matches = unit.sqft >= sqftMin && unit.sqft <= sqftMax;
            categoryLabel = `${sqftMin.toLocaleString()} - ${sqftMax.toLocaleString()} sqft`;
            break;
          case 'outdoor':
            const [outdoorMin, outdoorMax] = item.value.split('-').map(Number);
            matches = unit.outdoorSqft >= outdoorMin && unit.outdoorSqft <= outdoorMax;
            categoryLabel = outdoorMin === 0 && outdoorMax === 0 ? 'No outdoor space' : 
                          `${outdoorMin.toLocaleString()} - ${outdoorMax.toLocaleString()} sqft outdoor`;
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
        (item.category === 'basePricingPlan' && unit.planType === item.value && item.adjustment > 0) ||
        (item.category === 'basePricingFloor' && unit.floor === item.value && item.adjustment > 0)
      );
      
      // Only apply minimum price constraint if no base pricing was set
      if (!hasBasePricing && globalSettings.minPricePerSqft && pricePerSqft < globalSettings.minPricePerSqft) {
        finalPrice = globalSettings.minPricePerSqft * unit.sqft;
      }
      // Always apply maximum price constraint
      if (globalSettings.maxPricePerSqft && pricePerSqft > globalSettings.maxPricePerSqft) {
        finalPrice = globalSettings.maxPricePerSqft * unit.sqft;
      }

      // Apply rounding
      if (globalSettings.roundingRule) {
        finalPrice = Math.round(finalPrice / globalSettings.roundingRule) * globalSettings.roundingRule;
      }

      return {
        ...unit,
        basePrice,
        basePricePerSqft,
        finalPrice,
        finalPricePerSqft: finalPrice / unit.sqft,
        premiums
      };
    });
  }

  // Helper function to calculate floor level for per_floor adjustments
  private static getFloorLevel(unitFloor: string, startFloor: string, endFloor: string, units: Unit[]): number {
    // Create ordered list of floors from units
    const allFloors = [...new Set(units.map(u => u.floor))];
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

    const startIndex = orderedFloors.indexOf(startFloor);
    const endIndex = orderedFloors.indexOf(endFloor);
    const unitIndex = orderedFloors.indexOf(unitFloor);

    // Check if unit floor is within the specified range
    if (startIndex === -1 || endIndex === -1 || unitIndex === -1) return 0;
    if (unitIndex < startIndex || unitIndex > endIndex) return 0;

    // Calculate floor level (1-based, relative to start floor)
    return unitIndex - startIndex + 1;
  }

  private static calculateRevenueSummary(units: Unit[], isBaseline: boolean, existingScenarios: Scenario[]): RevenueSummary {
    const totalRevenue = units.reduce((sum, unit) => sum + unit.finalPrice, 0);
    
    let baselineRevenue = 0;
    let deltaFromBaseline = 0;
    let deltaPercentage = 0;
    
    if (isBaseline) {
      // For baseline scenario, delta should be 0
      baselineRevenue = totalRevenue;
      deltaFromBaseline = 0;
      deltaPercentage = 0;
    } else {
      // Find baseline scenario from existing scenarios
      const baselineScenario = existingScenarios.find(s => s.isBaseline);
      if (baselineScenario) {
        baselineRevenue = baselineScenario.units.reduce((sum, unit) => sum + unit.finalPrice, 0);
        deltaFromBaseline = totalRevenue - baselineRevenue;
        deltaPercentage = baselineRevenue > 0 ? ((deltaFromBaseline / baselineRevenue) * 100) : 0;
      } else {
        // No baseline found, set to 0
        baselineRevenue = totalRevenue;
        deltaFromBaseline = 0;
        deltaPercentage = 0;
      }
    }

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
  }
  // Helper method to generate database UUID for units
  private static getUnitDbId(userFriendlyId: string): string {
    // Generate a proper random UUID
    return crypto.randomUUID();
  }
}
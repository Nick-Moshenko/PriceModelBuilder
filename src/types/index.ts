export interface Unit {
  id: string;
  dbId: string;
  floor: string;
  unit: string;
  planType: string;
  sqft: number;
  basePricePerSqft: number;
  orientation: string;
  outdoorSqft: number;
  bedrooms: number;
  bathrooms: number;
  basePrice: number;
  finalPrice: number;
  finalPricePerSqft: number;
  premiums: Premium[];
}

export interface Premium {
  id: string;
  name: string;
  type: 'fixed' | 'percentage' | 'per_sqft';
  value: number;
  amount: number;
}

export interface Rule {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
  criteria: {
    planTypes?: string[];
    sizeBands?: { min: number; max: number }[];
    orientations?: string[];
    outdoorBands?: { min: number; max: number }[];
    floors?: string[];
    floorRange?: { startFloor: string; endFloor: string };
    bedroomCounts?: number[];
    bathroomCounts?: number[];
  };
  adjustment: {
    type: 'fixed' | 'percentage' | 'per_sqft';
    value: number;
  };
}

export interface GlobalSettings {
  minPricePerSqft: number;
  maxPricePerSqft: number;
  roundingRule: number;
}

export interface Scenario {
  id: string;
  name: string;
  version: string;
  createdBy: string;
  createdAt: string;
  rules: Rule[];
  globalSettings: GlobalSettings;
  units: Unit[];
  revenueSummary: RevenueSummary;
  isBaseline?: boolean;
  listPricing?: ListPricingItem[];
  basePricingMode?: 'plan' | 'floor';
}

export interface RevenueSummary {
  totalRevenue: number;
  deltaFromBaseline: number;
  deltaPercentage: number;
  perFloorRevenue: Record<string, number>;
  perPlanTypeRevenue: Record<string, number>;
  unitCountByPriceRange: Record<string, number>;
}

export interface ListPricingItem {
  category: string;
  value: string;
  adjustment: number;
}

export type EditorMode = 'rules' | 'spreadsheet';
import React from 'react';
import { Scenario } from '../../types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface RevenueChartProps {
  scenarios: Scenario[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ scenarios }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const maxRevenue = Math.max(...scenarios.map(s => s.revenueSummary.totalRevenue));
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Revenue Comparison</h3>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-6">
          {scenarios.map((scenario, index) => {
            const percentage = (scenario.revenueSummary.totalRevenue / maxRevenue) * 100;
            const color = colors[index % colors.length];
            
            return (
              <div key={scenario.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-medium text-gray-900">{scenario.name}</span>
                    {scenario.isBaseline && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                        Baseline
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    {scenario.revenueSummary.deltaFromBaseline !== 0 && (
                      <div className={`flex items-center space-x-1 ${
                        scenario.revenueSummary.deltaFromBaseline > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {scenario.revenueSummary.deltaFromBaseline > 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span className="text-sm font-medium">
                          {scenario.revenueSummary.deltaPercentage > 0 ? '+' : ''}
                          {scenario.revenueSummary.deltaPercentage.toFixed(1)}%
                        </span>
                      </div>
                    )}
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(scenario.revenueSummary.totalRevenue)}
                    </span>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Floor Breakdown */}
        <div className="mt-8">
          <h4 className="font-medium text-gray-900 mb-4">Revenue by Floor</h4>
          <div className={`grid gap-4 ${
            scenarios.length > 0 && scenarios[0].units ? 
            `grid-cols-${Math.min([...new Set(scenarios.flatMap(s => s.units.map(u => u.floor)))].length, 4)}` : 
            'grid-cols-4'
          }`}>
            {scenarios.length > 0 && [...new Set(scenarios.flatMap(s => s.units.map(u => u.floor)))].sort((a, b) => {
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
            }).map(floor => (
              <div key={floor} className="space-y-2">
                <div className="font-medium text-sm text-gray-700">
                  {floor === 'Garden' ? 'Garden Level' : 
                   floor === 'Penthouse' ? 'Penthouse' : 
                   !isNaN(parseInt(floor)) ? `Floor ${floor}` : floor}
                </div>
                {scenarios.map((scenario, index) => {
                  const floorRevenue = scenario.revenueSummary.perFloorRevenue[floor] || 0;
                  const maxFloorRevenue = Math.max(
                    ...scenarios.map(s => s.revenueSummary.perFloorRevenue[floor] || 0)
                  );
                  const percentage = maxFloorRevenue > 0 ? (floorRevenue / maxFloorRevenue) * 100 : 0;
                  const color = colors[index % colors.length];

                  return (
                    <div key={scenario.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-xs text-gray-600 truncate">
                            {scenario.name}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-gray-900">
                          {formatCurrency(floorRevenue)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div
                          className="h-1 rounded-full transition-all duration-300"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
import React from 'react';
import { Scenario } from '../../types';

interface ComparisonTableProps {
  scenarios: Scenario[];
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ scenarios }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Dynamically get floors and plan types from all scenarios
  const getAllFloors = () => {
    const floors = new Set<string>();
    scenarios.forEach(scenario => {
      scenario.units.forEach(unit => floors.add(unit.floor));
    });
    return Array.from(floors).sort((a, b) => {
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
  };

  const getAllPlanTypes = () => {
    const planTypes = new Set<string>();
    scenarios.forEach(scenario => {
      scenario.units.forEach(unit => planTypes.add(unit.planType));
    });
    return Array.from(planTypes).sort();
  };

  const floors = getAllFloors();
  const planTypes = getAllPlanTypes();

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Detailed Comparison</h3>
      </div>

      <div className="p-6 space-y-8">
        {/* Revenue Summary */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Revenue Summary</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-500">Metric</th>
                  {scenarios.map(scenario => (
                    <th key={scenario.id} className="text-left py-2 px-4 text-sm font-medium text-gray-500">
                      {scenario.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">Total Revenue</td>
                  {scenarios.map(scenario => (
                    <td key={scenario.id} className="py-3 px-4 text-sm text-gray-700 font-medium">
                      {formatCurrency(scenario.revenueSummary.totalRevenue)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">Delta from Baseline</td>
                  {scenarios.map(scenario => (
                    <td key={scenario.id} className={`py-3 px-4 text-sm font-medium ${
                      Math.abs(scenario.revenueSummary.deltaFromBaseline) < 1 ? 'text-gray-700' :
                      scenario.revenueSummary.deltaFromBaseline > 0 ? 'text-green-600' :
                      'text-gray-700'
                    }`}>
                      {Math.abs(scenario.revenueSummary.deltaFromBaseline) < 1 ? '—' : (
                        <>
                          {scenario.revenueSummary.deltaFromBaseline > 0 ? '+' : ''}
                          {formatCurrency(scenario.revenueSummary.deltaFromBaseline)}
                        </>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">% Change</td>
                  {scenarios.map(scenario => (
                    <td key={scenario.id} className={`py-3 px-4 text-sm font-medium ${
                      Math.abs(scenario.revenueSummary.deltaPercentage) < 0.1 ? 'text-gray-700' :
                      scenario.revenueSummary.deltaPercentage > 0 ? 'text-green-600' :
                      'text-gray-700'
                    }`}>
                      {Math.abs(scenario.revenueSummary.deltaPercentage) < 0.1 ? '—' : (
                        <>
                          {scenario.revenueSummary.deltaPercentage > 0 ? '+' : ''}
                          {scenario.revenueSummary.deltaPercentage.toFixed(1)}%
                        </>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Per-Floor Revenue */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Revenue by Floor</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-500">Floor</th>
                  {scenarios.map(scenario => (
                    <th key={scenario.id} className="text-left py-2 px-4 text-sm font-medium text-gray-500">
                      {scenario.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {floors.map(floor => (
                  <tr key={floor}>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{floor}</td>
                    {scenarios.map(scenario => (
                      <td key={scenario.id} className="py-3 px-4 text-sm text-gray-700">
                        {formatCurrency(scenario.revenueSummary.perFloorRevenue[floor] || 0)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Per-Plan Type Revenue */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Revenue by Plan Type</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-500">Plan Type</th>
                  {scenarios.map(scenario => (
                    <th key={scenario.id} className="text-left py-2 px-4 text-sm font-medium text-gray-500">
                      {scenario.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {planTypes.map(planType => (
                  <tr key={planType}>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{planType}</td>
                    {scenarios.map(scenario => (
                      <td key={scenario.id} className="py-3 px-4 text-sm text-gray-700">
                        {formatCurrency(scenario.revenueSummary.perPlanTypeRevenue[planType] || 0)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
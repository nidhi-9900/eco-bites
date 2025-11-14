'use client';

import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

// Helper function to safely normalize values
function normalizeValue(value, maxValue) {
  if (!value || isNaN(value) || value < 0) return 0;
  const normalized = (value / maxValue) * 100;
  return Math.min(Math.max(normalized, 0), 100);
}

export default function NutritionChart({ nutrition, type = 'radar' }) {
  if (!nutrition) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No nutrition data available
      </div>
    );
  }

  // Safely extract and normalize values
  const energy = Number(nutrition.energy) || 0;
  const fat = Number(nutrition.fat) || 0;
  const sugars = Number(nutrition.sugars) || 0;
  const salt = Number(nutrition.salt) || 0;
  const protein = Number(nutrition.protein) || 0;

  // Prepare data for radar chart with proper normalization
  // Using typical maximum values for 100g of food
  const radarData = [
    { name: 'Energy', value: normalizeValue(energy, 900) }, // Max ~900 kcal per 100g
    { name: 'Fat', value: normalizeValue(fat, 100) }, // Max ~100g per 100g
    { name: 'Sugars', value: normalizeValue(sugars, 100) }, // Max ~100g per 100g
    { name: 'Salt', value: normalizeValue(salt, 10) }, // Max ~10g per 100g
    { name: 'Protein', value: normalizeValue(protein, 100) }, // Max ~100g per 100g
  ].filter(item => !isNaN(item.value) && isFinite(item.value));

  // Prepare data for bar chart
  const barData = [
    { name: 'Energy', value: energy },
    { name: 'Fat', value: fat },
    { name: 'Sugars', value: sugars },
    { name: 'Salt', value: salt },
    { name: 'Protein', value: protein },
  ];

  if (radarData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No valid nutrition data available
      </div>
    );
  }

  if (type === 'radar') {
    return (
      <div className="w-full" style={{ minHeight: '300px' }}>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis 
              dataKey="name" 
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]} 
              tick={{ fill: '#9ca3af', fontSize: 10 }}
            />
            <Radar
              name="Nutrition"
              dataKey="value"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.6}
              strokeWidth={2}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px'
              }}
              formatter={(value) => [`${value.toFixed(1)}%`, 'Nutrition']}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ minHeight: '300px' }}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={barData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}


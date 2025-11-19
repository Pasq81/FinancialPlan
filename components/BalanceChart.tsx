
import React from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ChartDataPoint } from '../types';

interface ChartProps {
  data: ChartDataPoint[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
};

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    // Payload order depends on chart definition. 
    return (
      <div className="bg-brand-secondary/90 backdrop-blur-sm p-4 border border-brand-accent rounded-lg shadow-lg z-50">
        <p className="text-brand-light mb-2 font-medium">{`Età: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} style={{ color: entry.color }} className="mb-1 text-sm">
            <span className="font-semibold">{entry.name}: </span>
            <span>{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const BalanceChart: React.FC<ChartProps> = ({ data }) => {
  return (
    <div className="bg-brand-secondary border border-brand-accent rounded-xl p-6 shadow-lg h-full flex flex-col">
      <h2 className="text-2xl font-bold text-brand-text mb-6">Patrimonio e Spese</h2>
      <div className="flex-grow w-full min-h-[350px]">
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart
            data={data}
            margin={{
              top: 5,
              right: 20,
              left: 20,
              bottom: 5,
            }}
          >
            <defs>
                <linearGradient id="colorSpesa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#26A69A" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#26A69A" stopOpacity={0}/>
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(119, 141, 169, 0.2)" />
            
            <XAxis 
              dataKey="eta" 
              name="Età" 
              stroke="#778DA9" 
              tick={{ fill: '#778DA9', fontSize: 12 }} 
              type="number"
              domain={['auto', 'auto']}
            />
            
            {/* Left Axis for Wealth */}
            <YAxis 
              yAxisId="left"
              stroke="#FFC107" 
              tick={{ fill: '#FFC107', fontSize: 12 }} 
              tickFormatter={(value) => `€${Number(value)/1000}k`}
              label={{ value: 'Patrimonio', angle: -90, position: 'insideLeft', fill: '#FFC107', dy: 50 }}
            />

            {/* Right Axis for Expenses */}
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="#E53E3E" 
              tick={{ fill: '#E53E3E', fontSize: 12 }} 
              tickFormatter={(value) => `€${Number(value)/1000}k`}
              label={{ value: 'Spese', angle: 90, position: 'insideRight', fill: '#E53E3E', dy: 50 }}
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} iconType="circle" />

            {/* Mortgage Area (Stacked or separate, here separate on right axis) */}
            <Area 
              yAxisId="right"
              type="step" 
              dataKey="spesaMutuo" 
              name="Spesa Mutuo" 
              stroke="#26A69A" 
              strokeWidth={1} 
              fillOpacity={0.4} 
              fill="#26A69A" 
            />
            
            {/* Total Expenses Line */}
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="spesaTotale" 
              name="Spesa Totale (con Inflazione)" 
              stroke="#F87171" // Reddish
              strokeWidth={2}
              dot={false}
            />

            {/* Wealth Line */}
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="patrimonio" 
              name="Patrimonio" 
              stroke="#FFC107" 
              strokeWidth={3}
              dot={{ r: 3, fill: '#FFC107', strokeWidth: 0 }}
              activeDot={{ r: 6 }}
              connectNulls={true}
            />

          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BalanceChart;

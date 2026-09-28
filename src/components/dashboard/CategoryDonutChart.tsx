'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { formatRupiah } from '@/lib/api';

const COLORS = ['#00a896', '#0284c7', '#f59e0b', '#ec4899', '#8b5cf6'];

interface Props {
  data?: { name: string; value: number }[];
}

export default function CategoryDonutChart({ data }: Props) {
  const chartData = data && data.length > 0
    ? data
    : [
        { name: 'Minuman Kopi', value: 2450000 },
        { name: 'Makanan Utama', value: 3100000 },
        { name: 'Snack & Pastry', value: 1250000 },
        { name: 'Non-Coffee', value: 890000 },
      ];

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="flex flex-col items-center justify-center w-full h-64">
      <div className="w-full h-44 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              formatter={(value: any) => [formatRupiah(value), '']}
              contentStyle={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
              }}
            />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Centered Total Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] text-slate-400 font-medium">Total</span>
          <span className="text-xs font-bold text-slate-800">
            {formatRupiah(total).slice(0, -3)}k
          </span>
        </div>
      </div>

      {/* Legends */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-2 px-2 text-xs text-slate-600">
        {chartData.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span>{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

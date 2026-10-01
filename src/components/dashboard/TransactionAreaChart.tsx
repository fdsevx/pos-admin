'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChartDataPoint } from '@/types';
import { formatRupiah } from '@/lib/api';

interface Props {
  data: ChartDataPoint[];
}

export default function TransactionAreaChart({ data }: Props) {
  // Format fallback demo data if backend has no transactions yet
  const chartData = data && data.length > 0
    ? data.map((d: any) => {
        const dateStr = d.date || d.label || '';
        return {
          name: dateStr ? dateStr.slice(-5) : '',
          penjualan: parseFloat(d.revenue) || 0,
          hpp: parseFloat(d.cogs) || 0,
        };
      })
    : [
        { name: '01/09', penjualan: 250000, hpp: 140000 },
        { name: '05/09', penjualan: 420000, hpp: 220000 },
        { name: '10/09', penjualan: 890000, hpp: 480000 },
        { name: '15/09', penjualan: 650000, hpp: 350000 },
        { name: '20/09', penjualan: 1200000, hpp: 620000 },
        { name: '25/09', penjualan: 980000, hpp: 510000 },
        { name: '28/09', penjualan: 1450000, hpp: 750000 },
      ];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorPenjualan" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorHpp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickFormatter={(val) => `${val / 1000}k`}
          />
          <Tooltip
            formatter={(value: any) => [formatRupiah(value), '']}
            contentStyle={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '12px',
            }}
          />
          <Area
            type="monotone"
            dataKey="penjualan"
            name="Penjualan"
            stroke="#f59e0b"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPenjualan)"
          />
          <Area
            type="monotone"
            dataKey="hpp"
            name="HPP"
            stroke="#f43f5e"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorHpp)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

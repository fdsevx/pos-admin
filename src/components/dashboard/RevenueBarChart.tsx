'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatRupiah } from '@/lib/api';

interface Props {
  data?: any[];
}

export default function RevenueBarChart({ data }: Props) {
  const chartData = data && data.length > 0
    ? data
    : [
        { name: 'Jan', pendapatan: 1500000, pengeluaran: 600000 },
        { name: 'Feb', pendapatan: 2100000, pengeluaran: 850000 },
        { name: 'Mar', pendapatan: 1800000, pengeluaran: 720000 },
        { name: 'Apr', pendapatan: 2400000, pengeluaran: 950000 },
        { name: 'Mei', pendapatan: 2900000, pengeluaran: 1100000 },
        { name: 'Jun', pendapatan: 3100000, pengeluaran: 1200000 },
        { name: 'Jul', pendapatan: 2800000, pengeluaran: 980000 },
        { name: 'Agt', pendapatan: 3400000, pengeluaran: 1350000 },
        { name: 'Sep', pendapatan: 4200000, pengeluaran: 1600000 },
      ];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          barGap={6}
        >
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
              fontSize: '12px',
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
          />
          <Bar
            dataKey="pendapatan"
            name="Pendapatan"
            fill="#06b6d4"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            dataKey="pengeluaran"
            name="Pengeluaran"
            fill="#f43f5e"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

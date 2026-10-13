"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { riskFactorsData } from "@/lib/dashboard-data";

interface RiskFactorDatum {
  name: string;
  impact: number;
  fill: string;
}

interface RiskFactorsChartProps {
  height?: number;
  barSize?: number;
  withAxis?: boolean;
  data?: RiskFactorDatum[];
}

export function RiskFactorsChart({
  height = 200,
  barSize = 12,
  withAxis = true,
  data,
}: RiskFactorsChartProps) {
  const chartData = data && data.length > 0 ? data : riskFactorsData;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} layout="vertical" barSize={barSize}>
        <XAxis
          type="number"
          domain={[0, "dataMax + 5"]}
          hide={!withAxis}
          tick={{ fontSize: 11, fill: "#8D9EA0" }}
          axisLine={false}
          tickLine={false}
          unit="%"
        />
        <YAxis
          type="category"
          dataKey="name"
          width={withAxis ? 130 : 100}
          tick={{ fontSize: 11, fill: "#68787A" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v) => [`${v}%`, "Contribution"]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #DDD9D4" }}
        />
        <Bar dataKey="impact" radius={[0, 6, 6, 0]}>
          {chartData.map((d) => (
            <Cell key={d.name} fill={d.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
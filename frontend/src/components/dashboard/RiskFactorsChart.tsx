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

interface RiskFactorsChartProps {
  height?: number;
  barSize?: number;
  withAxis?: boolean;
}

export function RiskFactorsChart({
  height = 200,
  barSize = 12,
  withAxis = true,
}: RiskFactorsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={riskFactorsData} layout="vertical" barSize={barSize}>
        <XAxis
          type="number"
          domain={[0, 45]}
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
          {riskFactorsData.map((d) => (
            <Cell key={d.name} fill={d.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
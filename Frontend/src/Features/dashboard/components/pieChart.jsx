import { useMemo } from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Label,
  Tooltip,
} from 'recharts';

const defaultData = [
  { label: 'Active', value: 0, color: '#000000' },
  { label: 'Inactive', value: 0, color: '#cbd5e1' },
];

const CustomTooltip = ({ active, payload, valueLabel = 'items' }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (data.isPlaceholder) return null;

    return (
      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-lg">
        <div className="mb-0.5 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: data.color }} />
          <span className="font-semibold text-slate-900">{data.label}</span>
        </div>
        <p className="text-sm font-bold text-slate-900">
          {data.value} <span className="font-normal text-slate-500">{valueLabel}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function PieChart({
  title = 'Status Distribution',
  data = [],
  valueLabel = 'items',
  centerLabel = 'Total',
}) {
  const rawData = useMemo(() => {
    return Array.isArray(data) && data.length ? data : defaultData;
  }, [data]);

  const total = useMemo(() => {
    return rawData.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  }, [rawData]);

  const chartData = useMemo(() => {
    if (total === 0) {
      return [{ label: 'No Data', value: 1, color: '#f1f5f9', isPlaceholder: true }];
    }
    return rawData.filter((item) => item.value > 0 || rawData.length === 1);
  }, [rawData, total]);

  return (
    <div className="flex min-h-[260px] w-full flex-col items-center justify-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex w-full max-w-[240px] items-center justify-between">
        <h3 className="text-base font-bold tracking-tight text-slate-900">{title}</h3>
      </div>

      <div className="flex items-center justify-center gap-4">
        {/* Direct SVG container replacing ResponsiveContainer */}
        <div className="flex h-32 w-32 items-center justify-center">
          <RechartsPieChart width={128} height={128}>
            <Tooltip content={<CustomTooltip valueLabel={valueLabel} />} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="label"
              cx={60}
              cy={60}
              innerRadius={35}
              outerRadius={50}
              paddingAngle={total === 0 ? 0 : 4}
              cornerRadius={5}
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
              <Label
                content={({ viewBox }) => (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan x={viewBox.cx} dy="-0.5em" className="fill-slate-900 text-lg font-extrabold">
                      {total}
                    </tspan>
                    <tspan x={viewBox.cx} dy="1.2em" className="fill-slate-400 text-[10px] font-medium">
                      {centerLabel}
                    </tspan>
                  </text>
                )}
              />
            </Pie>
          </RechartsPieChart>
        </div>

        <div className="flex flex-col justify-center gap-2">
          {rawData.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800">{item.label}</span>
                <span className="text-[10px] font-medium text-slate-400">
                  {item.value} ({total ? ((item.value / total) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
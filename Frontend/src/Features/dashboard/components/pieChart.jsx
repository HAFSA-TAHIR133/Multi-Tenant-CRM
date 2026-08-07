import { useMemo } from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Label,
  Tooltip,
} from 'recharts';

// Custom status color mapping
const STATUS_COLOR_MAP = {
  open: '#000000',        // Black
  active: '#000000',      // Black
  close: '#cbd5e1',       // Light Grey
  closed: '#cbd5e1',      // Light Grey
  pending: '#94a3b8',     // Grey (Slate-400)
  'in progress': '#64748b', // Medium Grey (Slate-500)
};

// Fallback palette consisting purely of grey tones
const DEFAULT_COLORS = ['#000000', '#94a3b8', '#cbd5e1', '#64748b', '#e2e8f0'];

const defaultData = [
  { label: 'Active', value: 0, color: '#000000' },
  { label: 'Pending', value: 0, color: '#94a3b8' },
];

const CustomTooltip = ({ active, payload, valueLabel = 'items' }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (data.isPlaceholder) return null;

    return (
      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
        <div className="mb-0.5 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: data.color }} />
          <span className="font-semibold text-slate-900 dark:text-slate-100">{data.label}</span>
        </div>
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {data.value} <span className="font-normal text-slate-500 dark:text-slate-400">{valueLabel}</span>
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
    if (!Array.isArray(data) || !data.length) return defaultData;

    return data.map((item, index) => {
      let label = item.label || item.status || item.name || `Category ${index + 1}`;
      const value = Number(item.value ?? item.count ?? 0);

      const lowerKey = label.toLowerCase().trim();

      // Normalize 'close' or 'closed' to 'Closed'
      if (lowerKey === 'close' || lowerKey === 'closed') {
        label = 'Closed';
      }

      // Assign custom color (Check map first, then item.color, then default grey palette)
      const color =
        STATUS_COLOR_MAP[lowerKey] ||
        item.color ||
        DEFAULT_COLORS[index % DEFAULT_COLORS.length];

      return {
        id: item.id || `pie-item-${lowerKey}-${index}`,
        label,
        value: isNaN(value) ? 0 : value,
        color,
      };
    });
  }, [data]);

  const total = useMemo(() => {
    return rawData.reduce((acc, curr) => acc + curr.value, 0);
  }, [rawData]);

  const chartData = useMemo(() => {
    if (total === 0) {
      return [{ id: 'placeholder', label: 'No Data', value: 1, color: '#f1f5f9', isPlaceholder: true }];
    }
    return rawData.filter((item) => item.value > 0);
  }, [rawData, total]);

  return (
    <div className="flex min-h-[260px] w-full flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Title positioned cleanly at the top */}
      <div className="w-full">
        <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h3>
      </div>

      {/* Chart and Legend area centered below the title */}
      <div className="flex items-center justify-center gap-6 my-auto">
        {/* Scaled down pie container (110px width/height) */}
        <div className="flex h-[110px] w-[110px] items-center justify-center">
          <RechartsPieChart width={110} height={110}>
            <Tooltip content={<CustomTooltip valueLabel={valueLabel} />} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="label"
              cx={55}
              cy={55}
              innerRadius={30}
              outerRadius={44}
              paddingAngle={total === 0 || chartData.length <= 1 ? 0 : 4}
              cornerRadius={4}
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${entry.id}-${index}`} fill={entry.color} />
              ))}
              <Label
                content={({ viewBox }) => {
                  const cx = viewBox?.cx ?? 55;
                  const cy = viewBox?.cy ?? 55;
                  return (
                    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan x={cx} dy="-0.1em" className="fill-slate-900 text-base font-extrabold dark:fill-slate-100">
                        {total}
                      </tspan>
                      <tspan x={cx} dy="1.3em" className="fill-slate-400 text-[9px] font-medium">
                        {centerLabel}
                      </tspan>
                    </text>
                  );
                }}
              />
            </Pie>
          </RechartsPieChart>
        </div>

        {/* Legend */}
        <div className="flex flex-col justify-center gap-2">
          {rawData.map((item, index) => {
            const percentage = total ? ((item.value / total) * 100).toFixed(1) : '0.0';

            return (
              <div key={`legend-${item.id}-${index}`} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.label}</span>
                  <span className="text-[10px] font-medium text-slate-400">
                    {item.value} ({percentage}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
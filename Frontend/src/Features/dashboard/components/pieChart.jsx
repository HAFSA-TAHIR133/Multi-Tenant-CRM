import { useMemo, useEffect, useState } from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Label,
  Tooltip,
} from 'recharts';

const CustomTooltip = ({ active, payload, valueLabel = 'items' }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (data.isPlaceholder) return null;

    return (
      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
        <div className="mb-0.5 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: data.color }} />
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
  const [isDark, setIsDark] = useState(false);

  // Sync state with html.dark class
  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Theme-aware status colors
  const statusColors = useMemo(() => {
    const completedColor = isDark ? '#ffffff' : '#09090b'; // White in Dark, Black in Light
    const pendingColor = '#475569';                        // Dark Grey in both Light & Dark
    const overdueColor = '#ef4444';                        // Red in both Light & Dark

    return {
      // Completed statuses
      completed: completedColor,
      done: completedColor,
      active: completedColor,
      open: completedColor,

      // Pending statuses
      pending: pendingColor,
      'in progress': pendingColor,
      inactive: pendingColor,
      close: pendingColor,
      closed: pendingColor,

      // Overdue statuses
      overdue: overdueColor,
    };
  }, [isDark]);

  const rawData = useMemo(() => {
    const fallbackData = [
      { label: 'Completed', value: 0, color: isDark ? '#ffffff' : '#09090b' },
      { label: 'Pending', value: 0, color: '#475569' },
      { label: 'Overdue', value: 0, color: '#ef4444' },
    ];

    if (!Array.isArray(data) || !data.length) return fallbackData;

    return data.map((item, index) => {
      let label = item.label || item.status || item.name || `Category ${index + 1}`;
      const value = Number(item.value ?? item.count ?? 0);
      const lowerKey = label.toLowerCase().trim();

      if (lowerKey === 'close' || lowerKey === 'closed') {
        label = 'Closed';
      }

      // Check statusColors map first so backend colors don't override the required theme specification
      const color =
        statusColors[lowerKey] ||
        item.color ||
        (isDark ? '#ffffff' : '#09090b');

      return {
        id: item.id || `pie-item-${lowerKey}-${index}`,
        label,
        value: isNaN(value) ? 0 : value,
        color,
      };
    });
  }, [data, isDark, statusColors]);

  const total = useMemo(() => rawData.reduce((acc, curr) => acc + curr.value, 0), [rawData]);

  const chartData = useMemo(() => {
    if (total === 0) {
      return [{ id: 'placeholder', label: 'No Data', value: 1, color: isDark ? '#334155' : '#e2e8f0', isPlaceholder: true }];
    }
    return rawData.filter((item) => item.value > 0);
  }, [rawData, total, isDark]);

  return (
    <div className="flex min-h-[260px] w-full flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="w-full">
        <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h3>
      </div>

      <div className="flex items-center justify-center gap-6 my-auto">
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

        <div className="flex flex-col justify-center gap-2">
          {rawData.map((item, index) => {
            const percentage = total ? ((item.value / total) * 100).toFixed(1) : '0.0';

            return (
              <div key={`legend-${item.id}-${index}`} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
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
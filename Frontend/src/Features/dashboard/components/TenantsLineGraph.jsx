import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChevronDown, Check } from 'lucide-react';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val);
};

const CustomTooltip = ({ active, payload, xKey, yKey, valueLabel = 'Value', isCurrency = false }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const rawValue = payload[0].value ?? 0;
    const formattedVal = isCurrency ? formatCurrency(rawValue) : rawValue.toLocaleString();

    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3 text-white shadow-xl">
        <p className="mb-1 text-xs font-medium text-slate-400">{data?.[xKey] ?? ''}</p>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-100" />
          <p className="text-sm font-bold">
            {formattedVal}{' '}
            <span className="text-xs font-normal text-slate-300">{valueLabel}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const CustomDot = (props) => {
  const { cx, cy } = props;
  if (cx === undefined || cy === undefined) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4.5}
      fill="#0f172a"
      stroke="#ffffff"
      strokeWidth={2.5}
      className="cursor-pointer drop-shadow-md"
    />
  );
};

export default function TenantsLineGraph({
  title = 'Trend Overview',
  valueLabel = 'Items',
  data = [],
  xKey = 'day',
  yKey = 'value',
  isCurrency = false,
  dropdownOptions = ['This Week', 'Last 7 Days', 'Last 14 Days'],
  onTimeframeChange,
}) {
  const [timeframe, setTimeframe] = useState(dropdownOptions[0] || 'This Week');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fallback structure to ensure X-axis always has days to show if data is empty
  const defaultEmptyData = [
    { day: 'Sun', [yKey]: 0 },
    { day: 'Mon', [yKey]: 0 },
    { day: 'Tue', [yKey]: 0 },
    { day: 'Wed', [yKey]: 0 },
    { day: 'Thu', [yKey]: 0 },
    { day: 'Fri', [yKey]: 0 },
    { day: 'Sat', [yKey]: 0 },
  ];

  const currentData = useMemo(() => {
    let raw = [];
    if (Array.isArray(data)) raw = data;
    else if (data && Array.isArray(data.data)) raw = data.data;
    else if (data && Array.isArray(data.chartData)) raw = data.chartData;
    else if (data && Array.isArray(data.result)) raw = data.result;

    return raw.length > 0 ? raw : defaultEmptyData;
  }, [data, yKey]);

  // Calculate maximum value directly to determine precise Y-Axis domain
  const maxVal = useMemo(() => {
    const computedMax = Math.max(...currentData.map((d) => Number(d?.[yKey]) || 0), 0);
    return computedMax === 0 ? 100 : 'auto';
  }, [currentData, yKey]);

  const total = useMemo(() => {
    return currentData.reduce((acc, curr) => acc + (Number(curr?.[yKey]) || 0), 0);
  }, [currentData, yKey]);

  const formattedTotal = isCurrency ? formatCurrency(total) : `+${total.toLocaleString()}`;

  return (
    <div className="flex h-full w-full flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-xl font-extrabold tracking-tight text-slate-900">{title}</h3>
          <div className="mt-2.5 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-900" />
              <span className="text-xs font-medium text-slate-500">{valueLabel}</span>
            </div>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs font-bold text-slate-900">{formattedTotal} Total</span>
          </div>
        </div>

        {dropdownOptions?.length ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-200/70 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <span>{timeframe}</span>
              <ChevronDown size={14} className={`text-slate-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                {dropdownOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setTimeframe(option);
                      setDropdownOpen(false);
                      if (onTimeframeChange) onTimeframeChange(option);
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-xs ${
                      timeframe === option ? 'bg-slate-100 font-semibold text-slate-900 dark:bg-slate-700 dark:text-slate-100' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <span>{option}</span>
                    {timeframe === option && <Check size={14} className="text-slate-900" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={currentData} margin={{ top: 10, right: 1, left: 2, bottom: 0 }}>
            <defs>
              <linearGradient id="graphGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f172a" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#0f172a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey={xKey}
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              domain={[0, maxVal]}
              tickFormatter={(val) => (isCurrency ? `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}` : val)}
            />

            <Tooltip
              content={
                <CustomTooltip xKey={xKey} yKey={yKey} valueLabel={valueLabel} isCurrency={isCurrency} />
              }
            />
            <Area
              type="monotone"
              dataKey={yKey}
              stroke="#0f172a"
              strokeWidth={3.5}
              fillOpacity={1}
              fill="url(#graphGlow)"
              dot={<CustomDot />}
              activeDot={{ r: 7, fill: '#ffffff', stroke: '#0f172a', strokeWidth: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
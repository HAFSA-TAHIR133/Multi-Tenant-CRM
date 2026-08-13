import { useMemo, useState, useEffect } from 'react';
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
      <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:text-white">
        <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{data?.[xKey] ?? ''}</p>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-black dark:bg-white" />
          <p className="text-sm font-bold">
            {formattedVal}{' '}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-300">{valueLabel}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const CustomDot = ({ cx, cy, isDark }) => {
  if (cx === undefined || cy === undefined) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4.5}
      fill={isDark ? '#ffffff' : '#09090b'}
      stroke={isDark ? '#09090b' : '#ffffff'}
      strokeWidth={2}
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
  const [isDark, setIsDark] = useState(false);

  // Monitor html.dark class changes to switch stroke & glow dynamically
  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

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

  const maxVal = useMemo(() => {
    const computedMax = Math.max(...currentData.map((d) => Number(d?.[yKey]) || 0), 0);
    return computedMax === 0 ? 100 : 'auto';
  }, [currentData, yKey]);

  const total = useMemo(() => {
    return currentData.reduce((acc, curr) => acc + (Number(curr?.[yKey]) || 0), 0);
  }, [currentData, yKey]);

  const formattedTotal = isCurrency ? formatCurrency(total) : `+${total.toLocaleString()}`;

  // Theme-dependent colors: Black in Light Mode, White in Dark Mode
  const mainColor = isDark ? '#ffffff' : '#09090b';

  return (
    <div className="flex h-full w-full flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{title}</h3>
          <div className="mt-2.5 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-black dark:bg-white" />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{valueLabel}</span>
            </div>
            <span className="text-xs text-slate-300 dark:text-slate-700">•</span>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{formattedTotal} Total</span>
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
                    {timeframe === option && <Check size={14} className="text-slate-900 dark:text-white" />}
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
              <linearGradient id="themeGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={mainColor} stopOpacity={isDark ? 0.25 : 0.15} />
                <stop offset="100%" stopColor={mainColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey={xKey}
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#64748b"
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
              stroke={mainColor}
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#themeGlow)"
              dot={<CustomDot isDark={isDark} />}
              activeDot={{ r: 7, fill: mainColor, stroke: isDark ? '#09090b' : '#ffffff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
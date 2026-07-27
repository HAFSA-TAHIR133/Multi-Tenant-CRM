import React from 'react';

/**
 * 1. Helper Function: formatDate
 * Use this when you need formatted text directly (e.g. formatDate(tenant.createdAt))
 */
export function formatDate(date, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!date) return 'N/A';
  
  const parsedDate = new Date(date);

  // Check if date is invalid
  if (isNaN(parsedDate.getTime())) return 'N/A';

  return new Intl.DateTimeFormat('en-US', options).format(parsedDate);
}

/**
 * 2. Helper Function: formatRelativeTime
 * Shows relative time strings like "2 hours ago" or "3 days ago"
 */
export function formatRelativeTime(date) {
  if (!date) return 'N/A';
  
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return 'N/A';

  const now = new Date();
  const diffInSeconds = Math.floor((now - parsedDate) / 1000);

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  const intervals = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'week', seconds: 604800 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 },
  ];

  for (const { unit, seconds } of intervals) {
    if (Math.abs(diffInSeconds) >= seconds || unit === 'second') {
      const value = Math.round(diffInSeconds / seconds);
      return rtf.format(-value, unit);
    }
  }
}

/**
 * 3. React Component: DateFormatter (Default Export)
 * Use this as a tag in JSX (e.g. <DateFormatter date={tenant.createdAt} />)
 */
export default function DateFormatter({
  date,
  format = 'medium',
  className = '',
  fallback = 'N/A',
}) {
  if (!date) return <span className={className}>{fallback}</span>;

  const parsedDate = new Date(date);

  if (isNaN(parsedDate.getTime())) {
    return <span className={className}>{fallback}</span>;
  }

  const getFormattedDate = () => {
    switch (format) {
      case 'short': // 07/24/2026
        return formatDate(parsedDate, { month: '2-digit', day: '2-digit', year: 'numeric' });

      case 'medium': // Jul 24, 2026
        return formatDate(parsedDate, { month: 'short', day: 'numeric', year: 'numeric' });

      case 'long': // July 24, 2026 at 4:30 PM
        return formatDate(parsedDate, {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

      case 'time': // 4:30 PM
        return formatDate(parsedDate, { hour: 'numeric', minute: '2-digit', hour12: true });

      case 'relative': // "2 hours ago"
        return formatRelativeTime(parsedDate);

      default:
        return parsedDate.toLocaleDateString();
    }
  };

  return <span className={className}>{getFormattedDate()}</span>;
}
import { useState } from 'react';
import {
  MantineReactTable,
  useMantineReactTable,
} from 'mantine-react-table';
import { Inbox } from 'lucide-react';
import { Box, TextInput } from '@mantine/core';

export default function DataTable({
  columns,
  data,
  loading = false,
  enableGlobalFilter = true,
  enableSorting = true,
  enablePagination = true,
  enableColumnActions = false,
  enableTopToolbar = true,
  enableBottomToolbar = true,
  initialState,
  emptyMessage = 'No records found.',
  mantineTableProps: customTableProps,
  mantineTableHeadCellProps: customHeadCellProps,
  mantineTableCellProps: customCellProps,
  renderTopToolbarCustomActions,
  ...rest
}) {
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useMantineReactTable({
    columns,
    data: data || [],
    state: {
      showProgressBars: loading,
      globalFilter,
      ...(initialState || {}),
    },
    onGlobalFilterChange: setGlobalFilter,
    enableGlobalFilter,
    enableSorting,
    enablePagination,
    enableColumnActions,
    enableTopToolbar,
    enableBottomToolbar,
    renderTopToolbarCustomActions: ({ table }) => (
      <Box style={{ display: 'flex', gap: 12, alignItems: 'center', width: '100%' }}>
        <TextInput
          placeholder="Search..."
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.currentTarget.value)}
          style={{ maxWidth: 320 }}
        />
        {renderTopToolbarCustomActions?.({ table })}
      </Box>
    ),
    renderEmptyRowsFallback: () => (
      <Box
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 16px',
          textAlign: 'center',
        }}
      >
        <Box
          className="dark:!border-slate-700"
          style={{
            marginBottom: '12px',
            borderRadius: '16px',
            padding: '16px',
            color: '#94a3b8',
            border: '1px solid #e2e8f0',
          }}
        >
          <Inbox size={32} strokeWidth={1.5} />
        </Box>
        <h4
          className="dark:!text-slate-200"
          style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', margin: 0 }}
        >
          {emptyMessage}
        </h4>
        <p
          className="dark:!text-slate-400"
          style={{
            marginTop: '4px',
            fontSize: '12px',
            color: '#94a3b8',
            maxWidth: '280px',
          }}
        >
          There are no records matching your request right now.
        </p>
      </Box>
    ),
    mantineTableProps: {
      ...customTableProps,
      className: `w-full overflow-visible rounded-2xl border border-slate-200 dark:border-slate-800 ${loading ? 'opacity-60' : ''}`,
      style: { borderCollapse: 'separate', borderSpacing: '0' },
    },
    mantineTableHeadCellProps: {
      ...customHeadCellProps,
      className:
        'text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 !py-1.5 !px-2 border-b border-slate-100 dark:!border-slate-800',
      style: { borderBottom: '1px solid rgb(241 245 249)' },
    },
    mantineTableContainerProps: {
      style: {
        overflow: 'visible',
      },
    },

    mantinePaperProps: {
      style: {
        overflow: 'visible',
      },
    },
    mantineTableCellProps: {
      ...customCellProps,
      className:
        'text-xs text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/50 !py-1 !px-2 border-b border-slate-100 dark:!border-slate-800/80',
      style: { borderBottom: '1px solid rgb(241 245 249 / 0.8)' },
    },
    ...rest,
  });

  return <MantineReactTable table={table} />;
}
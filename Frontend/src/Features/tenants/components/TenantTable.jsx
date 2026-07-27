import { MantineReactTable, useMantineReactTable } from 'mantine-react-table';
import { Inbox } from 'lucide-react';

export default function TenantTable({ columns, data, loading, emptyMessage }) {

  const table = useMantineReactTable({
    columns,
    data: data || [],
    
    state: { 
      showProgressBars: loading 
    },
    
    renderEmptyRowsFallback: () => (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-3 rounded-2xl bg-slate-50 p-4 text-slate-400 ring-1 ring-slate-100">
          <Inbox size={32} strokeWidth={1.5} />
        </div>
        <h4 className="text-sm font-bold text-slate-800">No tenants found</h4>
        <p className="mt-1 text-xs text-slate-400 max-w-xs">
          {emptyMessage || "There are no records matching your request right now."}
        </p>
      </div>
    ),

    enablePagination: false,
    enableSorting: false,
    enableColumnActions: false,
    enableTopToolbar: false,
    enableBottomToolbar: false,
    enableRowVirtualization: false,

    mantineTableProps: {
      className: 'w-full overflow-hidden rounded-2xl border border-slate-200/70 bg-white',
      style: { borderCollapse: 'separate', borderSpacing: '0' },
    },
    mantineTableHeadProps: {
      className: 'bg-slate-50/60',
    },
    mantineTableHeadCellProps: {
      className: 'text-[11px] font-bold uppercase tracking-wider text-slate-500 !py-3.5 !px-4',
      style: { borderBottom: '1px solid rgb(241 245 249)' },
    },
    mantineTableCellProps: {
      className: 'text-slate-700 transition-colors hover:bg-slate-50/70 !py-3 !px-4',
      style: { borderBottom: '1px solid rgb(241 245 249 / 0.8)' },
    },
  });

  return <MantineReactTable table={table} />;
}
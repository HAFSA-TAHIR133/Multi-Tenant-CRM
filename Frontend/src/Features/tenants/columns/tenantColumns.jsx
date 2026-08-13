import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Power } from 'lucide-react';
import { Link } from 'react-router-dom';

export const tenantColumns = ({ onEdit, onDelete, onToggleStatus }) => [
  {
    accessorKey: 'name',
    header: 'Name',
    Cell: ({ row }) => {
      const tenant = row.original;
      const tenantId = tenant?.id || tenant?._id;

      return (
        <Link
          to={`/superadmin/tenants/${tenantId}/users`}
          className="font-medium text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {tenant?.name}
        </Link>
      );
    },
  },
  {
    accessorKey: 'slug',
    header: 'Slug',
    Cell: ({ cell }) => (
      <span className="text-slate-600 dark:text-slate-400">{cell.getValue() || '—'}</span>
    ),
  },
  {
    accessorKey: 'domain',
    header: 'Domain',
    Cell: ({ cell }) => (
      <span className="text-slate-600 dark:text-slate-400">{cell.getValue() || '—'}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    Cell: ({ row }) => {
      const rawStatus = String(row.original.status || '').toLowerCase();
      const isActive = rawStatus === 'active';

      return (
        <Badge
          className={
            isActive
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-red-500/80 dark:bg-red-900/50 text-white hover:bg-red-600/90 dark:hover:bg-red-900/70 border-red-500/30'
          }
        >
          {isActive ? 'Active' : 'Deactivated'}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    Cell: ({ row }) => {
      const tenant = row.original;
      const isActive = String(tenant.status || '').toLowerCase() === 'active';

      return (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            onClick={() => onEdit(tenant)}
          >
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>

          <Button
            size="sm"
            variant={isActive ? 'destructive' : 'default'}
            className={!isActive ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200' : ''}
            onClick={() => onToggleStatus(tenant)}
          >
            <Power className="h-3.5 w-3.5 mr-1" />
            {isActive ? 'Deactivate' : 'Activate'}
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(tenant)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete
          </Button>
        </div>
      );
    },
  },
];
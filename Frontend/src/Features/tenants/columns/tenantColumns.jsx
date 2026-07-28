import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Power } from 'lucide-react';

export const tenantColumns = ({ onEdit, onDelete, onToggleStatus }) => [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'slug',
    header: 'Slug',
  },
  {
    accessorKey: 'domain',
    header: 'Domain',
    Cell: ({ cell }) => cell.getValue() || '—',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    Cell: ({ row }) => {
      const rawStatus = String(row.original.status || '').toLowerCase();
      const isActive = rawStatus === 'active';

      const statusLabel = isActive ? 'Active' : 'Deactivate';

      return (
        <Badge variant={isActive ? 'default' : 'secondary'}>
          {statusLabel}
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
          {/* Edit Button: Black background, white text */}
          <Button
            size="sm"
            className="bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            onClick={() => onEdit(tenant)}
          >
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>

          {/* Activate / Deactivate Button: Red / Destructive */}
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onToggleStatus(tenant)}
          >
            <Power className="h-3.5 w-3.5 mr-1" />
            {isActive ? 'Deactivate' : 'Activate'}
          </Button>

          {/* Delete Button: Red / Destructive */}
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const userColumns = ({
  onEdit,
  onDelete,
  onToggleStatus,
  onNameClick,
  showActions = true,
  currentUserRole,
}) => [
  {
    accessorKey: 'name',
    header: 'Name',
    Cell: ({ row, cell }) => (
      <button
        type="button"
        className="font-medium text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 hover:underline hover:cursor-pointer transition-colors"
        onClick={() => onNameClick?.(row.original)}
      >
        {cell.getValue() || '-'}
      </button>
    ),
  },
  {
    accessorKey: 'email',
    header: 'Email',
    Cell: ({ cell }) => (
      <span className="text-slate-700 dark:text-slate-300">
        {cell.getValue() || '-'}
      </span>
    ),
  },
  {
    accessorKey: 'role',
    header: 'Role',
    Cell: ({ row }) => {
      const role = row.original.role;
      let label = '-';
      if (role === 1) label = 'User';
      if (role === 2) label = 'Admin';
      if (role === 3) label = 'Super Admin';
      return <span className="text-slate-700 dark:text-slate-300">{label}</span>;
    },
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    Cell: ({ row }) => (
      <Badge
        variant={row.original.isActive ? 'default' : 'secondary'}
        className={
          row.original.isActive
            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
            : 'bg-red-500/80 dark:bg-red-900/50 text-white hover:bg-red-600/90 dark:hover:bg-red-900/70 border-red-500/30'
        }
      >
        {row.original.isActive ? 'Active' : 'Deactivated'}
      </Badge>
    ),
  },
  ...(showActions && currentUserRole !== 1
    ? [
        {
          id: 'actions',
          header: 'Actions',
          Cell: ({ row }) => {
            const user = row.original;
            return (
              <div className="flex items-center gap-2 whitespace-nowrap">
                <Button variant="outline" size="sm" onClick={() => onEdit?.(user)}>
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onToggleStatus?.(user)}
                >
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => onDelete?.(user)}>
                  Delete
                </Button>
              </div>
            );
          },
        },
      ]
    : []),
];
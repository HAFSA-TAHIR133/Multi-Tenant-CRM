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
        className="text-blue-600 hover:underline"
        onClick={() => onNameClick?.(row.original)}
      >
        {cell.getValue() || '-'}
      </button>
    ),
  },
  {
    accessorKey: 'email',
    header: 'Email',
    Cell: ({ cell }) => cell.getValue() || '-',
  },
  {
    accessorKey: 'role',
    header: 'Role',
    Cell: ({ row }) => {
      const role = row.original.role;
      if (role === 1) return 'User';
      if (role === 2) return 'Admin';
      if (role === 3) return 'Super Admin';
      return '-';
    },
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    Cell: ({ row }) => (
      <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
        {row.original.isActive ? 'Active' : 'Inactive'}
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
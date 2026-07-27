import { Link } from 'react-router-dom';
import { Badge } from '../../../components/ui/badge';
import RowActions from '../../../components/common/RowActions';

export const tenantColumns = ({ onEdit, onDelete, onToggleStatus }) => [
  {
    accessorKey: 'name',
    header: 'Name',
    Cell: ({ cell, row }) => (
      <Link
        to={`/superadmin/tenants/${row.original.id}/users`}
        className="font-medium text-primary hover:text-blue-600 hover:underline cursor-pointer transition-colors"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: 'slug',
    header: 'Slug',
  },
  {
    accessorKey: 'domain',
    header: 'Domain',
    Cell: ({ cell, row }) => row.original.domain || '-',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    Cell: ({ cell, row }) => (
      <Badge variant={row.original.status === 'active' ? 'default' : 'secondary'}>
        {row.original.status === 'inactive' ? 'Deactivate' : row.original.status}
      </Badge>
    ),
  },
  {
    id: 'actions',
    header: 'Actions',
    Cell: ({ row }) => {
      const tenant = row.original;
      return (
        <RowActions
          onEdit={() => onEdit(tenant)}
          onDelete={() => onDelete(tenant)}
          onToggleStatus={() => onToggleStatus(tenant)}
          status={tenant.status}
          showToggle={true}
        />
      );
    },
  },
];
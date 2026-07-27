import { Button, Group, Select, Text, Badge } from '@mantine/core';

const STATUS_COLORS = {
  open: 'blue',
  qualified: 'cyan',
  contacted: 'violet',
  won: 'green',
  lost: 'red',
};

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

export const getLeadColumns = ({ onView, onEdit, onDelete, onStatusChange, canManage }) => [
  {
    accessorKey: 'contactName',
    header: 'Name',
    size: 140,
    Cell: ({ row, cell }) => (
      <span
        className="cursor-pointer text-sm font-semibold text-black hover:text-blue-500 transition-colors"
        onClick={() => onView?.(row.original)}
        >
        {cell.getValue() || '-'}
        </span>
    ),
  },
  {
    accessorKey: 'companyName',
    header: 'Company',
    size: 140,
    Cell: ({ cell }) => <Text size="sm">{cell.getValue() || '-'}</Text>,
  },
  {
    accessorKey: 'email',
    header: 'Email',
    size: 180,
    Cell: ({ cell }) => <Text size="sm">{cell.getValue() || '-'}</Text>,
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    size: 130,
    Cell: ({ cell }) => <Text size="sm">{cell.getValue() || '-'}</Text>,
  },
  {
    accessorKey: 'source',
    header: 'Source',
    size: 110,
    Cell: ({ cell }) => <Text size="sm">{cell.getValue() || '-'}</Text>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 140,
    Cell: ({ row, cell }) => {
      const currentVal = cell.getValue() || 'open';
      return (
        <Select
          value={currentVal}
          data={STATUS_OPTIONS}
          onChange={(value) => onStatusChange?.(row.original, value)}
          allowDeselect={false}
          searchable={false}
          size="xs"
          w={120}
          // Prevents popup from flipping upwards and hiding under table headers
          comboboxProps={{
            withinPortal: true,
            zIndex: 9999,
            position: 'top-start',
            middlewares: { flip: false, shift: true },
            shadow: 'md',
            dropdownPadding: 4
          }}
          maxDropdownHeight={100}
          renderOption={({ option }) => (
            <div className="py-0.5">
              <Badge
                size="xs"
                variant="light"
                color={STATUS_COLORS[option.value] || 'gray'}
                className="capitalize"
              >
                {option.label}
              </Badge>
            </div>
          )}
        />
      );
    },
  },
  {
    accessorKey: 'actions',
    header: 'Actions',
    size: 160, // Increased width so Edit and Delete fit on one row cleanly
    Cell: ({ row }) => (
      <Group gap={6} wrap="nowrap" align="center" style={{ width: 'max-content' }}>
        {canManage && (
          <>
            <Button
              variant="light"
              color="green"
              size="xs"
              px="xs"
              onClick={() => onEdit(row.original)}
            >
              Edit
            </Button>
            <Button
              variant="light"
              color="red"
              size="xs"
              px="xs"
              onClick={() => onDelete(row.original)}
            >
              Delete
            </Button>
          </>
        )}
      </Group>
    ),
  },
];
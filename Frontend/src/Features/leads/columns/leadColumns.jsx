import { Select, Text, Badge } from '@mantine/core';

const STATUS_COLORS = {
  open: 'blue',
  closed: 'gray',
};

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
];

export const getLeadColumns = ({ 
  onView, 
  onStatusChange, 
}) => [
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
      // Normalize incoming string (e.g., 'close' or 'CLOSED' -> 'closed')
      const rawVal = String(cell.getValue() || 'open').toLowerCase();
      const currentVal = rawVal === 'close' ? 'closed' : rawVal;

      return (
        <Select
          value={currentVal}
          data={STATUS_OPTIONS}
          onChange={(value) => onStatusChange?.(row.original, value)}
          allowDeselect={false}
          searchable={false}
          size="xs"
          w={120}
          comboboxProps={{
            withinPortal: true,
            zIndex: 9999,
            position: 'top-start',
            middlewares: { flip: false, shift: true },
            shadow: 'md',
            dropdownPadding: 4,
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
];
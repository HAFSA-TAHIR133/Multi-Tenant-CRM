import { Group, Text, ActionIcon, Badge } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function StageCard({ stage, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(stage.id) });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    border: '1px solid #e2e8f0',
    background: '#fff',
    borderRadius: 8,
    borderLeft: `3px solid ${stage.color || '#111111'}`,
  };

  return (
    <div ref={setNodeRef} style={style} px="sm" py="xs">
      <Group justify="space-between" wrap="nowrap">
        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
          <span
            {...attributes}
            {...listeners}
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: stage.color || '#111111',
              flexShrink: 0,
              cursor: 'grab',
            }}
          />
          <div style={{ minWidth: 0 }}>
            <Text fw={600} size="sm" c="dark" lineClamp={1}>
              {stage.name}
            </Text>
            <Text size="xs" c="dimmed" lineClamp={1}>
              {stage.description || 'No description'}
            </Text>
          </div>
        </Group>

        <Group gap={4} wrap="nowrap">
          <ActionIcon variant="subtle" color="dark" onClick={onEdit} size="sm">
            <IconPencil size={14} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red" onClick={onDelete} size="sm">
            <IconTrash size={14} />
          </ActionIcon>
        </Group>
      </Group>
    </div>
  );
}
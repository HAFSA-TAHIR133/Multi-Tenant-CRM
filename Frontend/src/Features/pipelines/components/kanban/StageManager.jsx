import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  Group,
  Button,
  Stack,
  Text,
  Paper,
  ActionIcon,
  Tooltip,
  Box,
  Divider,
  Popover,
  ColorPicker,
} from '@mantine/core';
import {
  IconPencil,
  IconTrash,
  IconGripVertical,
  IconPalette,
} from '@tabler/icons-react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { pipelinesApi } from '../../api/pipelinesApi';

const normalizeHex = (v, fallback = '#111111') => {
  if (typeof v !== 'string') return fallback;
  const s = v.trim();
  const withHash = s.startsWith('#') ? s : `#${s}`;
  return /^#[0-9A-Fa-f]{6}$/.test(withHash) ? withHash : fallback;
};

function isLightColor(hex) {
  const c = normalizeHex(hex).replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

function DraggableStageCard({ stage, onEdit, onDelete, isDeleting, isEditingThis }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: String(stage.id) });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
    borderLeft: `4px solid ${stage.color || '#111111'}`,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border transition-colors ${
        isEditingThis
          ? 'border-blue-500/80 bg-blue-50/20 dark:bg-blue-950/20'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
      }`}
    >
      <Group justify="space-between" wrap="nowrap" px="sm" py="xs">
        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
          <span
            {...attributes}
            {...listeners}
            className="cursor-grab flex items-center text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 flex-shrink-0 touch-none"
          >
            <IconGripVertical size={15} />
          </span>

          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: stage.color || '#111111',
              flexShrink: 0,
            }}
          />

          <div style={{ minWidth: 0, flex: 1 }}>
            <Group gap={6} align="center">
              <Text fw={600} size="sm" className="text-slate-900 dark:text-slate-100" lineClamp={1}>
                {stage.name}
              </Text>
              {isEditingThis && (
                <Text size="10px" fw={700} className="text-blue-600 dark:text-blue-400 uppercase">
                  (Editing)
                </Text>
              )}
            </Group>
            <Text size="xs" className="text-slate-500 dark:text-slate-400" lineClamp={1}>
              {stage.description || 'No description'} · Order {stage.order ?? '-'}
            </Text>
          </div>
        </Group>

        <Group gap={4} wrap="nowrap" flex="0 0 auto">
          <Tooltip label="Edit" withArrow position="top">
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={onEdit}
              size="sm"
              className="text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <IconPencil size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete" withArrow position="top">
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={onDelete}
              size="sm"
              loading={isDeleting}
              className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              <IconTrash size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
    </div>
  );
}

function InteractiveColorPicker({ value, onChange, disabled }) {
  const [popoverOpened, setPopoverOpened] = useState(false);
  const [manualHex, setManualHex] = useState(normalizeHex(value));

  useEffect(() => {
    setManualHex(normalizeHex(value));
  }, [value]);

  const handleManualInput = (e) => {
    let val = String(e?.target?.value ?? e?.currentTarget?.value ?? '');
    if (!val.startsWith('#')) val = `#${val}`;
    setManualHex(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) onChange(val);
  };

  const handleManualBlur = () => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(manualHex)) {
      const next = normalizeHex(value, '#111111');
      setManualHex(next);
      onChange(next);
    }
  };

  const current = normalizeHex(value);

  return (
    <Stack gap={6}>
      <Text size="xs" fw={500} className="text-slate-800 dark:text-slate-200">
        Stage Color
      </Text>

      <Group gap="xs" align="center">
        {/* Spectrum Popover Trigger */}
        <Popover
          opened={popoverOpened}
          onChange={setPopoverOpened}
          width={220}
          position="bottom-start"
          withArrow
          shadow="md"
          className="dark:[&_.mantine-Popover-dropdown]:bg-slate-900 dark:[&_.mantine-Popover-dropdown]:border-slate-800"
        >
          <Popover.Target>
            <Tooltip label="Click to open color spectrum" withArrow position="top">
              <button
                type="button"
                onClick={() => !disabled && setPopoverOpened((o) => !o)}
                disabled={disabled}
                className="border border-slate-300 dark:border-slate-700 shadow-sm transition-all"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: current,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconPalette
                  size={18}
                  style={{
                    color: isLightColor(current) ? '#1e293b' : '#ffffff',
                    pointerEvents: 'none',
                  }}
                />
              </button>
            </Tooltip>
          </Popover.Target>

          <Popover.Dropdown p="xs">
            <Stack gap="xs">
              <ColorPicker
                format="hex"
                value={current}
                onChange={(val) => {
                  setManualHex(val);
                  onChange(val);
                }}
                fullWidth
                size="xs"
              />
              <Button
                size="compact-xs"
                variant="filled"
                fullWidth
                className="bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                onClick={() => setPopoverOpened(false)}
              >
                Done
              </Button>
            </Stack>
          </Popover.Dropdown>
        </Popover>

        {/* Text Hex Input */}
        <TextInput
          value={manualHex}
          onChange={handleManualInput}
          onBlur={handleManualBlur}
          disabled={disabled}
          size="xs"
          placeholder="#000000"
          className="dark:[&_input]:bg-slate-950 dark:[&_input]:text-white dark:[&_input]:border-slate-800"
          styles={{
            root: { flex: 1, maxWidth: 110 },
            input: {
              fontFamily: 'monospace',
              fontWeight: 600,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            },
          }}
        />

        <Box
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            backgroundColor: current,
            color: isLightColor(current) ? '#1e293b' : '#ffffff',
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            height: 30,
            display: 'flex',
            alignItems: 'center',
            border: '1px solid rgba(0,0,0,0.08)',
          }}
        >
          Preview
        </Box>
      </Group>
    </Stack>
  );
}

export default function StageManager({
  opened,
  onClose,
  pipelineId,
  stages = [],
  onChanged,
  editStage = null,
}) {
  const [localStages, setLocalStages] = useState(stages);
  const [editingStage, setEditingStage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    color: '#111111',
  });

  useEffect(() => {
    setLocalStages(stages || []);
  }, [stages]);

  const resetForm = useCallback(() => {
    setForm({
      name: '',
      description: '',
      color: '#111111',
    });
    setEditingStage(null);
  }, []);

  useEffect(() => {
    if (!opened) {
      resetForm();
      setConfirmDelete(null);
      return;
    }

    if (editStage) {
      setEditingStage(editStage);
      setForm({
        name: editStage.name || '',
        description: editStage.description || '',
        color: normalizeHex(editStage.color, '#111111'),
      });
    }
  }, [opened, editStage, resetForm]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const selectStageForEdit = (stage) => {
    setEditingStage(stage);
    setForm({
      name: stage.name || '',
      description: stage.description || '',
      color: normalizeHex(stage.color, '#111111'),
    });
  };

  const saveStage = async () => {
    if (!form.name.trim()) {
      toast.error('Stage name is required');
      return;
    }

    if (!pipelineId) {
      toast.error('Please select a pipeline first');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        pipelineId,
        name: form.name,
        description: form.description,
        color: normalizeHex(form.color, '#111111'),
        order: editingStage ? editingStage.order : (localStages?.length || 0) + 1,
      };

      if (editingStage) {
        await pipelinesApi.updateStage(editingStage.id, payload);
        toast.success('Stage updated');
      } else {
        await pipelinesApi.createStage(payload);
        toast.success('Stage created');
      }

      resetForm();
      onChanged?.();
    } catch (error) {
      toast.error(error?.message || 'Failed to save stage');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteStage = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    try {
      await pipelinesApi.deleteStage(confirmDelete.id);
      toast.success('Stage deleted');

      if (editingStage?.id === confirmDelete.id) {
        resetForm();
      }

      setConfirmDelete(null);
      onChanged?.();
    } catch (error) {
      toast.error(error?.message || 'Failed to delete stage');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;

    const oldIndex = localStages.findIndex((s) => String(s.id) === String(active.id));
    const newIndex = localStages.findIndex((s) => String(s.id) === String(over.id));
    const reordered = arrayMove(localStages, oldIndex, newIndex).map((s, idx) => ({
      ...s,
      order: idx + 1,
    }));

    setLocalStages(reordered);

    try {
      await pipelinesApi.reorderStages(pipelineId, reordered.map((s) => s.id));
      toast.success('Stages reordered');
      onChanged?.();
    } catch {
      toast.error('Failed to save order');
      setLocalStages(stages || []);
    }
  };

  const items = useMemo(() => localStages.map((s) => String(s.id)), [localStages]);

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        size="md"
        title={
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-base text-slate-900 dark:text-slate-100">
              Manage Pipeline Stages
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
              {editingStage
                ? `Edit the ${editingStage.name} stage`
                : 'Add new stages to customize your pipeline workflow.'}
            </span>
          </div>
        }
        centered
        styles={{
          content: { borderRadius: 12 },
        }}
        className="dark:[&_.mantine-Modal-content]:bg-slate-900 dark:[&_.mantine-Modal-content]:border dark:[&_.mantine-Modal-content]:border-slate-800 dark:[&_.mantine-Modal-header]:bg-slate-900 dark:[&_.mantine-Modal-header]:border-b dark:[&_.mantine-Modal-header]:border-slate-800"
      >
        <Stack gap="md" className="mt-1">
          <Paper
            withBorder
            p="sm"
            radius="md"
            className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
          >
            <Stack gap="xs">
              <TextInput
                label="Stage Name"
                placeholder="e.g. In Negotiation"
                size="xs"
                value={form.name}
                onChange={(e) => {
                  const val = e?.target?.value ?? e?.currentTarget?.value ?? '';
                  setForm((p) => ({ ...p, name: val }));
                }}
                required
                disabled={saving}
                className="dark:[&_label]:text-slate-200 dark:[&_input]:bg-slate-900 dark:[&_input]:text-white dark:[&_input]:border-slate-800"
              />

              <Textarea
                label="Description"
                placeholder="Stage description"
                size="xs"
                value={form.description}
                onChange={(e) => {
                  const val = e?.target?.value ?? e?.currentTarget?.value ?? '';
                  setForm((p) => ({ ...p, description: val }));
                }}
                disabled={saving}
                rows={2}
                className="dark:[&_label]:text-slate-200 dark:[&_textarea]:bg-slate-900 dark:[&_textarea]:text-white dark:[&_textarea]:border-slate-800"
              />

              <InteractiveColorPicker
                value={form.color}
                onChange={(color) => setForm((p) => ({ ...p, color }))}
                disabled={saving}
              />

              <Group justify="flex-end" mt={4}>
                <Button
                  size="xs"
                  onClick={saveStage}
                  loading={saving}
                  className="!bg-black !text-white hover:!bg-neutral-800 dark:!bg-white dark:!text-black dark:hover:!bg-neutral-200 cursor-pointer transition-colors"
                >
                  {editingStage ? 'Update Stage' : 'Add Stage'}
                </Button>
              </Group>
            </Stack>
          </Paper>

          <Divider
            label="Existing Stages"
            labelPosition="center"
            className="dark:[&_span]:text-slate-400 dark:border-slate-800"
          />

          <Stack gap="xs">
            {!pipelineId ? (
              <Text size="xs" ta="center" className="text-slate-500 dark:text-slate-400">
                Select a pipeline to view stages.
              </Text>
            ) : localStages.length === 0 ? (
              <Text size="xs" ta="center" className="text-slate-500 dark:text-slate-400">
                No stages added yet. Use the form above to create your first stage.
              </Text>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={items} strategy={verticalListSortingStrategy}>
                  <Stack gap={6} style={{ maxHeight: 260, overflowY: 'auto', paddingRight: 4 }}>
                    {localStages.map((stage) => (
                      <DraggableStageCard
                        key={stage.id}
                        stage={stage}
                        isEditingThis={editingStage?.id === stage.id}
                        onEdit={() => selectStageForEdit(stage)}
                        onDelete={() => setConfirmDelete(stage)}
                        isDeleting={deletingId === stage.id}
                      />
                    ))}
                  </Stack>
                </SortableContext>
              </DndContext>
            )}
          </Stack>
        </Stack>
      </Modal>

      <Modal
        opened={!!confirmDelete && opened}
        onClose={() => setConfirmDelete(null)}
        title={
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            Delete Stage?
          </span>
        }
        centered
        size="xs"
        styles={{ content: { borderRadius: 12 } }}
        className="dark:[&_.mantine-Modal-content]:bg-slate-900 dark:[&_.mantine-Modal-content]:border dark:[&_.mantine-Modal-content]:border-slate-800 dark:[&_.mantine-Modal-header]:bg-slate-900"
      >
        <Stack gap="md">
          <Text size="sm" className="text-slate-500 dark:text-slate-400">
            Are you sure you want to delete{' '}
            <Text component="span" fw={600} className="text-slate-900 dark:text-slate-100">
              "{confirmDelete?.name}"
            </Text>
            ?
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button
              variant="default"
              onClick={() => setConfirmDelete(null)}
              disabled={deletingId === confirmDelete?.id}
              size="xs"
              className="dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={confirmDeleteStage}
              loading={deletingId === confirmDelete?.id}
              size="xs"
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
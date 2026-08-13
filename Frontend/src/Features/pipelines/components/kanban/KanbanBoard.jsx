import { useMemo, useState, useCallback, useEffect } from 'react';
import {
  Group,
  ScrollArea,
  Text,
  ActionIcon,
  Tooltip,
  Modal,
  Button,
  Stack,
} from '@mantine/core';
import { IconPencil, IconTrash, IconGripVertical } from '@tabler/icons-react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { pipelinesApi } from '../../api/pipelinesApi';
import LeadDetailSheet from './LeadDetailSheet';

function DraggableStage({
  stage,
  leads,
  canManage,
  onEditStage,
  onDeleteStage,
  onLeadClick,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `stage-${stage.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const leadIds = useMemo(
    () => (leads || []).map((l) => `lead-${l.id}`),
    [leads]
  );

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        width: 280,
        minWidth: 280,
        flex: '0 0 280px',
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col"
        style={{
          maxHeight: 'calc(100vh - 220px)',
        }}
      >
        {/* ---- header ---- */}
        <div
          className="border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5"
          style={{
            padding: '10px 10px 8px',
          }}
        >
          {/* drag handle */}
          <span
            {...attributes}
            {...listeners}
            className="text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 cursor-grab flex items-center flex-shrink-0 touch-none"
          >
            <IconGripVertical size={14} />
          </span>

          {/* colour dot */}
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: stage.color || '#111',
              flexShrink: 0,
            }}
          />

          {/* name */}
          <span
            className="font-semibold text-xs text-slate-800 dark:text-slate-100 flex-1 overflow-hidden text-ellipsis whitespace-nowrap"
          >
            {stage.name}
          </span>

          {/* count badge */}
          <span
            className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full flex-shrink-0 leading-4"
          >
            {leads?.length || 0}
          </span>

          {/* actions */}
          {canManage && (
            <div style={{ display: 'flex', gap: 0, marginLeft: 2, flexShrink: 0 }}>
              <Tooltip label="Edit" withArrow position="top">
                <ActionIcon
                  variant="subtle"
                  size="xs"
                  className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                  onClick={() => onEditStage?.(stage)}
                >
                  <IconPencil size={13} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Delete" withArrow position="top">
                <ActionIcon
                  variant="subtle"
                  size="xs"
                  className="text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400"
                  onClick={() => onDeleteStage?.(stage)}
                >
                  <IconTrash size={13} />
                </ActionIcon>
              </Tooltip>
            </div>
          )}
        </div>

        {/* ---- cards ---- */}
        <ScrollArea style={{ flex: 1 }} scrollbarSize={6}>
          <SortableContext
            items={leadIds}
            strategy={verticalListSortingStrategy}
          >
            <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(leads || []).map((lead) => (
                <DraggableLeadCard
                  key={lead.id}
                  lead={lead}
                  onClick={() => onLeadClick(lead)}
                />
              ))}
            </div>
          </SortableContext>

          {(!leads || leads.length === 0) && (
            <div style={{ padding: '24px 0', textAlign: 'center' }}>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                No leads
              </span>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

function DraggableLeadCard({ lead, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `lead-${lead.id}` });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-md p-3 cursor-grab touch-none transition-colors"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <div
        className="font-semibold text-xs text-slate-800 dark:text-slate-100 overflow-hidden text-ellipsis whitespace-nowrap"
      >
        {lead.contactName || lead.title || `${lead.companyName || 'Company'} – Contact`}
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
        {lead.companyName || 'No company'}
        {lead.value ? ` · $${lead.value}` : ''}
      </div>
    </div>
  );
}

export default function KanbanBoard({
  pipeline,
  stages = [],
  leads = [],
  canManage,
  onEditStage,
  onDeleteStage,
  onStagesReorder,
  onDataChanged,
  onEditLead,
}) {
  const [selectedLead, setSelectedLead] = useState(null);
  const [history, setHistory] = useState([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [localStages, setLocalStages] = useState(stages);
  const [localLeads, setLocalLeads] = useState(leads);

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deletingStageId, setDeletingStageId] = useState(null);

  useEffect(() => {
    setLocalStages(stages);
  }, [stages]);

  useEffect(() => {
    setLocalLeads(leads);
  }, [leads]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Filter leads based on localLeads state
  const grouped = useMemo(() => {
    const map = {};
    localStages.forEach((s) => {
      map[s.id] = localLeads.filter(
        (lead) => String(lead.stageId) === String(s.id)
      );
    });
    return map;
  }, [localStages, localLeads]);

  const openLead = async (lead) => {
    setSelectedLead(lead);
    setDetailOpen(true);
    try {
      const res = await pipelinesApi.getLeadHistory(lead.id);
      setHistory(res?.data || []);
    } catch {
      setHistory([]);
    }
  };

  const handleDeleteStageClick = (stage) => setDeleteConfirm(stage);

  const confirmDeleteStage = async () => {
    if (!deleteConfirm) return;
    setDeletingStageId(deleteConfirm.id);
    try {
      await pipelinesApi.deleteStage(deleteConfirm.id);
      toast.success('Stage deleted');
      setDeleteConfirm(null);
      onDeleteStage?.(deleteConfirm);
      onDataChanged?.();
    } catch (error) {
      toast.error(error?.message || 'Failed to delete stage');
    } finally {
      setDeletingStageId(null);
    }
  };

  const handleDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      /* ---- stage reorder ---- */
      if (activeId.startsWith('stage-') && overId.startsWith('stage-')) {
        const sId = activeId.replace('stage-', '');
        const oId = overId.replace('stage-', '');
        const oldIdx = localStages.findIndex((s) => String(s.id) === sId);
        const newIdx = localStages.findIndex((s) => String(s.id) === oId);
        if (oldIdx === -1 || newIdx === -1) return;

        const reordered = arrayMove(localStages, oldIdx, newIdx).map(
          (s, i) => ({ ...s, order: i + 1 })
        );
        setLocalStages(reordered);

        try {
          await pipelinesApi.reorderStages(
            pipeline?.id,
            reordered.map((s) => s.id)
          );
          toast.success('Stages reordered');
          onStagesReorder?.(reordered);
        } catch {
          toast.error('Failed to save stage order');
          setLocalStages(stages);
        }
        return;
      }

      if (activeId.startsWith('lead-') && overId.startsWith('lead-')) {
        const lId = activeId.replace('lead-', '');
        const oLId = overId.replace('lead-', '');
        const aLead = localLeads.find((l) => String(l.id) === lId);
        const oLead = localLeads.find((l) => String(l.id) === oLId);
        if (!aLead || !oLead) return;

        if (String(aLead.stageId) === String(oLead.stageId)) {
          const stageLeads = [...(grouped[aLead.stageId] || [])];
          const oi = stageLeads.findIndex((l) => String(l.id) === lId);
          const ni = stageLeads.findIndex((l) => String(l.id) === oLId);
          if (oi === -1 || ni === -1) return;
          const reorderedLeads = arrayMove(stageLeads, oi, ni);
          const otherLeads = localLeads.filter(
            (l) => String(l.stageId) !== String(aLead.stageId)
          );
          setLocalLeads([...otherLeads, ...reorderedLeads]);
          return;
        }
        const targetStageId = oLead.stageId;
        setLocalLeads((prev) =>
          prev.map((l) =>
            String(l.id) === lId ? { ...l, stageId: targetStageId } : l
          )
        );
        try {
          await pipelinesApi.updateLeadStage(lId, targetStageId);
          toast.success('Lead moved');
          onDataChanged?.();
        } catch {
          toast.error('Failed to move lead');
          setLocalLeads(leads);
        }
        return;
      }

      if (activeId.startsWith('lead-') && overId.startsWith('stage-')) {
        const lId = activeId.replace('lead-', '');
        const sId = overId.replace('stage-', '');
        const aLead = localLeads.find((l) => String(l.id) === lId);
        if (!aLead || String(aLead.stageId) === sId) return;

        setLocalLeads((prev) =>
          prev.map((l) =>
            String(l.id) === lId ? { ...l, stageId: sId } : l
          )
        );
        try {
          await pipelinesApi.updateLeadStage(lId, sId);
          toast.success('Lead moved');
          onDataChanged?.();
        } catch {
          toast.error('Failed to move lead');
          setLocalLeads(leads);
        }
      }
    },
    [localStages, localLeads, grouped, pipeline?.id, stages, leads, onStagesReorder, onDataChanged]
  );

  const stageItems = useMemo(
    () => localStages.map((s) => `stage-${s.id}`),
    [localStages]
  );

  return (
    <>
      <div
        className="bg-slate-100/70 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3 min-h-[calc(100vh-240px)] transition-colors"
      >
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragEnd={handleDragEnd}
        >
          <ScrollArea scrollbarSize={6}>
            <SortableContext
              items={stageItems}
              strategy={horizontalListSortingStrategy}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  minHeight: 'calc(100vh - 270px)',
                  paddingRight: 8,
                  paddingBottom: 8,
                }}
              >
                {localStages.map((stage) => (
                  <DraggableStage
                    key={stage.id}
                    stage={stage}
                    leads={grouped[stage.id] || []}
                    canManage={canManage}
                    onEditStage={onEditStage}
                    onDeleteStage={handleDeleteStageClick}
                    onLeadClick={openLead}
                  />
                ))}
              </div>
            </SortableContext>
          </ScrollArea>
        </DndContext>
      </div>

      {/* ---- delete confirmation ---- */}
      <Modal
        opened={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            Delete Stage?
          </span>
        }
        centered
        size="xs"
        styles={{
          content: { borderRadius: 12 },
        }}
        className="dark:[&_.mantine-Paper-root]:bg-slate-900 dark:[&_.mantine-Paper-root]:border-slate-800"
      >
        <Stack gap="md">
          <Text size="sm" className="text-slate-500 dark:text-slate-400">
            This cannot be undone. The stage{' '}
            <Text component="span" fw={600} className="text-slate-900 dark:text-slate-100">
              {deleteConfirm?.name}
            </Text>{' '}
            and all its data will be permanently deleted.
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button
              variant="default"
              onClick={() => setDeleteConfirm(null)}
              disabled={deletingStageId === deleteConfirm?.id}
              size="xs"
              className="dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={confirmDeleteStage}
              loading={deletingStageId === deleteConfirm?.id}
              size="xs"
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>

      <LeadDetailSheet
        opened={detailOpen}
        onClose={() => setDetailOpen(false)}
        lead={selectedLead}
        history={history}
        onEdit={onEditLead}
      />
    </>
  );
}
import { useMemo, useState, useCallback, useEffect } from 'react';
import {
  Group,
  ScrollArea,
  Text,
  ActionIcon,
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
        width: 300,
        minWidth: 300,
        flex: '0 0 300px',
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex flex-col shadow-xs overflow-hidden"
        style={{
          maxHeight: 'calc(100vh - 220px)',
        }}
      >
        {/* ---- Header ---- */}
        <div className="px-4 py-3.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Drag Grip Handle */}
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="text-slate-300 dark:text-slate-600 hover:text-slate-400 cursor-grab flex items-center flex-shrink-0 touch-none border-none bg-transparent p-0"
            >
              <IconGripVertical size={16} />
            </button>

            {/* Stage Indicator Dot */}
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: stage.color || '#22c55e' }}
            />

            {/* Stage Title */}
            <span className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
              {stage.name}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Count Badge */}
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-full min-w-[22px] text-center">
              {leads?.length || 0}
            </span>

            {/* Edit / Delete Actions */}
            {canManage && (
              <div className="flex items-center gap-1 text-slate-400">
                <button
                  type="button"
                  onClick={() => onEditStage?.(stage)}
                  className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 border-none bg-transparent cursor-pointer"
                >
                  <IconPencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteStage?.(stage)}
                  className="hover:text-red-500 transition-colors p-0.5 border-none bg-transparent cursor-pointer"
                >
                  <IconTrash size={15} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ---- Content / Cards ---- */}
        <ScrollArea style={{ flex: 1 }} scrollbarSize={6}>
          <SortableContext
            items={leadIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="p-3 flex flex-col gap-3 min-h-[140px]">
              {(leads || []).map((lead) => (
                <DraggableLeadCard
                  key={lead.id}
                  lead={lead}
                  onClick={() => onLeadClick(lead)}
                />
              ))}

              {(!leads || leads.length === 0) && (
                <div className="flex items-center justify-center py-10">
                  <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                    No leads
                  </span>
                </div>
              )}
            </div>
          </SortableContext>
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
      className="bg-white dark:bg-slate-800/90 hover:bg-slate-50/50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-xl p-4 cursor-grab touch-none transition-all shadow-xs"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
        {lead.contactName || lead.title || `${lead.companyName || 'Company'} – Contact`}
      </div>
      <div className="text-xs text-slate-400 dark:text-slate-400 mt-1 font-medium truncate">
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
      <div className=" rounded-2xl p-2 min-h-[calc(100vh-240px)] transition-colors">
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
              <div className="flex gap-4 items-start min-h-[calc(100vh-290px)] pr-2 pb-2">
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

      {/* Delete Confirmation Modal */}
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
          content: { borderRadius: 16 },
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
              className="rounded-lg dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={confirmDeleteStage}
              loading={deletingStageId === deleteConfirm?.id}
              size="xs"
              className="rounded-lg"
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
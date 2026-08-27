import { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '@/Features/auth/context/AuthContext';
import { ROLES } from '@/constants/roles';
import { pipelinesApi } from '../api/pipelinesApi';
import { tasksApi } from '@/Features/tasks/api/tasksApi';
import { toast } from 'sonner';

import {
  Select,
  Text,
  Modal,
  LoadingOverlay,
  Badge,
} from '@mantine/core';
import { IconPlus, IconPencil, IconTrash, IconShare } from '@tabler/icons-react';
import KanbanBoard from '../components/kanban/KanbanBoard';
import StageManager from '../components/kanban/StageManager';
import EditLeadDialog from '@/Features/leads/components/EditLeadDialog';

import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import {
  Field,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Shared styling buttons
const primaryBtnClass =
  '!bg-[#0f172a] !text-white hover:!bg-slate-800 dark:!bg-white dark:!text-slate-900 dark:hover:!bg-slate-100 cursor-pointer transition-all duration-200 ease-in-out border-0 font-medium rounded-lg';

const outlineBtnClass =
  '!bg-white !text-slate-700 !border-slate-200 hover:!bg-slate-50 dark:!bg-slate-900 dark:!text-slate-200 dark:!border-slate-700 dark:hover:!bg-slate-800 cursor-pointer transition-all duration-200 ease-in-out font-medium rounded-lg';

const deleteBtnClass =
  '!bg-transparent !text-red-500 hover:!bg-red-50 dark:hover:!bg-red-950/30 cursor-pointer transition-all duration-200 ease-in-out border-0 font-medium';

export default function Pipelines() {
  const { user } = useAuth();
  const role = user?.role;
  const canManage = [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(role);

  // Core Data States
  const [pipelines, setPipelines] = useState([]);
  const [allLeads, setAllLeads] = useState([]);
  const [stages, setStages] = useState([]);
  const [leads, setLeads] = useState([]);
  const [editLead, setEditLead] = useState(null);
  const [userTasks, setUserTasks] = useState([]);

  // Selection States
  const [selectedPipelineId, setSelectedPipelineId] = useState(() => {
    const saved = localStorage.getItem('selectedPipelineId');
    return saved ? Number(saved) : null;
  });
  const [selectedLeadId, setSelectedLeadId] = useState(() => {
    const saved = localStorage.getItem('selectedLeadId');
    return saved ? Number(saved) : null;
  });

  // UI States
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState('');

  // Modals & Controls
  const [pipelineModalOpen, setPipelineModalOpen] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState(null);
  const [stageManagerOpen, setStageManagerOpen] = useState(false);
  const [stageManagerMode, setStageManagerMode] = useState('manage');
  const [editingStageFromKanban, setEditingStageFromKanban] = useState(null);
  const [savingPipeline, setSavingPipeline] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [deletePipeline, setDeletePipeline] = useState(null);
  const [isDeletingPipeline, setIsDeletingPipeline] = useState(false);

  // Helper check for lead assignment
  const isLeadAssignedToUser = useCallback(
    (lead) => {
      if (!user) return false;
      const userIdStr = String(user.id || user._id || user.userId);

      const isDirectlyAssigned =
        String(lead.assignedUserId) === userIdStr ||
        String(lead.assignedTo) === userIdStr ||
        String(lead.assignedToId) === userIdStr ||
        String(lead.userId) === userIdStr ||
        (Array.isArray(lead.assignedUsers) &&
          lead.assignedUsers.some((u) => String(u.id || u) === userIdStr));

      if (isDirectlyAssigned) return true;

      const leadId = Number(lead.id);
      return userTasks.some(
        (task) => Number(task.leadId || task.lead_id) === leadId
      );
    },
    [user, userTasks]
  );

  // Helper check for pipeline assignment
  const isUserAssignedToPipeline = useCallback(
    (pipeline) => {
      if (!user) return false;
      const userIdStr = String(user.id || user._id || user.userId);
      return (
        Array.isArray(pipeline.assignedUsers) &&
        pipeline.assignedUsers.some((u) => String(u.id || u) === userIdStr)
      );
    },
    [user]
  );

  // Filter Pipelines
  const visiblePipelines = useMemo(() => {
    if (canManage) return pipelines;

    const userLeadPipelineIds = new Set(
      allLeads
        .filter(isLeadAssignedToUser)
        .map((lead) => String(lead.pipelineId || lead.pipeline?.id))
    );

    return pipelines.filter(
      (p) =>
        userLeadPipelineIds.has(String(p.id)) || isUserAssignedToPipeline(p)
    );
  }, [
    pipelines,
    allLeads,
    canManage,
    isLeadAssignedToUser,
    isUserAssignedToPipeline,
  ]);

  // Selected Pipeline Object
  const selectedPipeline = useMemo(
    () =>
      visiblePipelines.find(
        (p) => String(p.id) === String(selectedPipelineId)
      ) || null,
    [visiblePipelines, selectedPipelineId]
  );

  // Filter Leads
  const visibleLeads = useMemo(() => {
    if (canManage) return leads;
    return leads.filter(isLeadAssignedToUser);
  }, [leads, canManage, isLeadAssignedToUser]);

  const visibleStages = stages;

  const loadInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      const [pipeRes, leadsRes, tasksRes] = await Promise.all([
        pipelinesApi.getAll(),
        pipelinesApi.getAllLeads().catch(() => ({ data: [] })),
        !canManage && user?.id
          ? tasksApi.getTasksForUser(user.id).catch(() => [])
          : Promise.resolve([]),
      ]);

      const normalizedTasks = Array.isArray(tasksRes)
        ? tasksRes
        : Array.isArray(tasksRes?.data)
          ? tasksRes.data
          : Array.isArray(tasksRes?.items)
            ? tasksRes.items
            : [];
      setUserTasks(normalizedTasks);

      const pipeList = Array.isArray(pipeRes?.data)
        ? pipeRes.data
        : Array.isArray(pipeRes)
          ? pipeRes
          : [];
      const leadList = Array.isArray(leadsRes?.data)
        ? leadsRes.data
        : Array.isArray(leadsRes)
          ? leadsRes
          : [];

      setPipelines(pipeList);
      setAllLeads(leadList);

      let availablePipes = pipeList;
      if (!canManage && user) {
        const userIdStr = String(user.id || user._id || user.userId);
        const taskAssignedLeadIds = new Set(
          normalizedTasks
            .map((task) => Number(task.leadId || task.lead_id))
            .filter(Boolean)
        );

        const userPipelineIds = new Set(
          leadList
            .filter((lead) => {
              const isDirectlyAssigned =
                String(lead.assignedUserId) === userIdStr ||
                String(lead.assignedTo) === userIdStr ||
                String(lead.assignedToId) === userIdStr ||
                String(lead.userId) === userIdStr ||
                (Array.isArray(lead.assignedUsers) &&
                  lead.assignedUsers.some(
                    (u) => String(u.id || u) === userIdStr
                  ));

              if (isDirectlyAssigned) return true;
              return taskAssignedLeadIds.has(Number(lead.id));
            })
            .map((l) => String(l.pipelineId || l.pipeline?.id))
        );

        availablePipes = pipeList.filter(
          (p) =>
            userPipelineIds.has(String(p.id)) ||
            (Array.isArray(p.assignedUsers) &&
              p.assignedUsers.some((u) => String(u.id || u) === userIdStr))
        );
      }

      const storedPipeId = localStorage.getItem('selectedPipelineId');
      const validStoredPipe = availablePipes.find(
        (p) => String(p.id) === String(storedPipeId)
      );

      if (validStoredPipe) {
        setSelectedPipelineId(validStoredPipe.id);
      } else if (availablePipes.length > 0) {
        setSelectedPipelineId(availablePipes[0].id);
      } else {
        setSelectedPipelineId(null);
      }
    } catch (err) {
      setError(err?.message || 'Failed to initialize pipelines');
      toast.error(err?.message || 'Failed to initialize pipelines');
    } finally {
      setLoading(false);
    }
  };

  const loadPipelineData = useCallback(async (pipelineId) => {
    if (!pipelineId) {
      setStages([]);
      setLeads([]);
      setSelectedLeadId(null);
      return;
    }
    setDataLoading(true);
    try {
      const [stageRes, leadRes] = await Promise.all([
        pipelinesApi.getStages(pipelineId),
        pipelinesApi.getPipelineLeads(pipelineId).catch(() => ({ data: [] })),
      ]);

      const stageList = Array.isArray(stageRes?.data)
        ? stageRes.data
        : Array.isArray(stageRes)
          ? stageRes
          : [];
      const leadList = Array.isArray(leadRes?.data)
        ? leadRes.data
        : Array.isArray(leadRes)
          ? leadRes
          : [];

      setStages(stageList);
      setLeads(leadList);

      const currentStoredLeadId = localStorage.getItem('selectedLeadId');
      const activeLeadInPipeline = leadList.find(
        (l) => String(l.id) === String(currentStoredLeadId)
      );

      if (activeLeadInPipeline) {
        setSelectedLeadId(activeLeadInPipeline.id);
      } else if (leadList.length > 0) {
        setSelectedLeadId(leadList[0].id);
      } else {
        setSelectedLeadId(null);
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to load pipeline details');
      setStages([]);
      setLeads([]);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedPipelineId) {
      localStorage.setItem('selectedPipelineId', String(selectedPipelineId));
      loadPipelineData(selectedPipelineId);
    } else {
      localStorage.removeItem('selectedPipelineId');
      setStages([]);
      setLeads([]);
      setSelectedLeadId(null);
    }
  }, [selectedPipelineId, loadPipelineData]);

  useEffect(() => {
    if (selectedLeadId) {
      localStorage.setItem('selectedLeadId', String(selectedLeadId));
    } else {
      localStorage.removeItem('selectedLeadId');
    }
  }, [selectedLeadId]);

  // Pipeline Handlers
  const openCreatePipeline = () => {
    setEditingPipeline(null);
    setForm({ name: '', description: '' });
    setPipelineModalOpen(true);
  };

  const openEditPipeline = (pipeline) => {
    setEditingPipeline(pipeline);
    setForm({
      name: pipeline?.name || '',
      description: pipeline?.description || '',
    });
    setPipelineModalOpen(true);
  };

  const savePipeline = async (e) => {
    if (e) e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Pipeline name is required');
      return;
    }
    setSavingPipeline(true);
    try {
      if (editingPipeline) {
        await pipelinesApi.update(editingPipeline.id, form);
        toast.success('Pipeline updated successfully');
      } else {
        const res = await pipelinesApi.create(form);
        toast.success('Pipeline created successfully');
        const createdId = res?.data?.id || res?.id;
        if (createdId) {
          setSelectedPipelineId(createdId);
        }
      }
      setPipelineModalOpen(false);
      await loadInitialData();
    } catch (err) {
      toast.error(err?.message || 'Failed to save pipeline');
    } finally {
      setSavingPipeline(false);
    }
  };

  const confirmDeletePipeline = async () => {
    if (!deletePipeline) return;
    setIsDeletingPipeline(true);
    try {
      await pipelinesApi.remove(deletePipeline.id);
      toast.success('Pipeline deleted');
      const remaining = pipelines.filter(
        (p) => String(p.id) !== String(deletePipeline.id)
      );
      setPipelines(remaining);
      if (String(selectedPipelineId) === String(deletePipeline.id)) {
        const nextPipelineId = remaining.length > 0 ? remaining[0].id : null;
        setSelectedPipelineId(nextPipelineId);
      }
      setDeletePipeline(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to delete pipeline');
    } finally {
      setIsDeletingPipeline(false);
    }
  };

  // Stage Manager Handlers
  const openStageManager = (mode = 'manage') => {
    setEditingStageFromKanban(null);
    setStageManagerMode(mode);
    setStageManagerOpen(true);
  };

  const handleEditStage = (stage) => {
    setEditingStageFromKanban(stage);
    setStageManagerMode('manage');
    setStageManagerOpen(true);
  };

  const handleStagesReorder = (updatedStages) => {
    if (Array.isArray(updatedStages)) {
      setStages(updatedStages);
    }
  };

  const pipelineOptions = visiblePipelines.map((p) => ({
    value: String(p.id),
    label: p.name,
  }));

  return (
    <div className="bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen p-6 relative transition-colors space-y-6">
      <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />

      {/* Top Header Card Container */}
      <div className="bg-[#f8f9fa] dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        {/* Main Header Row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Pipelines
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {canManage
                ? 'Manage your sales pipelines, stages, and update lead information.'
                : 'View your assigned lead pipelines, active stages, and update lead information.'}
            </p>
          </div>

          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                SWITCH PIPELINE
              </span>
              <Select
                placeholder="Select Pipeline"
                data={pipelineOptions}
                value={selectedPipelineId ? String(selectedPipelineId) : null}
                onChange={(val) => {
                  setSelectedPipelineId(val ? Number(val) : null);
                }}
                size="sm"
                className="w-[180px]"
                styles={{
                  input: {
                    cursor: 'pointer',
                    fontWeight: 500,
                    borderRadius: '8px',
                    borderColor: '#e2e8f0',
                    backgroundColor: '#ffffff',
                  },
                }}
              />
            </div>

            {canManage && (
              <Button
                onClick={openCreatePipeline}
                size="sm"
                className={`${primaryBtnClass} h-9 px-4 text-xs gap-1.5`}
              >
                <IconPlus size={16} />
                Add Pipeline
              </Button>
            )}
          </div>
        </div>

        {/* Selected Pipeline Info Sub-Card */}
        {selectedPipeline && (
          <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-purple-950/50 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                <IconShare size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white text-base">
                    {selectedPipeline.name}
                  </span>
                  <Badge
                    variant="light"
                    color="gray"
                    size="xs"
                    className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-semibold tracking-wider uppercase text-[10px]"
                  >
                    PIPELINE
                  </Badge>
                </div>
                {selectedPipeline.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedPipeline.description}
                  </p>
                )}
              </div>
            </div>

            {canManage && (
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  className={`${outlineBtnClass} h-8 text-xs gap-1.5 px-3`}
                  onClick={() => openEditPipeline(selectedPipeline)}
                >
                  <IconPencil size={14} />
                  Edit Pipeline
                </Button>

                <Button
                  size="sm"
                  className={`${primaryBtnClass} h-8 text-xs gap-1.5 px-3`}
                  onClick={() => openStageManager('create')}
                >
                  <IconPlus size={14} />
                  Add Stage
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletePipeline(selectedPipeline)}
                  className={`${deleteBtnClass} h-8 text-xs gap-1 px-2.5`}
                >
                  <IconTrash size={14} />
                  Delete
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </div>
      ) : null}

      {/* Kanban Board Container */}
      {selectedPipeline ? (
        <div className="relative bg-[#f8f9fa] dark:bg-slate-900/40 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 min-h-[450px] shadow-xs">
          <LoadingOverlay visible={dataLoading} overlayProps={{ blur: 1 }} />
          <KanbanBoard
            pipeline={selectedPipeline}
            stages={visibleStages}
            leads={visibleLeads}
            selectedLeadId={selectedLeadId}
            canManage={canManage}
            onEditStage={handleEditStage}
            onDeleteStage={() => {}}
            onStagesReorder={handleStagesReorder}
            onDataChanged={() => loadPipelineData(selectedPipelineId)}
            onEditLead={(lead) => setEditLead(lead)}
          />
        </div>
      ) : (
        !loading && (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center bg-white dark:bg-slate-900 shadow-xs">
            <Text className="text-slate-500 dark:text-slate-400 text-sm">
              {canManage
                ? 'No pipelines available. Create one to get started!'
                : 'No assigned pipelines found.'}
            </Text>
            {canManage && (
              <Button
                onClick={openCreatePipeline}
                size="sm"
                className={`${primaryBtnClass} mt-4 text-xs gap-1.5`}
              >
                <IconPlus size={15} />
                Create Pipeline
              </Button>
            )}
          </div>
        )
      )}

      {/* Stage Manager Modal */}
      <StageManager
        opened={stageManagerOpen}
        onClose={() => {
          setStageManagerOpen(false);
          setEditingStageFromKanban(null);
          setStageManagerMode('manage');
        }}
        pipelineId={selectedPipelineId}
        canManage={canManage}
        stages={stages}
        onChanged={(updatedStages) => {
          if (Array.isArray(updatedStages)) {
            setStages(updatedStages);
          } else {
            loadPipelineData(selectedPipelineId);
          }
        }}
        autoOpenForm={stageManagerMode === 'create' && !editingStageFromKanban}
        editStage={editingStageFromKanban}
      />

      {/* Add/Edit Pipeline Dialog */}
      <Modal
        opened={pipelineModalOpen}
        onClose={() => setPipelineModalOpen(false)}
        title={
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-base text-slate-900 dark:text-slate-100">
              {editingPipeline ? 'Edit Pipeline' : 'Add Pipeline'}
            </span>
            <span className="text-xs text-slate-500 font-normal">
              {editingPipeline
                ? 'Modify the details and workflow setup for this pipeline.'
                : 'Create a new pipeline to organize leads and stages.'}
            </span>
          </div>
        }
        centered
        size="550px"
        radius="lg"
      >
        <form id="pipeline-form" onSubmit={savePipeline}>
          <CardContent className="px-0 py-0 bg-white dark:bg-slate-900">
            <FieldGroup>
              {/* Pipeline Name */}
              <Field>
                <FieldLabel htmlFor="pipeline-name">
                  Pipeline Name <span className="text-red-500">*</span>
                </FieldLabel>
                <Input
                  id="pipeline-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="e.g. Sales Pipeline"
                  autoComplete="off"
                  disabled={savingPipeline}
                />
              </Field>

              {/* Description */}
              <Field>
                <FieldLabel htmlFor="pipeline-description">
                  Description
                </FieldLabel>
                <InputGroup>
                  <InputGroupTextarea
                    id="pipeline-description"
                    value={form.description}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, description: e.target.value }))
                    }
                    placeholder="Briefly describe the purpose of this pipeline..."
                    rows={4}
                    className="min-h-20 resize-none"
                    disabled={savingPipeline}
                  />
                </InputGroup>
              </Field>
            </FieldGroup>
          </CardContent>

          <CardFooter className="flex justify-end gap-2 px-0 pt-4 bg-white dark:bg-slate-900 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPipelineModalOpen(false)}
              disabled={savingPipeline}
              className="cursor-pointer transition-all duration-200 ease-in-out"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="pipeline-form"
              size="sm"
              disabled={savingPipeline}
              className={`${primaryBtnClass}`}
            >
              {savingPipeline
                ? 'Saving...'
                : editingPipeline
                  ? 'Update Pipeline'
                  : 'Create Pipeline'}
            </Button>
          </CardFooter>
        </form>
      </Modal>

      {/* Edit Lead Dialog */}
      {editLead ? (
        <EditLeadDialog
          opened={true}
          lead={editLead}
          onClose={() => setEditLead(null)}
          onSuccess={() => {
            setEditLead(null);
            if (selectedPipelineId) {
              loadPipelineData(selectedPipelineId);
            }
          }}
        />
      ) : null}

      {/* Delete Pipeline Alert */}
      <AlertDialog
        open={!!deletePipeline}
        onOpenChange={(open) => !open && setDeletePipeline(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete pipeline</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">
                {deletePipeline?.name || 'this pipeline'}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingPipeline}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDeletePipeline();
              }}
              disabled={isDeletingPipeline}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer transition-all duration-200 ease-in-out"
            >
              {isDeletingPipeline ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '@/Features/auth/context/AuthContext';
import { ROLES } from '@/constants/roles';
import { pipelinesApi } from '../api/pipelinesApi';
import { tasksApi } from '@/Features/tasks/api/tasksApi';
import { toast } from 'sonner';

import { Select, Title, Text, Modal, LoadingOverlay, Badge, Group, Paper } from '@mantine/core';
import { IconPlus, IconPencil, IconTrash, IconLayoutKanban } from '@tabler/icons-react';
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
        (Array.isArray(lead.assignedUsers) && lead.assignedUsers.some((u) => String(u.id || u) === userIdStr));
      
      if (isDirectlyAssigned) return true;
      
      const leadId = Number(lead.id);
      return userTasks.some((task) => Number(task.leadId || task.lead_id) === leadId);
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
      allLeads.filter(isLeadAssignedToUser).map((lead) => String(lead.pipelineId || lead.pipeline?.id))
    );

    return pipelines.filter(
      (p) => userLeadPipelineIds.has(String(p.id)) || isUserAssignedToPipeline(p)
    );
  }, [pipelines, allLeads, canManage, isLeadAssignedToUser, isUserAssignedToPipeline]);

  // Selected Pipeline Object
  const selectedPipeline = useMemo(
    () => visiblePipelines.find((p) => String(p.id) === String(selectedPipelineId)) || null,
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
        !canManage && user?.id ? tasksApi.getTasksForUser(user.id).catch(() => []) : Promise.resolve([]),
      ]);

      const normalizedTasks = Array.isArray(tasksRes) ? tasksRes :
        Array.isArray(tasksRes?.data) ? tasksRes.data :
        Array.isArray(tasksRes?.items) ? tasksRes.items : [];
      setUserTasks(normalizedTasks);

      const pipeList = Array.isArray(pipeRes?.data) ? pipeRes.data : Array.isArray(pipeRes) ? pipeRes : [];
      const leadList = Array.isArray(leadsRes?.data) ? leadsRes.data : Array.isArray(leadsRes) ? leadsRes : [];

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
                (Array.isArray(lead.assignedUsers) && lead.assignedUsers.some((u) => String(u.id || u) === userIdStr));
              
              if (isDirectlyAssigned) return true;
              return taskAssignedLeadIds.has(Number(lead.id));
            })
            .map((l) => String(l.pipelineId || l.pipeline?.id))
        );

        availablePipes = pipeList.filter(
          (p) =>
            userPipelineIds.has(String(p.id)) ||
            (Array.isArray(p.assignedUsers) && p.assignedUsers.some((u) => String(u.id || u) === userIdStr))
        );
      }

      const storedPipeId = localStorage.getItem('selectedPipelineId');
      const validStoredPipe = availablePipes.find((p) => String(p.id) === String(storedPipeId));

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

      const stageList = Array.isArray(stageRes?.data) ? stageRes.data : Array.isArray(stageRes) ? stageRes : [];
      const leadList = Array.isArray(leadRes?.data) ? leadRes.data : Array.isArray(leadRes) ? leadRes : [];

      setStages(stageList);
      setLeads(leadList);

      const currentStoredLeadId = localStorage.getItem('selectedLeadId');
      const activeLeadInPipeline = leadList.find((l) => String(l.id) === String(currentStoredLeadId));

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
      const remaining = pipelines.filter((p) => String(p.id) !== String(deletePipeline.id));
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
    <div className="bg-[#fcfcfc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen p-6 relative transition-colors">
      <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />

      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <Title order={2} fw={700} className="text-2xl text-gray-900 dark:text-white tracking-tight">
            Pipelines
          </Title>
          <Text className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">
            {canManage
              ? 'Manage your sales pipelines, stages, and update lead information.'
              : 'View your assigned lead pipelines, active stages, and update lead information.'}
          </Text>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
          <Select
            label="Switch Pipeline"
            placeholder="Select Pipeline"
            data={pipelineOptions}
            value={selectedPipelineId ? String(selectedPipelineId) : null}
            onChange={(val) => {
              setSelectedPipelineId(val ? Number(val) : null);
            }}
            size="xs"
            className="w-[190px]"
            styles={{
              input: { cursor: 'pointer', fontWeight: 500 },
              option: { cursor: 'pointer' },
            }}
          />

          {canManage && (
            <Button
              onClick={openCreatePipeline}
              size="sm"
              className="bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 h-8 text-xs gap-1.5 hover:cursor-pointer"
            >
              <IconPlus size={15} />
              Add Pipeline
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </div>
      ) : null}

      {/* Kanban & Pipeline Content */}
      {selectedPipeline ? (
        <div style={{ position: 'relative' }}>
          <LoadingOverlay visible={dataLoading} overlayProps={{ blur: 1 }} />

          <Paper
            p="sm"
            mb="md"
            radius="md"
            withBorder
            className="border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <Group gap="xs" align="center">
                <Badge
                  variant="light"
                  color="gray"
                  size="sm"
                  leftSection={<IconLayoutKanban size={11} />}
                  className="bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300 font-semibold tracking-wider uppercase"
                >
                  Pipeline
                </Badge>
                <Text fw={700} size="lg" className="text-gray-900 dark:text-white leading-tight">
                  {selectedPipeline.name}
                </Text>
              </Group>
              {selectedPipeline.description && (
                <Text size="xs" className="text-gray-500 dark:text-slate-400 mt-1 ml-0.5">
                  {selectedPipeline.description}
                </Text>
              )}
            </div>

            {canManage && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-black text-white hover:bg-black/80h  dark:bg-white dark:text-black dark:hover:bg-white/80 h-8 text-xs gap-1.5 cursor-pointer transition-opacity"
                  onClick={() => openEditPipeline(selectedPipeline)}
                >
                  <IconPencil size={14} />
                  Edit Pipeline
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 h-8 text-xs gap-1.5 hover:cursor-pointer"
                  onClick={() => openStageManager('create')}
                >
                  <IconPlus size={14} />
                  Add Stage
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletePipeline(selectedPipeline)}
                  className="h-8 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 hover:cursor-pointer dark:text-red-400 dark:hover:bg-red-950/50 gap-1.5"
                >
                  <IconTrash size={14} />
                  Delete
                </Button>
              </div>
            )}
          </Paper>

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
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-slate-800 p-8 text-center bg-white dark:bg-slate-900">
            <Text className="text-gray-500 dark:text-slate-400 text-sm">
              {canManage
                ? 'No pipelines available. Create one to get started!'
                : 'No assigned pipelines found.'}
            </Text>
            {canManage && (
              <Button
                onClick={openCreatePipeline}
                size="sm"
                className="mt-4 bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-xs gap-1.5 hover:cursor-pointer"
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

      {/* Redesigned Add/Edit Pipeline Dialog Box */}
      <Modal
        opened={pipelineModalOpen}
        onClose={() => setPipelineModalOpen(false)}
        title={
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-base text-gray-900 dark:text-gray-100">
              {editingPipeline ? 'Edit Pipeline' : 'Add Pipeline'}
            </span>
            <span className="text-xs text-muted-foreground font-normal">
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
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Sales Pipeline"
                  autoComplete="off"
                  disabled={savingPipeline}
                />
              </Field>

              {/* Description */}
              <Field>
                <FieldLabel htmlFor="pipeline-description">Description</FieldLabel>
                <InputGroup>
                  <InputGroupTextarea
                    id="pipeline-description"
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
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
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="pipeline-form"
              size="sm"
              disabled={savingPipeline}
              className="bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 hover:cursor-pointer"
            >
              {savingPipeline ? 'Saving...' : editingPipeline ? 'Update Pipeline' : 'Create Pipeline'}
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
      <AlertDialog open={!!deletePipeline} onOpenChange={(open) => !open && setDeletePipeline(null)}>
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
            <AlertDialogCancel disabled={isDeletingPipeline}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDeletePipeline();
              }}
              disabled={isDeletingPipeline}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingPipeline ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
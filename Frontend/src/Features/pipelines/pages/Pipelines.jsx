import { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '@/Features/auth/context/AuthContext';
import { ROLES } from '@/constants/roles';
import { pipelinesApi } from '../api/pipelinesApi';
import { toast } from 'sonner';

import { Button, TextInput, Textarea, Select, Title, Text, Modal, Stack, LoadingOverlay, Badge, Group, Paper } from '@mantine/core';
import { IconPlus, IconPencil, IconTrash, IconLayoutKanban } from '@tabler/icons-react';

import KanbanBoard from '../components/kanban/KanbanBoard';
import StageManager from '../components/kanban/StageManager';

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
  const [, setAllLeads] = useState([]);
  const [stages, setStages] = useState([]);
  const [leads, setLeads] = useState([]);

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

  // Enhanced Button Styles (Preserving color palette: #111111)
  const primaryBtnStyle = {
    root: {
      backgroundColor: '#111111',
      color: '#ffffff',
      border: '1px solid #111111',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      fontWeight: 500,
      '&:hover': {
        backgroundColor: '#262626',
        color: '#ffffff',
        border: '1px solid #262626',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
      },
      '&:active': {
        transform: 'translateY(0)',
      },
    },
  };

  const secondaryBtnStyle = {
    root: {
      backgroundColor: 'black',
      color: 'white',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      fontWeight: 500,
      '&:hover': {
        backgroundColor: '#f9fafb',
        borderColor: 'white',
        transform: 'translateY(-1px)',
        boxShadow: '0 3px 8px rgba(0,0,0,0.06)',
        color:"black"
      },
      '&:active': {
        transform: 'translateY(0)',
      },
    },
  };

  // Selected Pipeline Object
  const selectedPipeline = useMemo(
    () => pipelines.find((p) => String(p.id) === String(selectedPipelineId)) || null,
    [pipelines, selectedPipelineId]
  );

  // Load All Initial Pipeline List and Global Leads
  const loadInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      const [pipeRes, leadsRes] = await Promise.all([
        pipelinesApi.getAll(),
        pipelinesApi.getAllLeads(),
      ]);

      const pipeList = Array.isArray(pipeRes?.data) ? pipeRes.data : Array.isArray(pipeRes) ? pipeRes : [];
      const leadList = Array.isArray(leadsRes?.data) ? leadsRes.data : Array.isArray(leadsRes) ? leadsRes : [];

      setPipelines(pipeList);
      setAllLeads(leadList);

      // Auto-select initial pipeline
      const storedPipeId = localStorage.getItem('selectedPipelineId');
      const validStoredPipe = pipeList.find((p) => String(p.id) === String(storedPipeId));

      if (!validStoredPipe && pipeList.length > 0) {
        setSelectedPipelineId(pipeList[0].id);
      } else if (validStoredPipe) {
        setSelectedPipelineId(validStoredPipe.id);
      }
    } catch (err) {
      setError(err?.message || 'Failed to initialize pipelines');
      toast.error(err?.message || 'Failed to initialize pipelines');
    } finally {
      setLoading(false);
    }
  };

  // Load Data specific to selected Pipeline
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
        pipelinesApi.getPipelineLeads(pipelineId),
      ]);

      const stageList = Array.isArray(stageRes?.data) ? stageRes.data : Array.isArray(stageRes) ? stageRes : [];
      const leadList = Array.isArray(leadRes?.data) ? leadRes.data : Array.isArray(leadRes) ? leadRes : [];

      setStages(stageList);
      setLeads(leadList);

      // Restore active lead if present in pipeline, otherwise pick first available lead
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

  const savePipeline = async () => {
    if (!form.name.trim()) {
      toast.error('Pipeline name is required');
      return;
    }

    setSavingPipeline(true);
    try {
      if (editingPipeline) {
        await pipelinesApi.update(editingPipeline.id, form);
        toast.success('Pipeline updated');
      } else {
        const res = await pipelinesApi.create(form);
        toast.success('Pipeline created');
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

  // Options for Dropdowns
  const pipelineOptions = pipelines.map((p) => ({
    value: String(p.id),
    label: p.name,
  }));

  return (
    <div style={{ padding: 24, backgroundColor: '#fcfcfc', minHeight: '100vh', position: 'relative' }}>
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
          <Title order={2} fw={700} style={{ fontSize: 24, color: '#111111', letterSpacing: '-0.02em' }}>
            Pipelines
          </Title>
          <Text c="dimmed" size="sm" mt={2}>
            Manage your sales pipelines and stages in one place.
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
            style={{ width: 190, input: { cursor: 'pointer', fontWeight: 500 }, option: { cursor: 'pointer' } }}
          />

          {canManage && (
            <Button
              leftSection={<IconPlus size={15} />}
              onClick={openCreatePipeline}
              size="xs"
              radius="md"
              styles={primaryBtnStyle}
            >
              Add Pipeline
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Kanban & Pipeline Content */}
      {selectedPipeline ? (
        <div style={{ position: 'relative' }}>
          <LoadingOverlay visible={dataLoading} overlayProps={{ blur: 1 }} />

          {/* Active Pipeline Prominent Card Header */}
          <Paper
            p="sm"
            mb="md"
            radius="md"
            withBorder
            style={{
              borderColor: '#e5e7eb',
              backgroundColor: '#ffffff',
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
                  style={{
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  Pipeline
                </Badge>
                <Text fw={700} size="lg" style={{ color: '#111111', lineHeight: 1.2 }}>
                  {selectedPipeline.name}
                </Text>
              </Group>
              {selectedPipeline.description && (
                <Text size="xs" c="dimmed" mt={4} style={{ marginLeft: 2 }}>
                  {selectedPipeline.description}
                </Text>
              )}
            </div>

            {canManage && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button
                  leftSection={<IconPencil size={14} />}
                  size="xs"
                  radius="md"
                  onClick={() => openEditPipeline(selectedPipeline)}
                  styles={secondaryBtnStyle}
                >
                  Edit Pipeline
                </Button>

                <Button
                  leftSection={<IconPlus size={14} />}
                  size="xs"
                  radius="md"
                  onClick={() => openStageManager('create')}
                  styles={secondaryBtnStyle}
                >
                  Add Stage
                </Button>

                <Button
                  leftSection={<IconTrash size={14} />}
                  variant="subtle"
                  color="red"
                  size="xs"
                  radius="md"
                  onClick={() => setDeletePipeline(selectedPipeline)}
                  style={{
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                  }}
                >
                  Delete
                </Button>
              </div>
            )}
          </Paper>

          <KanbanBoard
            pipeline={selectedPipeline}
            stages={stages}
            leads={leads}
            selectedLeadId={selectedLeadId}
            canManage={canManage}
            onEditStage={handleEditStage}
            onDeleteStage={() => {}}
            onStagesReorder={handleStagesReorder}
            onDataChanged={() => loadPipelineData(selectedPipelineId)}
          />
        </div>
      ) : (
        !loading && (
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-8 text-center bg-white">
            <Text c="dimmed" size="sm">
              No pipelines available. Create one to get started!
            </Text>
            {canManage && (
              <Button
                mt="md"
                leftSection={<IconPlus size={15} />}
                onClick={openCreatePipeline}
                size="xs"
                styles={primaryBtnStyle}
              >
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

      {/* Pipeline Create/Edit Modal */}
      <Modal
        opened={pipelineModalOpen}
        onClose={() => setPipelineModalOpen(false)}
        title={editingPipeline ? 'Edit Pipeline' : 'Add Pipeline'}
        centered
        size="sm"
        styles={{ content: { borderRadius: 12 } }}
      >
        <Stack gap="sm">
          <TextInput
            label="Pipeline name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e?.target?.value ?? '' }))}
            placeholder="e.g. Sales Pipeline"
            required
            disabled={savingPipeline}
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e?.target?.value ?? '' }))}
            disabled={savingPipeline}
            rows={3}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button
              variant="default"
              onClick={() => setPipelineModalOpen(false)}
              disabled={savingPipeline}
              size="xs"
            >
              Cancel
            </Button>
            <Button
              onClick={savePipeline}
              loading={savingPipeline}
              size="xs"
              styles={primaryBtnStyle}
            >
              {editingPipeline ? 'Update' : 'Save'}
            </Button>
          </div>
        </Stack>
      </Modal>

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
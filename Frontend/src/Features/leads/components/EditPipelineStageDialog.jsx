import { useEffect, useState, useCallback } from 'react';
import {
  Modal,
  Button,
  Select,
  Stack,
  Text,
  Loader,
  Group,
  ActionIcon,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { pipelinesApi } from '@/Features/pipelines/api/pipelinesApi';
import { leadsApi } from '../api/leadsApi';
import { toast } from 'sonner';
import { useAuth } from '@/Features/auth/context/AuthContext';
import { ROLES } from '@/constants/roles';

export default function EditPipelineStageDialog({ opened, lead, onClose, onSuccess }) {
  const { user } = useAuth();
  const role = user?.role;
  const isRegularUser = role === ROLES.USER;

  const [pipelines, setPipelines] = useState([]);
  const [stages, setStages] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('');

  const [pipelinesLoading, setPipelinesLoading] = useState(false);
  const [stagesLoading, setStagesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Pipeline Form State
  const [showNewPipelineForm, setShowNewPipelineForm] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState('');
  const [newPipelineStages, setNewPipelineStages] = useState([{ name: '' }]);
  const [creatingPipeline, setCreatingPipeline] = useState(false);

  useEffect(() => {
    if (opened && lead) {
      setSelectedPipelineId(lead.pipelineId ? String(lead.pipelineId) : '');
      setSelectedStageId(lead.stageId ? String(lead.stageId) : '');
      setShowNewPipelineForm(false);
      setNewPipelineName('');
      setNewPipelineStages([{ name: '' }]);
    }
  }, [opened, lead]);

  const loadPipelines = useCallback(async () => {
    setPipelinesLoading(true);
    try {
      const res = await pipelinesApi.getAll();
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setPipelines(list);
    } catch (err) {
      console.warn('Failed to load pipelines:', err);
    } finally {
      setPipelinesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (opened) {
      loadPipelines();
    }
  }, [opened, loadPipelines]);

  const loadStages = useCallback(async (pipelineId) => {
    if (!pipelineId) {
      setStages([]);
      return;
    }
    setStagesLoading(true);
    try {
      const res = await pipelinesApi.getStages(pipelineId);
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setStages(list);
    } catch (err) {
      console.warn('Failed to load stages:', err);
      setStages([]);
    } finally {
      setStagesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPipelineId) {
      loadStages(selectedPipelineId);
    } else {
      setStages([]);
    }
  }, [selectedPipelineId, loadStages]);

  const handlePipelineSelect = (val) => {
    setSelectedPipelineId(val || '');
    setSelectedStageId('');
  };

  const handleCreatePipeline = async () => {
    if (!newPipelineName.trim()) {
      toast.error('Pipeline name is required');
      return;
    }
    const stageNames = newPipelineStages.map((s) => s.name.trim()).filter(Boolean);
    if (stageNames.length === 0) {
      toast.error('At least one stage is required');
      return;
    }

    setCreatingPipeline(true);
    try {
      const pipelineRes = await pipelinesApi.create({ name: newPipelineName.trim() });
      const newPipeline = pipelineRes?.data || pipelineRes;
      const pipelineId = newPipeline.id;

      for (let i = 0; i < stageNames.length; i++) {
        await pipelinesApi.createStage({
          name: stageNames[i],
          pipelineId,
          order: i + 1,
        });
      }

      toast.success(`Pipeline "${newPipelineName}" created successfully`);
      setShowNewPipelineForm(false);
      setNewPipelineName('');
      setNewPipelineStages([{ name: '' }]);

      await loadPipelines();
      setSelectedPipelineId(String(pipelineId));
    } catch (err) {
      toast.error(err?.message || 'Failed to create pipeline');
    } finally {
      setCreatingPipeline(false);
    }
  };

  const addStageField = () => {
    setNewPipelineStages([...newPipelineStages, { name: '' }]);
  };

  const removeStageField = (index) => {
    if (newPipelineStages.length <= 1) return;
    setNewPipelineStages(newPipelineStages.filter((_, i) => i !== index));
  };

  const updateStageName = (index, value) => {
    const updated = [...newPipelineStages];
    updated[index] = { name: value };
    setNewPipelineStages(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPipelineId || !selectedStageId) {
      toast.error('Please select both a pipeline and a stage');
      return;
    }

    setSubmitting(true);
    try {
      await leadsApi.update(lead.id, {
        pipelineId: Number(selectedPipelineId),
        stageId: Number(selectedStageId),
      });
      toast.success('Pipeline & stage updated successfully');
      onSuccess?.();
    } catch (err) {
      toast.error(err?.message || 'Failed to update pipeline and stage');
    } finally {
      setSubmitting(false);
    }
  };

  const pipelineOptions = pipelines.map((p) => ({ value: String(p.id), label: p.name }));
  const stageOptions = stages.map((s) => ({ value: String(s.id), label: s.name }));

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Pipeline & Stage" centered size="md" radius="lg">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {!showNewPipelineForm ? (
            <div>
              <Group gap="xs" align="end">
                <div style={{ flex: 1 }}>
                  <Select
                    label="Pipeline"
                    placeholder={pipelinesLoading ? 'Loading...' : 'Select a pipeline'}
                    data={pipelineOptions}
                    value={selectedPipelineId}
                    onChange={handlePipelineSelect}
                    disabled={pipelinesLoading || isRegularUser}
                    required
                    clearable
                    searchable
                  />
                </div>
                {!isRegularUser && (
                  <Tooltip label="Create new pipeline">
                    <ActionIcon
                      variant="light"
                      color="blue"
                      size="lg"
                      onClick={() => setShowNewPipelineForm(true)}
                      disabled={isRegularUser}
                    >
                      <IconPlus size={18} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>
              {pipelinesLoading && <Loader size="xs" mt={4} />}
            </div>
          ) : (
            <Stack gap="sm" p="sm" style={{ border: '1px solid #dee2e6', borderRadius: 8 }}>
              <Text fw={600} size="sm">Create New Pipeline</Text>
              <TextInput
                label="Pipeline Name"
                placeholder="e.g. Sales Pipeline"
                value={newPipelineName}
                onChange={(e) => setNewPipelineName(e.currentTarget.value)}
                required
                disabled={isRegularUser}
              />
              <Text size="xs" c="dimmed" fw={500}>Stages</Text>
              {newPipelineStages.map((stage, index) => (
                <Group key={index} gap="xs" align="end">
                  <TextInput
                    placeholder={`Stage ${index + 1} name`}
                    value={stage.name}
                    onChange={(e) => updateStageName(index, e.currentTarget.value)}
                    style={{ flex: 1 }}
                    disabled={isRegularUser}
                  />
                  {newPipelineStages.length > 1 && (
                    <ActionIcon
                      variant="light"
                      color="red"
                      size="lg"
                      onClick={() => removeStageField(index)}
                      disabled={isRegularUser}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  )}
                </Group>
              ))}
              <Button
                variant="subtle"
                color="gray"
                size="xs"
                leftSection={<IconPlus size={14} />}
                onClick={addStageField}
                disabled={isRegularUser}
              >
                Add stage
              </Button>
              <Group gap="xs">
                <Button
                  size="xs"
                  color="green"
                  onClick={handleCreatePipeline}
                  loading={creatingPipeline}
                  disabled={isRegularUser}
                >
                  Create Pipeline
                </Button>
                <Button
                  size="xs"
                  variant="subtle"
                  color="gray"
                  onClick={() => setShowNewPipelineForm(false)}
                >
                  Cancel
                </Button>
              </Group>
            </Stack>
          )}

          {selectedPipelineId && !showNewPipelineForm && (
            <Select
              label="Stage"
              placeholder={stagesLoading ? 'Loading stages...' : 'Select a stage'}
              data={stageOptions}
              value={selectedStageId}
              onChange={(val) => setSelectedStageId(val || '')}
              disabled={stagesLoading || stages.length === 0 || isRegularUser}
              required
              searchable
            />
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="!bg-black !text-white" 
              loading={submitting}
              disabled={isRegularUser}
            >
              Update Pipeline
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
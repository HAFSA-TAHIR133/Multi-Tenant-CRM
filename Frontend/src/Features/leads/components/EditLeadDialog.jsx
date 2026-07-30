import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Button, TextInput, Group, Select, Stack, Text, Loader, Divider, ActionIcon, Tooltip } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { leadsApi } from '../api/leadsApi';
import { pipelinesApi } from '@/Features/pipelines/api/pipelinesApi';
import leadSchema from '../schemas/leadSchema.js';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'open', label: 'Open' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'completed', label: 'Completed' },
];

export default function EditLeadDialog({ opened, lead, onClose, onSuccess }) {
  const form = useForm({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      title: '',
      contactName: '',
      email: '',
      phone: '',
      companyName: '',
      source: '',
      website: '',
      value: '',
      status: 'new',
      pipelineId: '',
      stageId: '',
    },
  });

  const { watch, setValue, reset } = form;
  const selectedPipelineId = watch('pipelineId');

  // Pipeline & Stage state
  const [pipelines, setPipelines] = useState([]);
  const [stages, setStages] = useState([]);
  const [pipelinesLoading, setPipelinesLoading] = useState(false);
  const [stagesLoading, setStagesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New pipeline creation state
  const [showNewPipelineForm, setShowNewPipelineForm] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState('');
  const [newPipelineStages, setNewPipelineStages] = useState([{ name: '' }]);
  const [creatingPipeline, setCreatingPipeline] = useState(false);

  // Reset form when lead changes
  useEffect(() => {
    if (opened && lead) {
      reset({
        title: lead.title || '',
        contactName: lead.contactName || '',
        email: lead.email || '',
        phone: lead.phone || '',
        companyName: lead.companyName || '',
        source: lead.source || '',
        website: lead.website || '',
        value: lead.value ? String(lead.value) : '',
        status: lead.status || 'new',
        pipelineId: lead.pipelineId ? String(lead.pipelineId) : '',
        stageId: lead.stageId ? String(lead.stageId) : '',
      });
      setShowNewPipelineForm(false);
      setNewPipelineName('');
      setNewPipelineStages([{ name: '' }]);
    }
  }, [opened, lead, reset]);

  // Load pipelines
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

  // Load stages when pipeline changes
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

  // Handle creating a new pipeline with stages
  const handleCreatePipeline = async () => {
    if (!newPipelineName.trim()) {
      toast.error('Pipeline name is required');
      return;
    }
    const stageNames = newPipelineStages
      .map((s) => s.name.trim())
      .filter(Boolean);
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
      setValue('pipelineId', String(pipelineId));
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

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        value: values.value ? Number(values.value) : undefined,
        pipelineId: Number(values.pipelineId),
        stageId: Number(values.stageId),
      };
      await leadsApi.update(lead.id, payload);
      toast.success('Lead updated successfully');
      onSuccess?.();
    } catch (err) {
      toast.error(err?.message || 'Failed to update lead');
    } finally {
      setSubmitting(false);
    }
  };

  const pipelineOptions = pipelines.map((p) => ({
    value: String(p.id),
    label: p.name,
  }));

  const stageOptions = stages.map((s) => ({
    value: String(s.id),
    label: s.name,
  }));

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Lead" centered size="lg">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Title"
            placeholder="e.g. Follow up with CEO"
            {...form.register('title')}
            error={form.formState.errors.title?.message}
            required
          />
          <TextInput
            label="Contact Name"
            placeholder="John Doe"
            {...form.register('contactName')}
            error={form.formState.errors.contactName?.message}
            required
          />
          <TextInput
            label="Email"
            placeholder="john@example.com"
            {...form.register('email')}
            error={form.formState.errors.email?.message}
            required
          />
          <TextInput
            label="Phone"
            placeholder="+1 234 567 890"
            {...form.register('phone')}
            error={form.formState.errors.phone?.message}
          />
          <TextInput
            label="Company"
            placeholder="Acme Inc."
            {...form.register('companyName')}
            error={form.formState.errors.companyName?.message}
          />
          <TextInput
            label="Source"
            placeholder="Website, Referral, etc."
            {...form.register('source')}
            error={form.formState.errors.source?.message}
          />
          <TextInput
            label="Website"
            placeholder="https://example.com"
            {...form.register('website')}
            error={form.formState.errors.website?.message}
          />
          <TextInput
            label="Estimated Value ($)"
            placeholder="1000"
            {...form.register('value')}
            error={form.formState.errors.value?.message}
          />
          <Select
            label="Status"
            data={STATUS_OPTIONS}
            value={form.watch('status')}
            onChange={(val) => setValue('status', val || 'new')}
            error={form.formState.errors.status?.message}
          />

          <Divider label="Pipeline Assignment" labelPosition="center" my="sm" />

          {/* Pipeline Selection */}
          {!showNewPipelineForm ? (
            <div>
              <Group gap="xs" align="end">
                <div style={{ flex: 1 }}>
                  <Select
                    label="Pipeline"
                    placeholder={pipelinesLoading ? 'Loading...' : 'Select a pipeline'}
                    data={pipelineOptions}
                    value={selectedPipelineId}
                    onChange={(val) => setValue('pipelineId', val || '')}
                    error={form.formState.errors.pipelineId?.message}
                    disabled={pipelinesLoading}
                    required
                    clearable
                    searchable
                    styles={{
                      input: { cursor: 'pointer' },
                      option: { cursor: 'pointer' },
                    }}
                  />
                </div>
                <Tooltip label="Create new pipeline">
                  <ActionIcon
                    variant="light"
                    color="blue"
                    size="lg"
                    onClick={() => setShowNewPipelineForm(true)}
                    mt={22}
                  >
                    <IconPlus size={18} />
                  </ActionIcon>
                </Tooltip>
              </Group>
              {pipelinesLoading && <Loader size="xs" mt={4} />}
            </div>
          ) : (
            /* New Pipeline Creation Form */
            <Stack gap="sm" p="sm" style={{ border: '1px solid #dee2e6', borderRadius: 8 }}>
              <Text fw={600} size="sm">Create New Pipeline</Text>
              <TextInput
                label="Pipeline Name"
                placeholder="e.g. Sales Pipeline"
                value={newPipelineName}
                onChange={(e) => setNewPipelineName(e.currentTarget.value)}
                required
              />
              <Text size="xs" c="dimmed" fw={500}>Stages</Text>
              {newPipelineStages.map((stage, index) => (
                <Group key={index} gap="xs" align="end">
                  <TextInput
                    placeholder={`Stage ${index + 1} name`}
                    value={stage.name}
                    onChange={(e) => updateStageName(index, e.currentTarget.value)}
                    style={{ flex: 1 }}
                  />
                  {newPipelineStages.length > 1 && (
                    <ActionIcon
                      variant="light"
                      color="red"
                      size="lg"
                      onClick={() => removeStageField(index)}
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
              >
                Add stage
              </Button>
              <Group gap="xs">
                <Button
                  size="xs"
                  color="green"
                  onClick={handleCreatePipeline}
                  loading={creatingPipeline}
                >
                  Create Pipeline
                </Button>
                <Button
                  size="xs"
                  variant="subtle"
                  color="gray"
                  onClick={() => {
                    setShowNewPipelineForm(false);
                    setNewPipelineName('');
                    setNewPipelineStages([{ name: '' }]);
                  }}
                >
                  Cancel
                </Button>
              </Group>
            </Stack>
          )}

          {/* Stage Selection */}
          {selectedPipelineId && !showNewPipelineForm && (
            <Select
              label="Stage"
              placeholder={stagesLoading ? 'Loading stages...' : 'Select a stage'}
              data={stageOptions}
              value={form.watch('stageId')}
              onChange={(val) => setValue('stageId', val || '')}
              error={form.formState.errors.stageId?.message}
              disabled={stagesLoading || stages.length === 0}
              required
              styles={{
                input: { cursor: 'pointer' },
                option: { cursor: 'pointer' },
              }}
            />
          )}

          <Divider my="sm" />

          <Group justify="flex-end">
            <Button variant="default" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" className="!bg-black !text-white" loading={submitting}>
              Update
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
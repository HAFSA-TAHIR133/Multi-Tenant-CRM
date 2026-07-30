import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Modal,
  Button,
  TextInput,
  Group,
  Select,
  Stack,
  Text,
  Loader,
  Divider,
  ActionIcon,
  Tooltip,
  Paper,
  Box,
  Popover,
  ColorPicker,
  Textarea,
} from '@mantine/core';
import { IconPlus, IconTrash, IconPalette } from '@tabler/icons-react';
import { leadsApi } from '../api/leadsApi';
import { pipelinesApi } from '@/Features/pipelines/api/pipelinesApi';
import leadSchema from '../schemas/leadSchema.js';
import { toast } from 'sonner';

// Helper functions for hex color validation and light/dark theme contrast
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

const blackBtnStyle = {
  root: {
    backgroundColor: '#111111',
    color: '#ffffff',
    border: '1px solid #111111',
    transition: 'all 0.3s ease',
    fontWeight: 500,
    '&:hover': {
      backgroundColor: '#ffffff',
      color: '#111111',
      border: '1px solid #111111',
    },
  },
};

// Reusable Stage Color Picker Component styled exactly like StageCard/DraggableStageCard
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
      <Text size="xs" fw={500}>
        Stage Color
      </Text>

      <Group gap="xs" align="center">
        {/* Interactive Spectrum Popover Trigger */}
        <Popover
          opened={popoverOpened}
          onChange={setPopoverOpened}
          width={220}
          position="bottom-start"
          withArrow
          shadow="md"
        >
          <Popover.Target>
            <Tooltip label="Click to open color spectrum" withArrow position="top">
              <button
                type="button"
                onClick={() => !disabled && setPopoverOpened((o) => !o)}
                disabled={disabled}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: current,
                  border: '1px solid #cbd5e1',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
                variant="light"
                fullWidth
                styles={blackBtnStyle}
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

        {/* Dynamic Color Preview Badge */}
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

const defaultValues = {
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
};

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

export default function AddLeadDialog({ opened, onClose, onSuccess }) {
  const form = useForm({
    resolver: zodResolver(leadSchema),
    defaultValues,
  });

  const { watch, setValue, reset } = form;
  const selectedPipelineId = watch('pipelineId');

  // Pipeline & Stage state
  const [pipelines, setPipelines] = useState([]);
  const [stages, setStages] = useState([]);
  const [pipelinesLoading, setPipelinesLoading] = useState(false);
  const [stagesLoading, setStagesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New pipeline creation state with color and description fields
  const [showNewPipelineForm, setShowNewPipelineForm] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState('');
  const [newPipelineStages, setNewPipelineStages] = useState([
    { name: '', description: '', color: '#111111' },
  ]);
  const [creatingPipeline, setCreatingPipeline] = useState(false);

  useEffect(() => {
    if (!opened) {
      reset(defaultValues);
      setShowNewPipelineForm(false);
      setNewPipelineName('');
      setNewPipelineStages([{ name: '', description: '', color: '#111111' }]);
      setStages([]);
    }
  }, [opened, reset]);

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
  const loadStages = useCallback(
    async (pipelineId) => {
      if (!pipelineId) {
        setStages([]);
        setValue('stageId', '');
        return;
      }
      setStagesLoading(true);
      try {
        const res = await pipelinesApi.getStages(pipelineId);
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setStages(list);
        // Auto-select first stage if none selected
        if (list.length > 0 && !form.getValues('stageId')) {
          setValue('stageId', String(list[0].id));
        }
      } catch (err) {
        console.warn('Failed to load stages:', err);
        setStages([]);
      } finally {
        setStagesLoading(false);
      }
    },
    [setValue, form]
  );

  useEffect(() => {
    if (selectedPipelineId) {
      loadStages(selectedPipelineId);
    } else {
      setStages([]);
      setValue('stageId', '');
    }
  }, [selectedPipelineId, loadStages, setValue]);

  // Handle creating a new pipeline with full stage parameters
  const handleCreatePipeline = async () => {
    if (!newPipelineName.trim()) {
      toast.error('Pipeline name is required');
      return;
    }

    const validStages = newPipelineStages
      .map((s) => ({
        name: s.name.trim(),
        description: s.description?.trim() || '',
        color: normalizeHex(s.color, '#111111'),
      }))
      .filter((s) => Boolean(s.name));

    if (validStages.length === 0) {
      toast.error('At least one stage name is required');
      return;
    }

    setCreatingPipeline(true);
    try {
      // Create the pipeline
      const pipelineRes = await pipelinesApi.create({ name: newPipelineName.trim() });
      const newPipeline = pipelineRes?.data || pipelineRes;
      const pipelineId = newPipeline.id;

      // Create each stage passing color, description, and order
      for (let i = 0; i < validStages.length; i++) {
        await pipelinesApi.createStage({
          name: validStages[i].name,
          description: validStages[i].description,
          color: validStages[i].color,
          pipelineId,
          order: i + 1,
        });
      }

      toast.success(`Pipeline "${newPipelineName}" created successfully`);
      setShowNewPipelineForm(false);
      setNewPipelineName('');
      setNewPipelineStages([{ name: '', description: '', color: '#111111' }]);

      // Reload pipelines and select the new one
      await loadPipelines();
      setValue('pipelineId', String(pipelineId));
    } catch (err) {
      toast.error(err?.message || 'Failed to create pipeline');
    } finally {
      setCreatingPipeline(false);
    }
  };

  const addStageField = () => {
    setNewPipelineStages([
      ...newPipelineStages,
      { name: '', description: '', color: '#111111' },
    ]);
  };

  const removeStageField = (index) => {
    if (newPipelineStages.length <= 1) return;
    setNewPipelineStages(newPipelineStages.filter((_, i) => i !== index));
  };

  const updateStageField = (index, key, value) => {
    const updated = [...newPipelineStages];
    updated[index] = { ...updated[index], [key]: value };
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
      await leadsApi.create(payload);
      toast.success('Lead created successfully');
      onSuccess?.();
    } catch (err) {
      toast.error(err?.message || 'Failed to create lead');
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
    <Modal opened={opened} onClose={onClose} title="Add Lead" centered size="lg">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Title"
            placeholder="e.g. VP of Sales/Software Engineer"
            {...form.register('title')}
            error={form.formState.errors.title?.message}
            required
          />
          <TextInput
            label="Contact Name"
            placeholder="Yousaf Zain"
            {...form.register('contactName')}
            error={form.formState.errors.contactName?.message}
            required
          />
          <TextInput
            label="Email"
            placeholder="yousaf@example.com"
            {...form.register('email')}
            error={form.formState.errors.email?.message}
            required
          />
          <TextInput
            label="Phone"
            placeholder="+92 328 1234567"
            {...form.register('phone')}
            error={form.formState.errors.phone?.message}
          />
          <TextInput
            label="Company"
            placeholder="Starlight Logistics"
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
            label="Estimated Value:($)"
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
            /* New Pipeline Creation Form Styled with Cards & Interactive Color Pickers */
            <Stack gap="sm" p="sm" style={{ border: '1px solid #dee2e6', borderRadius: 8 }}>
              <Text fw={600} size="sm">
                Create New Pipeline
              </Text>
              <TextInput
                label="Pipeline Name"
                placeholder="e.g. Sales Pipeline"
                value={newPipelineName}
                onChange={(e) => setNewPipelineName(e.currentTarget.value)}
                required
              />

              <Divider my={4} />

              <Text size="xs" c="dimmed" fw={600} style={{ textTransform: 'uppercase' }}>
                Pipeline Stages
              </Text>

              {newPipelineStages.map((stage, index) => {
                const currentColor = stage.color || '#111111';
                return (
                  <Paper
                    key={index}
                    p="sm"
                    style={{
                      border: '1px solid #e2e8f0',
                      background: '#fff',
                      borderRadius: 8,
                      borderLeft: `4px solid ${currentColor}`,
                    }}
                  >
                    <Stack gap="xs">
                      <Group justify="space-between" align="center" wrap="nowrap">
                        <Group gap="xs" align="center">
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              backgroundColor: currentColor,
                              flexShrink: 0,
                            }}
                          />
                          <Text fw={600} size="xs" c="dark">
                            Stage {index + 1}
                          </Text>
                        </Group>

                        {newPipelineStages.length > 1 && (
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="sm"
                            onClick={() => removeStageField(index)}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        )}
                      </Group>

                      <TextInput
                        label="Stage Name"
                        placeholder={`e.g. Stage ${index + 1}`}
                        value={stage.name}
                        onChange={(e) => updateStageField(index, 'name', e.currentTarget.value)}
                        size="xs"
                        required
                      />

                      <Textarea
                        label="Description"
                        placeholder="Optional details about this stage..."
                        value={stage.description}
                        onChange={(e) => updateStageField(index, 'description', e.currentTarget.value)}
                        size="xs"
                        rows={2}
                      />

                      <InteractiveColorPicker
                        value={currentColor}
                        onChange={(val) => updateStageField(index, 'color', val)}
                        disabled={creatingPipeline}
                      />
                    </Stack>
                  </Paper>
                );
              })}

              <Button
                variant="subtle"
                color="gray"
                size="xs"
                leftSection={<IconPlus size={14} />}
                onClick={addStageField}
              >
                Add another stage
              </Button>

              <Group gap="xs" mt="xs">
                <Button
                  size="xs"
                  styles={{
                    root: {
                      backgroundColor: '#111111',
                      color: '#ffffff',
                      transition: 'background-color 0.2s ease',
                      '&:hover': {
                        backgroundColor: '#ffffff',
                        color:"#111111"
                      },
                    },
                  }}
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
                    setNewPipelineStages([{ name: '', description: '', color: '#111111' }]);
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
              Create
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { leadsApi } from '../api/leadsApi';
import { pipelinesApi } from '@/Features/pipelines/api/pipelinesApi';
import { toast } from 'sonner';
import {
  Loader,
  Center,
  Stack,
  Title,
  Text,
  Card,
  Group,
  Badge,
  SimpleGrid,
  Timeline,
  UnstyledButton,
  ThemeIcon,
  Divider,
  Button,
  Select,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconMail,
  IconPhone,
  IconBuilding,
  IconShare, 
  IconCurrencyDollar,
  IconUser,
  IconGitBranch,
  IconLayersSubtract,
  IconHistory,
  IconClock,
} from '@tabler/icons-react';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'completed', label: 'Completed' },
];

const STATUS_COLORS = {
  new: 'blue',
  contacted: 'violet',
  qualified: 'cyan',
  proposal: 'orange',
  won: 'green',
  lost: 'red',
  completed: 'teal',
};

export default function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pipeline & Stage State
  const [pipelines, setPipelines] = useState([]);
  const [stages, setStages] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState(null);
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [pipelinesLoading, setPipelinesLoading] = useState(false);
  const [stagesLoading, setStagesLoading] = useState(false);
  const [savingPipeline, setSavingPipeline] = useState(false);
  const [savingStage, setSavingStage] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  // Fetch lead and pipelines
  const loadLead = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const leadRes = await leadsApi.getById(id);
      const extractedLead = leadRes?.data?.data || leadRes?.data || leadRes || null;
      
      if (!extractedLead) {
        throw new Error('Lead data not found');
      }
      setLead(extractedLead);
      setSelectedPipelineId(extractedLead.pipelineId || null);
      setSelectedStageId(extractedLead.stageId || null);

      // Fetch history separately
      try {
        const historyRes = await leadsApi.getHistory(id);
        const extractedHistory =
          Array.isArray(historyRes) ? historyRes :
          Array.isArray(historyRes?.data) ? historyRes.data :
          Array.isArray(historyRes?.data?.data) ? historyRes.data.data :
          [];
        setHistory(extractedHistory);
      } catch (hErr) {
        console.warn('Failed to fetch lead history:', hErr);
        setHistory([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load lead details');
    } finally {
      setLoading(false);
    }
  }, [id]);

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

  // Load stages for selected pipeline
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
    loadLead();
    loadPipelines();
  }, [loadLead, loadPipelines]);

  // When pipeline changes (for dropdown selection), load stages
  useEffect(() => {
    if (selectedPipelineId) {
      loadStages(selectedPipelineId);
    } else {
      setStages([]);
    }
  }, [selectedPipelineId, loadStages]);

  // When lead has a pipeline, load stages for it
  useEffect(() => {
    if (lead?.pipelineId) {
      loadStages(lead.pipelineId);
    }
  }, [lead?.pipelineId, loadStages]);

  // Handle pipeline assignment
  const handlePipelineChange = async (pipelineIdStr) => {
    if (!pipelineIdStr) return;
    const newPipelineId = Number(pipelineIdStr);
    setSavingPipeline(true);
    try {
      await pipelinesApi.assignLeadToPipeline(newPipelineId, Number(id));
      setSelectedPipelineId(newPipelineId);
      setSelectedStageId(null);
      toast.success('Pipeline assigned successfully');
      // Reload lead to get updated data
      await loadLead();
    } catch (err) {
      toast.error(err?.message || 'Failed to assign pipeline');
    } finally {
      setSavingPipeline(false);
    }
  };

  // Handle stage change
  const handleStageChange = async (stageIdStr) => {
    if (!stageIdStr) return;
    const newStageId = Number(stageIdStr);
    setSavingStage(true);
    try {
      await leadsApi.updateStage(id, newStageId);
      setSelectedStageId(newStageId);
      toast.success('Stage updated successfully');
      await loadLead();
    } catch (err) {
      toast.error(err?.message || 'Failed to update stage');
    } finally {
      setSavingStage(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (status) => {
    if (!status) return;
    setSavingStatus(true);
    try {
      await leadsApi.updateStatus(id, status);
      toast.success('Status updated successfully');
      await loadLead();
    } catch (err) {
      toast.error(err?.message || 'Failed to update status');
    } finally {
      setSavingStatus(false);
    }
  };

  if (loading) {
    return (
      <Center h={400}>
        <Loader type="dots" size="lg" color="blue" />
      </Center>
    );
  }

  if (error || !lead) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card withBorder radius="md" p="xl" className="border-red-200 bg-red-50/50">
          <Stack gap="sm">
            <Title order={4} className="text-red-700">
              Unable to load lead
            </Title>
            <Text size="sm" className="text-red-600">
              {error || 'Lead record does not exist or was deleted.'}
            </Text>
            <Button
              variant="outline"
              color="red"
              size="xs"
              className="w-fit"
              onClick={() => navigate('/leads')}
            >
              Go to Leads list
            </Button>
          </Stack>
        </Card>
      </div>
    );
  }

  const formattedRevenue =
    lead.value != null
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
          lead.value
        )
      : '-';

  const pipelineOptions = pipelines.map((p) => ({
    value: String(p.id),
    label: p.name,
  }));

  const stageOptions = stages.map((s) => ({
    value: String(s.id),
    label: s.name,
  }));

  const currentStatus = lead.status || 'new';
  const statusColor = STATUS_COLORS[currentStatus.toLowerCase()] || 'gray';

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Light & Dim Back Button */}
      <div>
        <UnstyledButton
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors group cursor-pointer"
        >
          <IconArrowLeft
            size={16}
            className="transition-transform group-hover:-translate-x-1 text-slate-400 group-hover:text-slate-700"
          />
          <Text size="xs" fw={400} c="dimmed" className="group-hover:text-slate-800">
            Go to previous
          </Text>
        </UnstyledButton>
      </div>

      {/* Main Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Title order={2} className="text-slate-900 font-bold tracking-tight">
            {lead.contactName || 'Unnamed Lead'}
          </Title>
          {lead.companyName && (
            <Text size="sm" c="dimmed" mt={2}>
              {lead.companyName}
            </Text>
          )}
        </div>

        {/* Status Dropdown */}
        <Group gap="sm">
          <Select
            label="Status"
            placeholder="Select status"
            data={STATUS_OPTIONS}
            value={currentStatus}
            onChange={handleStatusChange}
            size="xs"
            style={{ width: 160 }}
            disabled={savingStatus}
            styles={{
              input: { cursor: 'pointer' },
              option: { cursor: 'pointer' },
            }}
          />
          {savingStatus && <Loader size="xs" />}
        </Group>
      </div>

      {/* Details Grid */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        {/* Contact Info Card */}
        <Card withBorder radius="lg" p="xl" className="shadow-xs bg-white">
          <Group justify="space-between" mb="md">
            <Text fw={700} size="md" className="text-slate-800">
              Contact Details
            </Text>
            <ThemeIcon variant="light" color="blue" radius="md">
              <IconUser size={18} />
            </ThemeIcon>
          </Group>
          <Divider mb="lg" />

          <Stack gap="md">
            <div className="flex items-center gap-3">
              <ThemeIcon variant="subtle" color="gray" size="sm">
                <IconMail size={16} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">Email Address</Text>
                <Text size="sm" fw={500} className="text-slate-900">
                  {lead.email ? (
                    <a href={`mailto:${lead.email}`} className="hover:underline text-blue-600">
                      {lead.email}
                    </a>
                  ) : ('-')}
                </Text>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeIcon variant="subtle" color="gray" size="sm">
                <IconPhone size={16} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">Phone Number</Text>
                <Text size="sm" fw={500} className="text-slate-900">{lead.phone || '-'}</Text>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeIcon variant="subtle" color="gray" size="sm">
                <IconBuilding size={16} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">Company</Text>
                <Text size="sm" fw={500} className="text-slate-900">{lead.companyName || '-'}</Text>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeIcon variant="subtle" color="gray" size="sm">
                <IconShare size={16} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">Lead Source</Text>
                <Badge variant="outline" color="gray" size="sm" className="capitalize mt-0.5">
                  {lead.source || 'Direct'}
                </Badge>
              </div>
            </div>
          </Stack>
        </Card>

        {/* Pipeline & Assignment Card */}
        <Card withBorder radius="lg" p="xl" className="shadow-xs bg-white">
          <Group justify="space-between" mb="md">
            <Text fw={700} size="md" className="text-slate-800">
              Pipeline & Stage
            </Text>
            <ThemeIcon variant="light" color="green" radius="md">
              <IconGitBranch size={18} />
            </ThemeIcon>
          </Group>
          <Divider mb="lg" />

          <Stack gap="md">
            {/* Pipeline Selection */}
            <div className="flex items-start gap-3">
              <ThemeIcon variant="subtle" color="gray" size="sm" mt={4}>
                <IconGitBranch size={16} />
              </ThemeIcon>
              <div className="flex-1">
                <Text size="xs" c="dimmed" mb={4}>Pipeline</Text>
                {lead.pipelineId ? (
                  <Group gap="sm">
                    <Badge variant="light" color="green" size="lg" radius="sm">
                      {lead.pipeline?.name || `Pipeline #${lead.pipelineId}`}
                    </Badge>
                    <Select
                      placeholder="Change pipeline"
                      data={pipelineOptions}
                      value={String(selectedPipelineId)}
                      onChange={handlePipelineChange}
                      size="xs"
                      style={{ width: 160 }}
                      disabled={savingPipeline || pipelinesLoading}
                      clearable={false}
                      styles={{
                        input: { cursor: 'pointer' },
                        option: { cursor: 'pointer' },
                      }}
                    />
                    {savingPipeline && <Loader size="xs" />}
                  </Group>
                ) : (
                  <Group gap="sm">
                    <Text size="sm" fw={500} className="text-slate-500">
                      No pipeline assigned
                    </Text>
                    <Select
                      placeholder="Select a pipeline"
                      data={pipelineOptions}
                      value={null}
                      onChange={handlePipelineChange}
                      size="xs"
                      style={{ width: 200 }}
                      disabled={savingPipeline || pipelinesLoading}
                      styles={{
                        input: { cursor: 'pointer' },
                        option: { cursor: 'pointer' },
                      }}
                    />
                    {savingPipeline && <Loader size="xs" />}
                  </Group>
                )}
              </div>
            </div>

            {/* Stage Selection - only show when pipeline is assigned */}
            {lead.pipelineId && (
              <div className="flex items-start gap-3">
                <ThemeIcon variant="subtle" color="gray" size="sm" mt={4}>
                  <IconLayersSubtract size={16} />
                </ThemeIcon>
                <div className="flex-1">
                  <Text size="xs" c="dimmed" mb={4}>Stage</Text>
                  <Group gap="sm">
                    <Badge
                      variant="light"
                      color="blue"
                      size="lg"
                      radius="sm"
                      style={{ borderLeft: `4px solid ${lead.stage?.color || '#228be6'}` }}
                    >
                      {lead.stage?.name || `Stage #${lead.stageId}`}
                    </Badge>
                    <Select
                      placeholder="Change stage"
                      data={stageOptions}
                      value={selectedStageId ? String(selectedStageId) : null}
                      onChange={handleStageChange}
                      size="xs"
                      style={{ width: 160 }}
                      disabled={savingStage || stagesLoading || stages.length === 0}
                      clearable={false}
                      styles={{
                        input: { cursor: 'pointer' },
                        option: { cursor: 'pointer' },
                      }}
                    />
                    {savingStage && <Loader size="xs" />}
                  </Group>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <ThemeIcon variant="subtle" color="gray" size="sm">
                <IconCurrencyDollar size={16} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">Estimated Value / Revenue</Text>
                <Text size="sm" fw={700} className="text-emerald-600">
                  {formattedRevenue}
                </Text>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeIcon variant="subtle" color="gray" size="sm">
                <IconUser size={16} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">Assigned Rep</Text>
                <Text size="sm" fw={500} className="text-slate-900">
                  {lead.assignedUser?.name || lead.assignedUser?.fullName || 'Unassigned'}
                </Text>
              </div>
            </div>
          </Stack>
        </Card>
      </SimpleGrid>

      {/* History Card */}
      <Card withBorder radius="lg" p="xl" className="shadow-xs bg-white">
        <Group justify="space-between" mb="md">
          <Group gap="xs">
            <ThemeIcon variant="light" color="violet" radius="md">
              <IconHistory size={18} />
            </ThemeIcon>
            <Text fw={700} size="md" className="text-slate-800">
              Activity & History
            </Text>
          </Group>
          <Text size="xs" c="dimmed">
            {history.length} {history.length === 1 ? 'event' : 'events'} recorded
          </Text>
        </Group>
        <Divider mb="xl" />

        {history.length === 0 ? (
          <Center p="xl">
            <Text size="sm" c="dimmed">No audit history recorded for this lead yet.</Text>
          </Center>
        ) : (
          <Timeline active={history.length} bulletSize={24} lineWidth={2}>
            {history.map((item) => (
              <Timeline.Item
                key={item.id || Math.random()}
                bullet={<IconClock size={12} />}
                title={
                  <Text size="sm" fw={600} className="text-slate-800">
                    {item.description || item.action || 'Activity recorded'}
                  </Text>
                }
              >
                <Text size="xs" c="dimmed" className="mt-0.5">
                  <span className="font-medium text-slate-700">{item.fieldName || 'Field'}:</span>{' '}
                  <span className="line-through text-red-500">{String(item.oldValue ?? 'none')}</span>
                  {' → '}
                  <span className="font-semibold text-emerald-600">{String(item.newValue ?? 'none')}</span>
                </Text>
              </Timeline.Item>
            ))}
          </Timeline>
        )}
      </Card>
    </div>
  );
}
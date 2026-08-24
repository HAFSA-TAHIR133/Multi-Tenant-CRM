import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/Features/auth/context/AuthContext';
import { ROLES } from '@/constants/roles';
import { leadsApi } from '../api/leadsApi';
import { pipelinesApi } from '@/Features/pipelines/api/pipelinesApi';
import { toast } from 'sonner';

// Custom Dialog Components
import LeadHistoryDrawer from '../components/LeadHistoryDrawer';
import EditLeadDialog from '../components/EditLeadDialog';
import EditPipelineStageDialog from '../components/EditPipelineStageDialog';
import { LeadDocuments } from '../components/LeadDocuments';

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
  UnstyledButton,
  ThemeIcon,
  Divider,
  Button,
  Select,
  ActionIcon,
  Tooltip,
  Modal,
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
  IconHistory,
  IconPencil,
  IconTrash,
  IconAlertTriangle,
  IconLock,
} from '@tabler/icons-react';

const HISTORY_RANGE_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: 'week', label: 'Last week' },
  { value: 'month', label: 'Last month' },
];

export default function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role;

  const canChangePipeline = [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(role);
  const isRegularUser = role === ROLES.USER;

  const [lead, setLead] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyRange, setHistoryRange] = useState('all');

  // Dialog States
  const [historyDrawerOpened, setHistoryDrawerOpened] = useState(false);
  const [editLeadOpened, setEditLeadOpened] = useState(false);
  const [editPipelineOpened, setEditPipelineOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  // Pipeline & Stage state
  const [pipelines, setPipelines] = useState([]);
  const [stages, setStages] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState(null);
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [pipelinesLoading, setPipelinesLoading] = useState(false);
  const [stagesLoading, setStagesLoading] = useState(false);
  const [savingPipeline, setSavingPipeline] = useState(false);
  const [savingStage, setSavingStage] = useState(false);

  const loadHistory = useCallback(async () => {
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
    }
  }, [id]);

  const loadLead = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const leadRes = await leadsApi.getById(id);
      const extractedLead = leadRes?.data?.data || leadRes?.data || leadRes || null;

      if (!extractedLead) throw new Error('Lead data not found');

      setLead(extractedLead);
      setSelectedPipelineId(extractedLead.pipelineId || null);
      setSelectedStageId(extractedLead.stageId || null);

      await loadHistory();
    } catch (err) {
      setError(err.message || 'Failed to load lead details');
    } finally {
      setLoading(false);
    }
  }, [id, loadHistory]);

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

  // Only load full pipeline list for admins / super-admins
  useEffect(() => {
    loadLead();
    if (canChangePipeline) {
      loadPipelines();
    }
  }, [loadLead, loadPipelines, canChangePipeline]);

  // Only load stages list when user is allowed to change pipeline/stage
  useEffect(() => {
    if (selectedPipelineId && canChangePipeline) {
      loadStages(selectedPipelineId);
    } else {
      setStages([]);
    }
  }, [selectedPipelineId, loadStages, canChangePipeline]);

  const isClosed = ['closed', 'close'].includes(String(lead?.status || '').toLowerCase());

  const handlePipelineChange = async (pipelineIdStr) => {
    if (!canChangePipeline || !pipelineIdStr || isClosed) return;
    const newPipelineId = Number(pipelineIdStr);
    setSavingPipeline(true);
    try {
      await pipelinesApi.assignLeadToPipeline(newPipelineId, Number(id));
      setSelectedPipelineId(newPipelineId);
      setSelectedStageId(null);
      toast.success('Pipeline updated successfully');
      await loadLead();
    } catch (err) {
      toast.error(err?.message || 'Failed to assign pipeline');
    } finally {
      setSavingPipeline(false);
    }
  };

  const handleStageChange = async (stageIdStr) => {
    if (!stageIdStr || isClosed || isRegularUser) return;
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

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await leadsApi.delete(id);
      toast.success('Lead deleted successfully');
      setDeleteModalOpened(false);
      navigate('/admin/leads', { replace: true });
    } catch (err) {
      toast.error(err?.message || 'Failed to delete lead');
    } finally {
      setDeleting(false);
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
            <Title order={4} className="text-red-700">Unable to load lead</Title>
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
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(lead.value)
      : '-';

  const assignedRepName =
    (lead.assignedUser?.name && lead.assignedUser.name !== 'Undefined'
      ? lead.assignedUser.name
      : null) ||
    lead.assignedUser?.fullName ||
    lead.assignedUser?.email ||
    lead.assignedUserName ||
    'Unassigned';

  // Build options – fall back to the data already present on the lead object
  // so regular users still see the correct names without calling the failing APIs
  const pipelineOptions = canChangePipeline
    ? pipelines.map((p) => ({ value: String(p.id), label: p.name }))
    : lead?.pipeline
      ? [{ value: String(lead.pipelineId), label: lead.pipeline.name || '—' }]
      : [];

  const stageOptions =
    canChangePipeline && stages.length > 0
      ? stages.map((s) => ({ value: String(s.id), label: s.name }))
      : lead?.stage
        ? [{ value: String(lead.stageId), label: lead.stage.name || '—' }]
        : [];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <UnstyledButton
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 transition-all duration-200 group cursor-pointer border border-slate-200/60 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-white dark:border-slate-700/60"
        >
          <IconArrowLeft 
            size={15} 
            className="transition-transform duration-200 group-hover:-translate-x-1 text-slate-500 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white" 
          />
          <Text size="xs" fw={600} className="tracking-wide">Back to Leads</Text>
        </UnstyledButton>

        <Button
          variant="outline"
          color="gray"
          size="xs"
          leftSection={<IconHistory size={15} className="text-indigo-600" />}
          onClick={() => setHistoryDrawerOpened(true)}
          className="border-slate-300 shadow-xs hover:bg-slate-50"
        >
          Activity & History ({history.length})
        </Button>
      </div>

      {/* Header Info */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <Group gap="xs">
            <Title order={2} className="text-slate-900 font-bold tracking-tight dark:text-slate-100">
              {lead.contactName || 'Unnamed Lead'}
            </Title>
            {isClosed && (
              <Badge color="gray" variant="light" size="sm" leftSection={<IconLock size={12} />}>
                Closed (Locked)
              </Badge>
            )}
          </Group>
          {lead.companyName && (
            <Text size="sm" c="dimmed" mt={2}>
              {lead.companyName}
            </Text>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        {/* Contact Details Card */}
        <Card
          withBorder
          radius="lg"
          p="xl"
          className="shadow-xs bg-white dark:bg-slate-900 dark:border-slate-800"
        >
          <Group justify="space-between" mb="md">
            <Group gap="xs">
              <ThemeIcon variant="light" color="blue" radius="md">
                <IconUser size={18} />
              </ThemeIcon>
              <Text fw={600} size="md" className="text-slate-800 dark:text-slate-200">
                Contact Details
              </Text>
            </Group>
            <Group gap={4}>
              <Tooltip label={isClosed ? 'Lead is closed and cannot be edited' : 'Edit Contact Details'}>
                <div>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    radius="md"
                    disabled={isClosed}
                    onClick={() => setEditLeadOpened(true)}
                  >
                    <IconPencil size={16} />
                  </ActionIcon>
                </div>
              </Tooltip>
              <Tooltip label="Delete Lead">
                <div>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    radius="md"
                    onClick={() => setDeleteModalOpened(true)}
                    disabled={isRegularUser}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </div>
              </Tooltip>
            </Group>
          </Group>
          <Divider mb="lg" />

          <Stack gap="md">
            <div className="flex items-center gap-3">
              <ThemeIcon variant="subtle" color="gray" size="sm">
                <IconMail size={16} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">Email Address</Text>
                <Text size="sm" fw={500} className="text-slate-900 dark:text-slate-100">
                  {lead.email ? (
                    <a href={`mailto:${lead.email}`} className="hover:underline text-blue-600">
                      {lead.email}
                    </a>
                  ) : (
                    '-'
                  )}
                </Text>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeIcon variant="subtle" color="gray" size="sm">
                <IconPhone size={16} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">Phone Number</Text>
                <Text size="sm" fw={500} className="text-slate-900 dark:text-slate-100">
                  {lead.phone || '-'}
                </Text>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeIcon variant="subtle" color="gray" size="sm">
                <IconBuilding size={16} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">Company</Text>
                <Text size="sm" fw={500} className="text-slate-900 dark:text-slate-100">
                  {lead.companyName || '-'}
                </Text>
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

            <Divider my="2px" />

            <div className="flex items-center gap-3">
              <ThemeIcon variant="subtle" color="gray" size="sm">
                <IconUser size={16} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">Assigned Rep</Text>
                <Text size="sm" fw={500} className="text-slate-900 dark:text-slate-100">
                  {assignedRepName}
                </Text>
              </div>
            </div>

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
          </Stack>
        </Card>

        {/* Right Column */}
        <Stack gap="lg">
          <Card
            withBorder
            radius="lg"
            p="xl"
            className="shadow-xs bg-white dark:bg-slate-900 dark:border-slate-800"
          >
            <LeadDocuments leadId={id} isRegularUser={isRegularUser} />
          </Card>

          <Card
            withBorder
            radius="lg"
            p="xl"
            className="shadow-xs bg-white dark:bg-slate-900 dark:border-slate-800"
          >
            <Group justify="space-between" mb="md">
              <Group gap="xs">
                <ThemeIcon variant="light" color="green" radius="md">
                  <IconGitBranch size={18} />
                </ThemeIcon>
                <Text fw={600} size="md" className="text-slate-800 dark:text-slate-200">
                  Pipeline & Stage
                </Text>
              </Group>
              <Group gap={4}>
                <Tooltip label={isClosed ? 'Lead is closed and cannot be edited' : 'Edit Pipeline & Stage'}>
                  <div>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      radius="md"
                      disabled={isClosed || isRegularUser}
                      onClick={() => setEditPipelineOpened(true)}
                    >
                      <IconPencil size={16} />
                    </ActionIcon>
                  </div>
                </Tooltip>
              </Group>
            </Group>
            <Divider mb="lg" />

            <Stack gap="md">
              <SimpleGrid cols={2} spacing="md">
                <div>
                  <Text size="xs" fw={500} c="dimmed" mb={4}>Pipeline</Text>
                  <Select
                    placeholder="Select Pipeline"
                    data={pipelineOptions}
                    value={selectedPipelineId ? String(selectedPipelineId) : null}
                    onChange={handlePipelineChange}
                    size="sm"
                    disabled={
                      isClosed ||
                      !canChangePipeline ||
                      savingPipeline ||
                      pipelinesLoading
                    }
                    rightSection={savingPipeline && <Loader size="xs" />}
                  />
                </div>

                <div>
                  <Text size="xs" fw={500} c="dimmed" mb={4}>Stage</Text>
                  <Select
                    placeholder="Select Stage"
                    data={stageOptions}
                    value={selectedStageId ? String(selectedStageId) : null}
                    onChange={handleStageChange}
                    size="sm"
                    disabled={
                      isClosed ||
                      isRegularUser ||          // users can only VIEW the stage
                      savingStage ||
                      stagesLoading ||
                      stageOptions.length === 0
                    }
                    rightSection={savingStage && <Loader size="xs" />}
                  />
                </div>
              </SimpleGrid>
            </Stack>
          </Card>
        </Stack>
      </SimpleGrid>

      {/* History Drawer */}
      <LeadHistoryDrawer
        opened={historyDrawerOpened}
        onClose={() => setHistoryDrawerOpened(false)}
        history={history}
        historyRange={historyRange}
        setHistoryRange={setHistoryRange}
        HISTORY_RANGE_OPTIONS={HISTORY_RANGE_OPTIONS}
      />

      {/* Edit Lead Dialog */}
      <EditLeadDialog
        opened={editLeadOpened}
        onClose={() => setEditLeadOpened(false)}
        lead={lead}
        onSuccess={() => {
          setEditLeadOpened(false);
          loadLead();
        }}
      />

      <EditPipelineStageDialog
        opened={editPipelineOpened}
        onClose={() => setEditPipelineOpened(false)}
        lead={lead}
        onSuccess={() => {
          setEditPipelineOpened(false);
          loadLead();
        }}
      />

      {/* Delete Lead Confirmation */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => !deleting && setDeleteModalOpened(false)}
        centered
        radius="lg"
        padding="lg"
        withCloseButton={false}
        size="sm"
      >
        <Stack gap="md">
          <Group gap="sm" wrap="nowrap" align="flex-start">
            <ThemeIcon
              color="red"
              variant="light"
              size="lg"
              radius="md"
              className="shrink-0 mt-0.5"
            >
              <IconAlertTriangle size={20} />
            </ThemeIcon>
            <div>
              <Text fw={600} size="md" className="text-slate-900 dark:text-slate-100">
                Are you absolutely sure?
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                This action cannot be undone. This will permanently delete the lead
                <span className="font-semibold text-slate-700">
                  {' '}
                  {lead?.contactName || 'record'}{' '}
                </span>
                and remove its data from our servers.
              </Text>
            </div>
          </Group>

          <Group justify="end" gap="xs" mt="sm">
            <Button
              variant="default"
              size="xs"
              disabled={deleting}
              onClick={() => setDeleteModalOpened(false)}
            >
              Cancel
            </Button>
            <Button color="red" size="xs" loading={deleting} onClick={handleConfirmDelete}>
              Delete Lead
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
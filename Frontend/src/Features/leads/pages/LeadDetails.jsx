import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/Features/auth/context/AuthContext';
import { ROLES } from '@/constants/roles';
import { leadsApi } from '../api/leadsApi';
import { pipelinesApi } from '@/Features/pipelines/api/pipelinesApi';
import { toast } from 'sonner';
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
  UnstyledButton,
  ThemeIcon,
  Button,
  ActionIcon,
  Tooltip,
  Modal,
  Select,
  Avatar,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconMail,
  IconPhone,
  IconBuilding,
  IconShare,
  IconPencil,
  IconTrash,
  IconAlertTriangle,
  IconUser,
  IconHistory,
  IconGitBranch,
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
  const [historyDrawerOpened, setHistoryDrawerOpened] = useState(false);
  const [editLeadOpened, setEditLeadOpened] = useState(false);
  const [editPipelineOpened, setEditPipelineOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
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
      const extractedHistory = Array.isArray(historyRes)
        ? historyRes
        : Array.isArray(historyRes?.data)
          ? historyRes.data
          : Array.isArray(historyRes?.data?.data)
            ? historyRes.data.data
            : [];
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

  useEffect(() => {
    loadLead();
    if (canChangePipeline) {
      loadPipelines();
    }
  }, [loadLead, loadPipelines, canChangePipeline]);

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
        <Loader type="dots" size="lg" color="gray" />
      </Center>
    );
  }

  if (error || !lead) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card withBorder radius="md" p="xl" className="border-red-200 bg-red-50/50 dark:bg-red-950/30 dark:border-red-800">
          <Stack gap="sm">
            <Title order={4} className="text-red-700 dark:text-red-400">
              Unable to load lead
            </Title>
            <Text size="sm" className="text-red-600 dark:text-red-300">
              {error || 'Lead record does not exist or was deleted.'}
            </Text>
            <Button
              variant="outline"
              color="red"
              size="xs"
              className="w-fit cursor-pointer"
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

  const assignedRepInitials = assignedRepName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const contactInitial = (lead.contactName || 'L').charAt(0).toUpperCase();

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

  const currentStageName =
    lead?.stage?.name ||
    stageOptions.find((s) => s.value === String(selectedStageId))?.label ||
    '—';

  const currentPipelineName =
    lead?.pipeline?.name ||
    pipelineOptions.find((p) => p.value === String(selectedPipelineId))?.label ||
    '—';

  const sourceLabel = (lead.source || 'Direct').toUpperCase();

  return (
    <div className="min-h-screen bg-[#f8f9fb] dark:bg-slate-950">
      <div className="px-6 pt-5 pb-8 max-w-[1100px] mx-auto">
        {/* ===== BACK TO LEADS (proper top spacing) ===== */}
        <div className="mb-6">
          <UnstyledButton
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-[13px] text-slate-500 hover:!text-blue-700 dark:text-slate-400 dark:hover:!text-blue-700 transition-colors cursor-pointer"
          >
            <IconArrowLeft size={15} stroke={1.75} />
            Back to Leads
          </UnstyledButton>
        </div>

        {/* ===== HEADER: Name + Source (more attractive) ===== */}
        <div className="flex items-start justify-between flex-wrap gap-5 mb-6">
          <div className="flex items-center gap-4">
            {/* Avatar – neutral grey */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-lg font-semibold tracking-tight">
              {contactInitial}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-[22px] font-bold text-slate-900 dark:text-white tracking-tight leading-none m-0">
                  {lead.contactName || 'Unnamed Lead'}
                </h1>
                <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  {sourceLabel}
                </span>
              </div>
              <p className="mt-1.5 text-[13px] text-slate-500 dark:text-slate-400 m-0">
                {lead.contactName || 'Lead'}
                <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
                Lead
                <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
                {currentStageName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="default"
              size="sm"
              radius="md"
              leftSection={<IconPencil size={15} stroke={1.5} />}
              onClick={() => setEditLeadOpened(true)}
              disabled={isClosed}
              className="h-9 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium cursor-pointer"
            >
              Edit Lead
            </Button>
            <Button
              variant="default"
              size="sm"
              radius="md"
              leftSection={<IconHistory size={15} stroke={1.5} />}
              onClick={() => setHistoryDrawerOpened(true)}
              className="h-9 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium cursor-pointer"
            >
              Activity & History
              <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 px-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {history.length}
              </span>
            </Button>
          </div>
        </div>

        {/* ===== SUMMARY CARDS ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {/* Estimated Value */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl px-5 py-4 shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 m-0">
              Estimated Value
            </p>
            <p className="text-[22px] font-bold text-slate-900 dark:text-white tracking-tight m-0">
              {formattedRevenue}
            </p>
          </div>

          {/* Assigned Rep */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl px-5 py-4 shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 m-0">
              Assigned Rep
            </p>
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {assignedRepInitials}
              </div>
              <span className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">
                {assignedRepName}
              </span>
            </div>
          </div>

          {/* Current Stage */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl px-5 py-4 shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 m-0">
              Current Stage
            </p>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">
                {currentStageName}
              </span>
            </div>
          </div>
        </div>

        {/* ===== CONTACT DETAILS + PIPELINE & STAGE ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-5">
          {/* Contact Details */}
          <Card
            withBorder
            radius="xl"
            padding={0}
            className="lg:col-span-3 bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  <IconUser size={15} stroke={1.5} />
                </div>
                <Text fw={600} size="sm" className="text-slate-800 dark:text-slate-100">
                  Contact Details
                </Text>
              </div>
              <Group gap={4}>
                <Tooltip label="Edit contact" withArrow>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="sm"
                    radius="md"
                    disabled={isClosed}
                    onClick={() => setEditLeadOpened(true)}
                    className="cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    <IconPencil size={15} stroke={1.5} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label={isRegularUser ? 'You cannot delete leads' : 'Delete lead'} withArrow>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="sm"
                    radius="md"
                    disabled={isRegularUser}
                    onClick={() => setDeleteModalOpened(true)}
                    className="cursor-pointer"
                  >
                    <IconTrash size={15} stroke={1.5} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
              <div className="px-5 py-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <IconMail size={13} className="text-slate-400" stroke={1.5} />
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    Email Address
                  </span>
                </div>
                {lead.email ? (
                  <a
                    href={`mailto:${lead.email}`}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {lead.email}
                  </a>
                ) : (
                  <span className="text-sm text-slate-500">—</span>
                )}
              </div>

              <div className="px-5 py-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <IconPhone size={13} className="text-slate-400" stroke={1.5} />
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    Phone Number
                  </span>
                </div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {lead.phone || '—'}
                </span>
              </div>

              <div className="px-5 py-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <IconBuilding size={13} className="text-slate-400" stroke={1.5} />
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    Company
                  </span>
                </div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {lead.companyName || '—'}
                </span>
              </div>

              <div className="px-5 py-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <IconShare size={13} className="text-slate-400" stroke={1.5} />
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    Lead Source
                  </span>
                </div>
                <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  {sourceLabel}
                </span>
              </div>
            </div>
          </Card>

          {/* Pipeline & Stage */}
          <Card
            withBorder
            radius="xl"
            padding={0}
            className="lg:col-span-2 bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  <IconGitBranch size={15} stroke={1.5} />
                </div>
                <Text fw={600} size="sm" className="text-slate-800 dark:text-slate-100">
                  Pipeline & Stage
                </Text>
              </div>
              <Group gap={4}>
                <Tooltip label="Edit pipeline & stage" withArrow>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="sm"
                    radius="md"
                    disabled={isClosed || isRegularUser}
                    onClick={() => setEditPipelineOpened(true)}
                    className="cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    <IconPencil size={15} stroke={1.5} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label={isRegularUser ? 'You cannot delete leads' : 'Delete lead'} withArrow>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="sm"
                    radius="md"
                    disabled={isRegularUser}
                    onClick={() => setDeleteModalOpened(true)}
                    className="cursor-pointer"
                  >
                    <IconTrash size={15} stroke={1.5} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1.5 m-0">
                  Pipeline
                </p>
                <Select
                  data={pipelineOptions}
                  value={selectedPipelineId ? String(selectedPipelineId) : null}
                  onChange={handlePipelineChange}
                  placeholder="Select pipeline"
                  disabled={!canChangePipeline || isClosed || savingPipeline}
                  rightSection={pipelinesLoading || savingPipeline ? <Loader size={14} color="gray" /> : undefined}
                  radius="md"
                  size="sm"
                  classNames={{
                    input:
                      'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100',
                  }}
                  allowDeselect={false}
                />
              </div>

              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1.5 m-0">
                  Stage
                </p>
                <Select
                  data={stageOptions}
                  value={selectedStageId ? String(selectedStageId) : null}
                  onChange={handleStageChange}
                  placeholder="Select stage"
                  disabled={isClosed || isRegularUser || savingStage || !selectedPipelineId}
                  rightSection={stagesLoading || savingStage ? <Loader size={14} color="gray" /> : undefined}
                  radius="md"
                  size="sm"
                  classNames={{
                    input:
                      'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100',
                  }}
                  allowDeselect={false}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* ===== LEAD DOCUMENTS ===== */}
        <Card
          withBorder
          radius="xl"
          padding="lg"
          className="bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm"
        >
          <LeadDocuments leadId={id} isRegularUser={isRegularUser} />
        </Card>
      </div>

      {/* Dialogs */}
      <LeadHistoryDrawer
        opened={historyDrawerOpened}
        onClose={() => setHistoryDrawerOpened(false)}
        history={history}
        historyRange={historyRange}
        setHistoryRange={setHistoryRange}
        HISTORY_RANGE_OPTIONS={HISTORY_RANGE_OPTIONS}
      />

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
            <ThemeIcon color="red" variant="light" size="lg" radius="md" className="shrink-0 mt-0.5">
              <IconAlertTriangle size={20} />
            </ThemeIcon>
            <div>
              <Text fw={600} size="md">
                Are you absolutely sure?
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                This action cannot be undone. This will permanently delete the lead{' '}
                <span className="font-semibold">{lead?.contactName || 'record'}</span>.
              </Text>
            </div>
          </Group>
          <Group justify="end" gap="xs" mt="sm">
            <Button
              variant="default"
              size="xs"
              disabled={deleting}
              onClick={() => setDeleteModalOpened(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              color="red"
              size="xs"
              loading={deleting}
              onClick={handleConfirmDelete}
              className="cursor-pointer"
            >
              Delete Lead
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
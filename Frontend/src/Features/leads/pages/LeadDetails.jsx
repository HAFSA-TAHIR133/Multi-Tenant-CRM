import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { leadsApi } from '../api/leadsApi';
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

const STATUS_COLORS = {
  open: 'blue',
  qualified: 'cyan',
  contacted: 'violet',
  won: 'green',
  lost: 'red',
};

export default function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        // Load lead first so history errors don't block the main lead view
        const leadRes = await leadsApi.getById(id);
        const extractedLead = leadRes?.data?.data || leadRes?.data || leadRes || null;
        
        if (!extractedLead) {
          throw new Error('Lead data not found');
        }
        setLead(extractedLead);

        // Fetch history separately to safely catch history endpoint errors
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
    };

    load();
  }, [id]);

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
      <div className="flex items-center justify-between">
        <div>
          <Title order={2} className="text-slate-900 font-bold tracking-tight">
            {lead.contactName || 'Unnamed Lead'}
          </Title>
        </div>

        <Badge
          size="lg"
          variant="light"
          color={STATUS_COLORS[lead.status?.toLowerCase()] || 'gray'}
          className="capitalize px-4 py-3"
        >
          {lead.status || 'Unknown Status'}
        </Badge>
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
              Pipeline & Value
            </Text>
            <ThemeIcon variant="light" color="green" radius="md">
              <IconCurrencyDollar size={18} />
            </ThemeIcon>
          </Group>
          <Divider mb="lg" />

          <Stack gap="md">
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

            <div className="flex items-center gap-3">
              <ThemeIcon variant="subtle" color="gray" size="sm">
                <IconGitBranch size={16} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">Pipeline</Text>
                <Text size="sm" fw={500} className="text-slate-900">
                  {lead.pipeline?.name || 'Default Pipeline'}
                </Text>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeIcon variant="subtle" color="gray" size="sm">
                <IconLayersSubtract size={16} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">Stage</Text>
                <Text size="sm" fw={500} className="text-slate-900">
                  {lead.stage?.name || '-'}
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
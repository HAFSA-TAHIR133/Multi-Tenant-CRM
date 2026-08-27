import React from 'react';
import {
  Drawer,
  Stack,
  Group,
  Text,
  Badge,
  Select,
  Center,
  Divider,
  Paper,
  Box,
} from '@mantine/core';
import { IconArrowRight, IconHistory, IconClock } from '@tabler/icons-react';
import { formatDate, formatRelativeTime } from '@/lib/dateFormatter';

const ACTION_COLORS = {
  CREATE: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
};

const FIELD_LABELS = {
  title: 'Title',
  companyName: 'Company',
  contactName: 'Contact Name',
  email: 'Email',
  phone: 'Phone',
  website: 'Website',
  value: 'Value',
  source: 'Source',
  status: 'Status',
  stageId: 'Stage',
  pipelineId: 'Pipeline',
  assignedUserId: 'Assigned User',
};

const getActivityTitle = (item) => {
  if (item.action === 'CREATE') return 'Lead created';
  if (item.action === 'DELETE') return 'Lead deleted';
  const label = FIELD_LABELS[item.fieldName] || item.fieldName;
  if (!label) return item.description || 'Lead updated';
  return `${label} updated`;
};

const getChangeValue = (item, key) => {
  const labelKey = key === 'oldValue' ? 'oldValueLabel' : 'newValueLabel';
  const label = item[labelKey];
  if (label !== undefined && label !== null) return String(label);
  const raw = item[key];
  if (raw === undefined || raw === null || typeof raw === 'object') return null;
  return String(raw);
};

const ChangeDisplay = ({ item }) => {
  if (item.action === 'CREATE') {
    return (
      <Badge size="sm" variant="light" color="green" radius="sm">
        Lead record created
      </Badge>
    );
  }

  const oldValue = getChangeValue(item, 'oldValue');
  const newValue = getChangeValue(item, 'newValue');

  if (oldValue === null && newValue === null) {
    return (
      <Text size="xs" c="dimmed">
        —
      </Text>
    );
  }

  return (
    <Group gap={6} wrap="nowrap" align="center">
      <Text
        size="xs"
        className="line-through text-slate-400 dark:text-slate-500 max-w-[140px] truncate"
        title={oldValue ?? 'none'}
      >
        {oldValue ?? 'none'}
      </Text>
      <IconArrowRight size={12} className="text-slate-400 shrink-0" />
      <Text
        size="xs"
        fw={600}
        className="text-emerald-600 dark:text-emerald-400 max-w-[140px] truncate"
        title={newValue ?? 'none'}
      >
        {newValue ?? 'none'}
      </Text>
    </Group>
  );
};

export default function LeadHistoryDrawer({
  opened,
  onClose,
  history = [],
  historyRange,
  setHistoryRange,
  HISTORY_RANGE_OPTIONS,
}) {
  const filteredHistory = React.useMemo(() => {
    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
    const cutoff =
      historyRange === 'week'
        ? Date.now() - WEEK_MS
        : historyRange === 'month'
        ? Date.now() - MONTH_MS
        : null;

    return cutoff === null
      ? history
      : history.filter((item) => new Date(item.createdAt).getTime() >= cutoff);
  }, [history, historyRange]);

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="lg"
      padding="lg"
      title={
        <Group gap="xs">
          <IconHistory size={20} className="text-slate-500" />
          <Text fw={700} size="lg" className="text-slate-900 dark:text-slate-100">
            Activity & History
          </Text>
        </Group>
      }
    >
      <Stack gap="md" className="h-full">
        {/* Filter bar */}
        <Group justify="space-between" align="center">
          <Select
            aria-label="History range"
            size="xs"
            value={historyRange}
            onChange={(val) => setHistoryRange(val || 'all')}
            data={HISTORY_RANGE_OPTIONS}
            style={{ width: 140 }}
            radius="md"
          />
          <Text size="xs" c="dimmed">
            Showing {filteredHistory.length} of {history.length} events
          </Text>
        </Group>

        <Divider />

        {filteredHistory.length === 0 ? (
          <Center className="flex-1 py-16">
            <Stack align="center" gap="xs">
              <IconClock size={36} className="text-slate-300 dark:text-slate-600" />
              <Text size="sm" c="dimmed" ta="center">
                No history events recorded for this range.
              </Text>
            </Stack>
          </Center>
        ) : (
          <Box className="overflow-y-auto max-h-[calc(100vh-180px)] pr-1">
            <Stack gap="sm">
              {filteredHistory.map((item, index) => {
                const actorName =
                  item.user?.name ||
                  item.changedByUser?.name ||
                  item.user?.email ||
                  'System';

                return (
                  <Paper
                    key={item.id || `${item.createdAt}-${item.action}-${index}`}
                    withBorder
                    radius="md"
                    p="sm"
                    className="border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
                  >
                    <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
                      {/* Left: action + title */}
                      <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                        <Group gap={6} wrap="nowrap">
                          <Badge
                            size="xs"
                            variant="light"
                            color={ACTION_COLORS[item.action] || 'gray'}
                            radius="sm"
                          >
                            {item.action || 'EVENT'}
                          </Badge>
                          <Text
                            size="sm"
                            fw={600}
                            className="text-slate-800 dark:text-slate-100 truncate"
                          >
                            {getActivityTitle(item)}
                          </Text>
                        </Group>

                        {/* Changes */}
                        <Box className="mt-1">
                          <ChangeDisplay item={item} />
                        </Box>

                        {/* Actor */}
                        <Text size="xs" c="dimmed" className="mt-1">
                          by {actorName}
                        </Text>
                      </Stack>

                      {/* Right: timestamp */}
                      <Stack gap={0} align="flex-end" style={{ flexShrink: 0 }}>
                        <Text size="xs" fw={500} className="text-slate-600 dark:text-slate-300">
                          {formatDate(item.createdAt, {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {formatRelativeTime(item.createdAt)}
                        </Text>
                      </Stack>
                    </Group>
                  </Paper>
                );
              })}
            </Stack>
          </Box>
        )}
      </Stack>
    </Drawer>
  );
}
import React from 'react';
import {
  Drawer,
  Stack,
  Group,
  Text,
  Badge,
  Table,
  Select,
  Center,
  Divider,
} from '@mantine/core';
import { IconArrowRight, IconHistory } from '@tabler/icons-react';
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

const getChangeCell = (item) => {
  if (item.action === 'CREATE') {
    return (
      <Badge size="sm" variant="light" color="green">
        Lead record created
      </Badge>
    );
  }

  const oldValue = getChangeValue(item, 'oldValue');
  const newValue = getChangeValue(item, 'newValue');

  if (oldValue === null && newValue === null) {
    return <Text size="xs" c="dimmed">—</Text>;
  }

  return (
    <Group gap={4} wrap="wrap">
      <Text size="xs" className="line-through text-slate-400">
        {oldValue ?? 'none'}
      </Text>
      <IconArrowRight size={12} className="text-slate-400 shrink-0" />
      <Text size="xs" fw={600} className="text-emerald-600">
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
          <IconHistory size={20} className="text-indigo-600" />
          <Text fw={700} size="lg" className="text-slate-900 dark:text-slate-100">
            Activity & History
          </Text>
        </Group>
      }
    >
      <Stack gap="md" className="h-full">
        <Group justify="space-between" align="center">
          <Select
            aria-label="History range"
            size="xs"
            value={historyRange}
            onChange={(val) => setHistoryRange(val || 'all')}
            data={HISTORY_RANGE_OPTIONS}
            style={{ width: 140 }}
          />
          <Text size="xs" c="dimmed">
            Showing {filteredHistory.length} of {history.length} events
          </Text>
        </Group>

        <Divider />

        {filteredHistory.length === 0 ? (
          <Center p="xl">
            <Text size="sm" c="dimmed">
              No history events recorded for this range.
            </Text>
          </Center>
        ) : (
          <div className="overflow-y-auto max-h-[calc(100vh-180px)] rounded-lg border border-slate-200 dark:border-slate-800">
            <Table highlightOnHover verticalSpacing="xs" horizontalSpacing="sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 dark:bg-slate-800/50 dark:border-slate-800">
                  <th className="text-[11px] font-semibold text-slate-500 uppercase py-2 dark:text-slate-400">Activity</th>
                  <th className="text-[11px] font-semibold text-slate-500 uppercase py-2 dark:text-slate-400">User</th>
                  <th className="text-[11px] font-semibold text-slate-500 uppercase py-2 dark:text-slate-400">Changes</th>
                  <th className="text-[11px] font-semibold text-slate-500 uppercase py-2 dark:text-slate-400">When</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => {
                  const actorName =
                    item.user?.name ||
                    item.changedByUser?.name ||
                    item.user?.email ||
                    'System';

                  return (
                    <tr key={item.id || `${item.createdAt}-${item.action}`} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2.5">
                        <Stack gap={2}>
                          <Badge
                            size="xs"
                            variant="light"
                            color={ACTION_COLORS[item.action] || 'gray'}
                            className="w-fit"
                          >
                            {item.action || 'EVENT'}
                          </Badge>
                          <Text size="xs" fw={500} className="text-slate-800 dark:text-slate-200">
                            {getActivityTitle(item)}
                          </Text>
                        </Stack>
                      </td>
                      <td className="py-2.5">
                        <Text size="xs" fw={500} className="text-slate-700 dark:text-slate-300">
                          {actorName}
                        </Text>
                      </td>
                      <td className="py-2.5">{getChangeCell(item)}</td>
                      <td className="py-2.5">
                        <Text size="xs" className="text-slate-600 dark:text-slate-400">
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </Stack>
    </Drawer>
  );
}
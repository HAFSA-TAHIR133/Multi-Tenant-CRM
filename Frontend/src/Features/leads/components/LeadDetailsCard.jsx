import { Card, Text, Group, Badge, Stack, Divider, Timeline } from '@mantine/core';

export default function LeadDetailsCard({ lead, history = [] }) {
  if (!lead) {
    return (
      <Card withBorder radius="md" p="lg">
        <Text c="dimmed">Select a lead to see details.</Text>
      </Card>
    );
  }

  return (
    <Card withBorder radius="md" p="lg">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start">
          <div>
            <Text fw={700} size="lg">
              {lead.name}
            </Text>
            <Text c="dimmed" size="sm">
              {lead.email}
            </Text>
          </div>
          <Badge variant="light">{lead.status}</Badge>
        </Group>

        <Divider />

        <Group justify="space-between">
          <Text size="sm">Phone: {lead.phone || '-'}</Text>
          <Text size="sm">Company: {lead.company || '-'}</Text>
        </Group>

        <Text size="sm">Source: {lead.source || '-'}</Text>

        <Divider label="Update History" labelPosition="center" />

        <Timeline active={history.length} bulletSize={16} lineWidth={2}>
          {history.length ? (
            history.map((item) => (
              <Timeline.Item key={item.id} title={item.action || 'Updated'}>
                <Text size="sm" c="dimmed">
                  {item.description || item.changeSummary || 'Lead updated'}
                </Text>
                <Text size="xs" c="dimmed">
                  {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                </Text>
              </Timeline.Item>
            ))
          ) : (
            <Timeline.Item title="No history yet">
              <Text size="sm" c="dimmed">
                No updates recorded for this lead.
              </Text>
            </Timeline.Item>
          )}
        </Timeline>
      </Stack>
    </Card>
  );
}
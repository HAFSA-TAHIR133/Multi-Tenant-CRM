import {
  Drawer,
  Stack,
  Text,
  Title,
  Badge,
  Group,
  Divider,
  Box,
  Button,
} from '@mantine/core';
import { IconPencil } from '@tabler/icons-react';

function Field({ label, value }) {
  return (
    <Box style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Text size="xs" c="dimmed" fw={500} tt="uppercase" ls={0.5}>
        {label}
      </Text>
      <Text size="sm" fw={500} c="dark">
        {value || '—'}
      </Text>
    </Box>
  );
}

export default function LeadDetailSheet({
  opened,
  onClose,
  lead,
  history = [],
  onEdit,
}) {
  if (!lead) return null;

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="sm"
      title={
        <Text fw={600} size="sm">
          Lead Details
        </Text>
      }
      styles={{
        content: { borderRadius: '12px 0 0 12px' },
        header: {
          borderBottom: '1px solid #f1f5f9',
          padding: '12px 16px',
        },
        body: { padding: 16 },
      }}
    >
      <Stack gap="lg">
        {/* name & company */}
        <div>
          <Title order={5} fw={700} c="dark" lineClamp={1}>
            {lead.contactName || lead.name || '—'}
          </Title>
          <Text size="sm" c="dimmed" mt={2}>
            {lead.companyName || '—'}
          </Text>
        </div>

        <Group gap="xs">
          <Badge size="sm" variant="light" color="dark" radius="sm">
            {lead.status || 'Active'}
          </Badge>
          <Badge size="sm" variant="outline" color="gray" radius="sm">
            {lead.source || 'Inbound'}
          </Badge>
        </Group>

        {/* Pipeline & Stage Info */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
          }}
        >
          <Field
            label="Pipeline"
            value={lead.pipeline?.name || lead.pipelineName || `Pipeline #${lead.pipelineId}`}
          />
          <Field
            label="Stage"
            value={lead.stage?.name || lead.stageName || `Stage #${lead.stageId}`}
          />
        </div>

        <Divider color="#f1f5f9" />

        {/* fields grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
          }}
        >
          <Field label="Assigned To" value={lead.assignedUser?.name || 'Unassigned'} />
          <Field
            label="Revenue"
            value={
              lead.revenue ?? lead.value
                ? `$${Number(lead.revenue ?? lead.value).toLocaleString()}`
                : undefined
            }
          />
          <Field label="Email" value={lead.email} />
          <Field label="Phone" value={lead.phone} />
        </div>

        {/* Edit Button */}
        <Group justify="center" mt="md">
          <Button
            leftSection={<IconPencil size={14} />}
            variant="light"
            color="green"
            size="sm"
            radius="md"
            onClick={() => onEdit?.(lead)}
            fullWidth
          >
            Edit Lead
          </Button>
        </Group>

        <Divider color="#f1f5f9" />

        {/* history */}
        <div>
          <Text size="xs" c="dimmed" fw={500} tt="uppercase" ls={0.5} mb="sm">
            History
          </Text>

          {history.length > 0 ? (
            <Stack gap="sm" pl={4}>
              {history.map((item, idx) => (
                <div
                  key={item.id || idx}
                  style={{
                    position: 'relative',
                    paddingLeft: 16,
                    borderLeft: '2px solid #f1f5f9',
                    paddingBottom: idx < history.length - 1 ? 12 : 0,
                  }}
                >
                  <Text fw={600} size="sm" c="dark">
                    {item.action || item.title || 'Update'}
                  </Text>
                  <Text size="xs" c="dimmed" mt={1}>
                    {item.description || item.message || '—'}
                  </Text>
                </div>
              ))}
            </Stack>
          ) : (
            <Text size="sm" c="dimmed">
              No history available.
            </Text>
          )}
        </div>
      </Stack>
    </Drawer>
  );
}
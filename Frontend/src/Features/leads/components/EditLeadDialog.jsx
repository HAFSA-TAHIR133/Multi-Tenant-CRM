import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Button, TextInput, Group, Select, Stack } from '@mantine/core';
import { leadsApi } from '../api/leadsApi';
import leadSchema from '../schemas/leadSchema.js';

export default function EditLeadDialog({ opened, lead, onClose, onSuccess }) {
  const form = useForm({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      source: '',
      status: 'new',
    },
  });

  useEffect(() => {
    if (opened && lead) {
      form.reset({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        source: lead.source || '',
        status: lead.status || 'new',
      });
    }
  }, [opened, lead]);

  const onSubmit = async (values) => {
    await leadsApi.update(lead.id, values);
    onSuccess?.();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Lead" centered size="lg">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Stack gap="md">
          <TextInput label="Name" {...form.register('name')} error={form.formState.errors.name?.message} />
          <TextInput label="Email" {...form.register('email')} error={form.formState.errors.email?.message} />
          <TextInput label="Phone" {...form.register('phone')} error={form.formState.errors.phone?.message} />
          <TextInput label="Company" {...form.register('company')} error={form.formState.errors.company?.message} />
          <TextInput label="Source" {...form.register('source')} error={form.formState.errors.source?.message} />
          <Select
            label="Status"
            data={['new', 'contacted', 'qualified', 'won', 'lost']}
            {...form.register('status')}
            error={form.formState.errors.status?.message}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button className="!bg-black !text-white" type="submit">Update</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Button, TextInput, Group, Select, Stack } from '@mantine/core';
import { leadsApi } from '../api/leadsApi';
import { fetchApi } from '@/api/fetchApiHelper';
import leadSchema from '../schemas/leadSchema.js';
import { toast } from 'sonner';
import { useAuth } from '@/Features/auth/context/AuthContext';
import { ROLES } from '@/constants/roles';

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
];

export default function EditLeadDialog({ opened, lead, onClose, onSuccess }) {
  const { user } = useAuth();
  const role = user?.role;
  const isRegularUser = role === ROLES.USER;

  const form = useForm({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      title: '',
      contactName: '',
      email: '',
      phone: '',
      companyName: '',
      source: '',
      website: '',
      value: '',
      status: 'open',
      pipelineId: '',
      stageId: '',
      assignedUserId: '',
    },
  });

  const { reset, setValue, handleSubmit, formState: { errors } } = form;
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Fetch users list for assignee dropdown
  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetchApi('/user');
      // Handle response envelope gracefully
      const uList = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setUsers(uList);
    } catch (err) {
      console.warn('Failed to load users:', err);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (opened) {
      loadUsers();
    }
  }, [opened, loadUsers]);

  // Sync current lead values into form state when opened
  useEffect(() => {
    if (opened && lead) {
      reset({
        title: lead.title || '',
        contactName: lead.contactName || '',
        email: lead.email || '',
        phone: lead.phone || '',
        companyName: lead.companyName || '',
        source: lead.source || '',
        website: lead.website || '',
        value: lead.value !== undefined && lead.value !== null ? String(lead.value) : '',
        status: lead.status === 'closed' ? 'closed' : 'open',
        pipelineId: lead.pipelineId ? String(lead.pipelineId) : '',
        stageId: lead.stageId ? String(lead.stageId) : '',
        assignedUserId: lead.assignedUserId ? String(lead.assignedUserId) : '',
      });
    }
  }, [opened, lead, reset]);

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const rawUserId = values.assignedUserId;
      const parsedAssignedUserId =
        rawUserId !== '' && rawUserId !== null && rawUserId !== undefined
          ? Number(rawUserId)
          : null;

      const payload = {
        title: values.title,
        contactName: values.contactName,
        email: values.email,
        phone: values.phone || null,
        companyName: values.companyName || null,
        source: values.source || null,
        website: values.website || null,
        value: values.value !== '' && values.value !== null ? Number(values.value) : null,
        status: values.status,
        pipelineId: values.pipelineId ? Number(values.pipelineId) : lead.pipelineId,
        stageId: values.stageId ? Number(values.stageId) : lead.stageId,
        assignedUserId: parsedAssignedUserId,
      };

      // Single clean API request to update all fields including assignment
      const updatedLead = await leadsApi.update(lead.id, payload);

      toast.success('Lead details updated successfully');
      onSuccess?.(updatedLead);
      onClose?.();
    } catch (err) {
      console.error('Update lead error:', err);
      toast.error(err?.message || 'Failed to update lead');
    } finally {
      setSubmitting(false);
    }
  };

  const onError = (formErrors) => {
    console.error('Form Validation Errors:', formErrors);
    toast.error('Please check required fields and fix validation errors.');
  };

  const userOptions = users.map((u) => ({
    value: String(u.id || u._id),
    label: u.name || u.fullName || u.email,
  }));

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Lead Details" centered size="lg" radius="lg">
      <form onSubmit={handleSubmit(onSubmit, onError)}>
        <Stack gap="md">
          <TextInput
            label="Title"
            placeholder="e.g. Follow up with CEO"
            {...form.register('title')}
            error={errors.title?.message}
            required
          />
          <TextInput
            label="Contact Name"
            placeholder="John Doe"
            {...form.register('contactName')}
            error={errors.contactName?.message}
            required
          />
          <TextInput
            label="Email"
            placeholder="john@example.com"
            {...form.register('email')}
            error={errors.email?.message}
            required
          />
          <TextInput
            label="Phone"
            placeholder="+1 234 567 890"
            {...form.register('phone')}
            error={errors.phone?.message}
          />
          <TextInput
            label="Company"
            placeholder="Acme Inc."
            {...form.register('companyName')}
            error={errors.companyName?.message}
          />
          <TextInput
            label="Source"
            placeholder="Website, Referral, etc."
            {...form.register('source')}
            error={errors.source?.message}
          />
          <TextInput
            label="Website"
            placeholder="https://example.com"
            {...form.register('website')}
            error={errors.website?.message}
          />
          <TextInput
            label="Estimated Value ($)"
            placeholder="1000"
            {...form.register('value')}
            error={errors.value?.message}
          />
          <Select
            label="Status"
            data={STATUS_OPTIONS}
            value={form.watch('status')}
            onChange={(val) => setValue('status', val || 'open', { shouldValidate: true })}
            error={errors.status?.message}
            disabled={isRegularUser}
          />
          <Select
            label="Assignee"
            placeholder={usersLoading ? 'Loading users...' : 'Select user to assign'}
            data={userOptions}
            value={form.watch('assignedUserId')}
            onChange={(val) => setValue('assignedUserId', val || '', { shouldValidate: true })}
            error={errors.assignedUserId?.message}
            disabled={usersLoading || isRegularUser}
            clearable
            searchable
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" className="!bg-black !text-white" loading={submitting}>
              Update Lead
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
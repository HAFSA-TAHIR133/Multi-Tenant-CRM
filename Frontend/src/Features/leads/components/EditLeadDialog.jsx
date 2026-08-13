import { useEffect, useState, useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { leadsApi } from '../api/leadsApi';
import { fetchApi } from '@/api/fetchApiHelper';
import leadSchema from '../schemas/leadSchema.js';
import { useAuth } from '@/Features/auth/context/AuthContext';
import { ROLES } from '@/constants/roles';

import { Modal, Select } from '@mantine/core';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

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

  const { reset, handleSubmit } = form;
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetchApi('/user');
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
        pipelineId: values.pipelineId ? Number(values.pipelineId) : lead?.pipelineId,
        stageId: values.stageId ? Number(values.stageId) : lead?.stageId,
        assignedUserId: parsedAssignedUserId,
      };

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
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-base leading-tight">Edit Lead Details</span>
          <span className="text-xs text-muted-foreground font-normal">
            Update information and contact details for this lead.
          </span>
        </div>
      }
      centered
      size="700px"
      radius="lg"
    >
      <form id="edit-lead-form" onSubmit={handleSubmit(onSubmit, onError)}>
        <CardContent className="px-0 py-0 bg-white dark:bg-slate-900">
          <FieldGroup className="flex flex-col !gap-2">
            {/* Title */}
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="flex flex-col !gap-1">
                  <FieldLabel htmlFor="edit-lead-title" className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Title <span className="text-red-500">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="edit-lead-title"
                    placeholder="e.g. Follow up with CEO"
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                    className="h-8 text-xs"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Contact Name */}
            <Controller
              name="contactName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="flex flex-col !gap-1">
                  <FieldLabel htmlFor="edit-lead-contactName" className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Contact Name <span className="text-red-500">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="edit-lead-contactName"
                    placeholder="John Doe"
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                    className="h-8 text-xs"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Email */}
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="flex flex-col !gap-1">
                  <FieldLabel htmlFor="edit-lead-email" className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Email <span className="text-red-500">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="edit-lead-email"
                    type="email"
                    placeholder="john@example.com"
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                    className="h-8 text-xs"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Phone */}
            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="flex flex-col !gap-1">
                  <FieldLabel htmlFor="edit-lead-phone" className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Phone
                  </FieldLabel>
                  <Input
                    {...field}
                    id="edit-lead-phone"
                    placeholder="+1 234 567 890"
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                    className="h-8 text-xs"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Company */}
            <Controller
              name="companyName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="flex flex-col !gap-1">
                  <FieldLabel htmlFor="edit-lead-company" className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Company
                  </FieldLabel>
                  <Input
                    {...field}
                    id="edit-lead-company"
                    placeholder="Acme Inc."
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                    className="h-8 text-xs"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Source */}
            <Controller
              name="source"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="flex flex-col !gap-1">
                  <FieldLabel htmlFor="edit-lead-source" className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Source
                  </FieldLabel>
                  <Input
                    {...field}
                    id="edit-lead-source"
                    placeholder="Website, Referral, etc."
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                    className="h-8 text-xs"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Website */}
            <Controller
              name="website"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="flex flex-col !gap-1">
                  <FieldLabel htmlFor="edit-lead-website" className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Website
                  </FieldLabel>
                  <Input
                    {...field}
                    id="edit-lead-website"
                    placeholder="https://example.com"
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                    className="h-8 text-xs"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Estimated Value */}
            <Controller
              name="value"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="flex flex-col !gap-1">
                  <FieldLabel htmlFor="edit-lead-value" className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Estimated Value ($)
                  </FieldLabel>
                  <Input
                    {...field}
                    id="edit-lead-value"
                    placeholder="1000"
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                    className="h-8 text-xs"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Status */}
            <Controller
              name="status"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="flex flex-col !gap-1">
                  <FieldLabel htmlFor="edit-lead-status" className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Status
                  </FieldLabel>
                  <Select
                    id="edit-lead-status"
                    size="xs"
                    data={STATUS_OPTIONS}
                    value={field.value}
                    onChange={(val) => field.onChange(val || 'open')}
                    disabled={isRegularUser}
                    error={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Assignee */}
            <Controller
              name="assignedUserId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="flex flex-col !gap-1">
                  <FieldLabel htmlFor="edit-lead-assignee" className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Assignee
                  </FieldLabel>
                  <Select
                    id="edit-lead-assignee"
                    size="xs"
                    placeholder={usersLoading ? 'Loading users...' : 'Select user to assign'}
                    data={userOptions}
                    value={field.value}
                    onChange={(val) => field.onChange(val || '')}
                    disabled={usersLoading || isRegularUser}
                    clearable
                    searchable
                    error={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </CardContent>

        <CardFooter className="flex justify-end gap-2 px-0 pt-3 bg-white dark:bg-slate-900 mt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-lead-form"
            size="sm"
            disabled={submitting}
            className="bg-black text-white hover:bg-neutral-800"
          >
            {submitting ? 'Updating...' : 'Update Lead'}
          </Button>
        </CardFooter>
      </form>
    </Modal>
  );
}
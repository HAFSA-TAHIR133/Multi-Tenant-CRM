"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const editTenantSchema = z.object({
  name: z.string().min(1, "Name is required."),
  slug: z
    .string()
    .min(1, "Slug is required.")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens."),
  domain: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val),
      "Please enter a valid domain (e.g., app.company.com)."
    ),
  primaryColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Please enter a valid hex color code."),
  maxUsers: z.coerce
    .number({ invalid_type_error: "Max users must be a number." })
    .min(1, "Max users must be at least 1."),
  enableNotifications: z.boolean(),
});

export default function EditTenantDialog({ tenant, onUpdate, open, onOpenChange }) {
  const form = useForm({
    resolver: zodResolver(editTenantSchema),
    defaultValues: {
      name: "",
      slug: "",
      domain: "",
      primaryColor: "#3b82f6",
      maxUsers: 100,
      enableNotifications: true,
    },
  });

  // Populate form whenever the target tenant changes
  React.useEffect(() => {
    if (tenant) {
      const dbSettings = tenant.settings || {};
      form.reset({
        name: tenant.name || "",
        slug: tenant.slug || "",
        domain: tenant.domain || "",
        primaryColor: dbSettings.primaryColor || "#3b82f6",
        maxUsers: dbSettings.maxUsers ?? 100,
        enableNotifications: dbSettings.enableNotifications ?? true,
      });
    }
  }, [tenant, form]);

  const onSubmit = async (values) => {
    try {
      const payload = {
        name: values.name.trim(),
        slug: values.slug.trim(),
        domain: values.domain?.trim() || null,
        settings: {
          primaryColor: values.primaryColor,
          maxUsers: values.maxUsers,
          enableNotifications: values.enableNotifications,
        },
      };

      await onUpdate(tenant.id, payload);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <DialogTitle>Edit Tenant</DialogTitle>
          <DialogDescription>
            Update the organization details and default system preferences.
          </DialogDescription>
        </DialogHeader>

        <form id="edit-tenant-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="flex flex-col gap-3">
            {/* --- BASIC INFO SECTION --- */}
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-1">
                  <FieldLabel htmlFor="edit-tenant-name">
                    Name <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="edit-tenant-name"
                    aria-invalid={fieldState.invalid}
                    placeholder="Company Name"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="slug"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-1">
                  <FieldLabel htmlFor="edit-tenant-slug">
                    Slug <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="edit-tenant-slug"
                    aria-invalid={fieldState.invalid}
                    placeholder="company-name"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="domain"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-1">
                  <FieldLabel htmlFor="edit-tenant-domain">Domain</FieldLabel>
                  <Input
                    {...field}
                    id="edit-tenant-domain"
                    aria-invalid={fieldState.invalid}
                    placeholder="e.g. app.theircompany.com"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className="pt-1 border-t">
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Tenant Settings
              </h3>
            </div>

            {/* --- SETTINGS SECTION --- */}
            <Controller
              name="primaryColor"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-1">
                  <FieldLabel htmlFor="edit-tenant-primaryColor">
                    Primary Brand Color <span className="text-destructive">*</span>
                  </FieldLabel>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="h-9 w-12 p-1 cursor-pointer rounded border border-input bg-background"
                    />
                    <Input
                      {...field}
                      id="edit-tenant-primaryColor"
                      aria-invalid={fieldState.invalid}
                      placeholder="#3b82f6"
                    />
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="maxUsers"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-1">
                  <FieldLabel htmlFor="edit-tenant-maxUsers">
                    Max Users Limit <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="edit-tenant-maxUsers"
                    type="number"
                    aria-invalid={fieldState.invalid}
                    placeholder="100"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="enableNotifications"
              control={form.control}
              render={({ field }) => (
                <div className="flex flex-row items-center justify-between rounded-md border p-2.5">
                  <div className="space-y-0.5">
                    <FieldLabel
                      htmlFor="edit-tenant-enableNotifications"
                      className="cursor-pointer text-xs font-medium"
                    >
                      Enable Email Notifications
                    </FieldLabel>
                    <FieldDescription className="text-[11px]">
                      Allow this tenant to receive system emails.
                    </FieldDescription>
                  </div>
                  <Switch
                    id="edit-tenant-enableNotifications"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />
          </FieldGroup>
        </form>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={form.formState.isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-tenant-form"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Updating..." : "Update Tenant"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
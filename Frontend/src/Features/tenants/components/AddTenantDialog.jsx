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

const tenantSchema = z.object({
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
  status: z.enum(["active", "inactive"]),
  primaryColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Please enter a valid hex color code."),
  maxUsers: z.coerce
    .number({ invalid_type_error: "Max users must be a number." })
    .min(1, "Max users must be at least 1."),
  enableNotifications: z.boolean(),
});

export default function AddTenantDialog({ onCreate }) {
  const [open, setOpen] = React.useState(false);

  const form = useForm({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: "",
      slug: "",
      domain: "",
      status: "active",
      primaryColor: "#3b82f6",
      maxUsers: 100,
      enableNotifications: true,
    },
  });

  const onSubmit = async (values) => {
    try {
      const payload = {
        name: values.name.trim(),
        slug: values.slug.trim(),
        domain: values.domain?.trim() || null,
        status: values.status,
        settings: {
          primaryColor: values.primaryColor,
          maxUsers: values.maxUsers,
          enableNotifications: values.enableNotifications,
        },
      };

      await onCreate(payload);
      
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenChange = (newOpen) => {
    setOpen(newOpen);
    if (!newOpen) {
      form.reset();
    }
  };

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Add Tenant
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-1">
            <DialogTitle>Add New Tenant</DialogTitle>
            <DialogDescription>
              Create a new tenant organization and configure system settings.
            </DialogDescription>
          </DialogHeader>

          <form id="add-tenant-form" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup className="flex flex-col gap-3">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-1">
                    <FieldLabel htmlFor="tenant-name">
                      Name <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id="tenant-name"
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
                    <FieldLabel htmlFor="tenant-slug">
                      Slug <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id="tenant-slug"
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
                    <FieldLabel htmlFor="tenant-domain">Domain</FieldLabel>
                    <Input
                      {...field}
                      id="tenant-domain"
                      aria-invalid={fieldState.invalid}
                      placeholder="app.company.com"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="status"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-1">
                    <FieldLabel htmlFor="tenant-status">
                      Status <span className="text-destructive">*</span>
                    </FieldLabel>
                    <select
                      {...field}
                      id="tenant-status"
                      aria-invalid={fieldState.invalid}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <div className="pt-1 border-t">
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Default Settings
                </h3>
              </div>

              <Controller
                name="primaryColor"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-1">
                    <FieldLabel htmlFor="tenant-primaryColor">
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
                        id="tenant-primaryColor"
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
                    <FieldLabel htmlFor="tenant-maxUsers">
                      Max Users Limit <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id="tenant-maxUsers"
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
                  <div className="flex flex-row items-center justify-between rounded-md border p-3">
                    <div className="space-y-0.5">
                      <FieldLabel
                        htmlFor="tenant-enableNotifications"
                        className="cursor-pointer text-xs font-medium"
                      >
                        Enable Email Notifications
                      </FieldLabel>
                      <FieldDescription className="text-[11px]">
                        Allow this tenant to receive system emails.
                      </FieldDescription>
                    </div>
                    <Switch
                      id="tenant-enableNotifications"
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
              onClick={() => handleOpenChange(false)}
              disabled={form.formState.isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-tenant-form"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Creating..." : "Create Tenant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
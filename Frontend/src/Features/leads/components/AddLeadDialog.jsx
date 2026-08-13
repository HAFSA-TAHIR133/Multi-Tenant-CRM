"use client"

import * as React from "react"
import { useEffect, useState, useCallback } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Modal,
  Button as MantineButton,
  TextInput,
  Group,
  Select,
  Stack,
  Text,
  Loader,
  Divider,
  ActionIcon,
  Tooltip,
  Paper,
  Box,
  Popover,
  ColorPicker,
  Textarea,
} from "@mantine/core"
import { IconPlus, IconTrash, IconPalette } from "@tabler/icons-react"
import { toast } from "sonner"

import { leadsApi } from "../api/leadsApi"
import { pipelinesApi } from "@/Features/pipelines/api/pipelinesApi"
import { fetchApi } from "@/api/fetchApiHelper"
import leadSchema from "../schemas/leadSchema.js"

import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

// Helper functions
const normalizeHex = (v, fallback = "#111111") => {
  if (typeof v !== "string") return fallback
  let s = v.trim()
  if (!s.startsWith("#")) s = `#${s}`
  if (/^#[0-9A-Fa-f]{3}$/.test(s)) {
    s = `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`
  }
  return /^#[0-9A-Fa-f]{6}$/.test(s) ? s : fallback
}

function isLightColor(hex) {
  const c = normalizeHex(hex).replace("#", "")
  const r = parseInt(c.substring(0, 2), 16) || 0
  const g = parseInt(c.substring(2, 4), 16) || 0
  const b = parseInt(c.substring(4, 6), 16) || 0
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6
}

function InteractiveColorPicker({ value, onChange, disabled }) {
  const [popoverOpened, setPopoverOpened] = useState(false)
  const [manualHex, setManualHex] = useState(normalizeHex(value))

  useEffect(() => {
    setManualHex(normalizeHex(value))
  }, [value])

  const handleManualInput = (e) => {
    let val = String(e?.target?.value ?? e?.currentTarget?.value ?? "")
    if (!val.startsWith("#")) val = `#${val}`
    setManualHex(val)
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) onChange(val)
  }

  const handleManualBlur = () => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(manualHex)) {
      const next = normalizeHex(value, "#111111")
      setManualHex(next)
      onChange(next)
    }
  }

  const current = normalizeHex(value)
  return (
    <Stack gap={4}>
      <Text size="xs" fw={500}>
        Stage Color
      </Text>
      <Group gap="xs" align="center">
        <Popover
          opened={popoverOpened}
          onChange={setPopoverOpened}
          width={220}
          position="bottom-start"
          withArrow
          shadow="md"
        >
          <Popover.Target>
            <Tooltip label="Click to open color spectrum" withArrow position="top">
              <button
                type="button"
                onClick={() => !disabled && setPopoverOpened((o) => !o)}
                disabled={disabled}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  backgroundColor: current,
                  border: "1px solid #cbd5e1",
                  cursor: disabled ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <IconPalette
                  size={16}
                  style={{
                    color: isLightColor(current) ? "#1e293b" : "#ffffff",
                    pointerEvents: "none",
                  }}
                />
              </button>
            </Tooltip>
          </Popover.Target>
          <Popover.Dropdown p="xs">
            <Stack gap="xs">
              <ColorPicker
                format="hex"
                value={current}
                onChange={(val) => {
                  setManualHex(val)
                  onChange(val)
                }}
                fullWidth
                size="xs"
              />
              <MantineButton
                size="xs"
                variant="default"
                className="w-full"
                onClick={() => setPopoverOpened(false)}
              >
                Done
              </MantineButton>
            </Stack>
          </Popover.Dropdown>
        </Popover>
        <TextInput
          value={manualHex}
          onChange={handleManualInput}
          onBlur={handleManualBlur}
          disabled={disabled}
          size="xs"
          placeholder="#000000"
          styles={{
            root: { flex: 1, maxWidth: 110 },
            input: {
              fontFamily: "monospace",
              fontWeight: 600,
              letterSpacing: 0.5,
              textTransform: "uppercase",
            },
          }}
        />
        <Box
          style={{
            padding: "2px 8px",
            borderRadius: 6,
            backgroundColor: current,
            color: isLightColor(current) ? "#1e293b" : "#ffffff",
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: "nowrap",
            height: 28,
            display: "flex",
            alignItems: "center",
            border: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          Preview
        </Box>
      </Group>
    </Stack>
  )
}

const defaultValues = {
  title: "",
  contactName: "",
  email: "",
  phone: "",
  companyName: "",
  source: "",
  website: "",
  value: "",
  status: "open",
  pipelineId: "",
  stageId: "",
  assignedUserId: "",
}

const createEmptyStage = () => ({
  id: Math.random().toString(36).substring(2, 9),
  name: "",
  description: "",
  color: "#111111",
})

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
]

export default function AddLeadDialog({ opened, onClose, onSuccess }) {
  const form = useForm({
    resolver: zodResolver(leadSchema),
    defaultValues,
  })

  const { watch, setValue, reset, control, handleSubmit } = form
  const selectedPipelineId = watch("pipelineId")

  const [pipelines, setPipelines] = useState([])
  const [stages, setStages] = useState([])
  const [users, setUsers] = useState([])
  const [pipelinesLoading, setPipelinesLoading] = useState(false)
  const [stagesLoading, setStagesLoading] = useState(false)
  const [usersLoading, setUsersLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [showNewPipelineForm, setShowNewPipelineForm] = useState(false)
  const [newPipelineName, setNewPipelineName] = useState("")
  const [newPipelineStages, setNewPipelineStages] = useState([createEmptyStage()])
  const [creatingPipeline, setCreatingPipeline] = useState(false)

  useEffect(() => {
    if (!opened) {
      reset(defaultValues)
      setShowNewPipelineForm(false)
      setNewPipelineName("")
      setNewPipelineStages([createEmptyStage()])
      setStages([])
    }
  }, [opened, reset])

  const loadInitialData = useCallback(async () => {
    setPipelinesLoading(true)
    setUsersLoading(true)
    try {
      const [pipelinesRes, usersRes] = await Promise.all([
        pipelinesApi.getAll(),
        fetchApi("/user"),
      ])

      const pList = Array.isArray(pipelinesRes?.data) ? pipelinesRes.data : Array.isArray(pipelinesRes) ? pipelinesRes : []
      const uList = Array.isArray(usersRes?.data) ? usersRes.data : Array.isArray(usersRes) ? usersRes : []

      setPipelines(pList)
      setUsers(uList)
    } catch (err) {
      console.warn("Failed to load initial metadata:", err)
    } finally {
      setPipelinesLoading(false)
      setUsersLoading(false)
    }
  }, [])

  useEffect(() => {
    if (opened) {
      loadInitialData()
    }
  }, [opened, loadInitialData])

  const loadStages = useCallback(
    async (pipelineId) => {
      if (!pipelineId) {
        setStages([])
        setValue("stageId", "")
        return
      }
      setStagesLoading(true)
      try {
        const res = await pipelinesApi.getStages(pipelineId)
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
        setStages(list)
        if (list.length > 0 && !form.getValues("stageId")) {
          setValue("stageId", String(list[0].id))
        }
      } catch (err) {
        console.warn("Failed to load stages:", err)
        setStages([])
      } finally {
        setStagesLoading(false)
      }
    },
    [setValue, form]
  )

  useEffect(() => {
    if (selectedPipelineId) {
      loadStages(selectedPipelineId)
    } else {
      setStages([])
      setValue("stageId", "")
    }
  }, [selectedPipelineId, loadStages, setValue])

  const handleCreatePipeline = async () => {
    if (!newPipelineName.trim()) {
      toast.error("Pipeline name is required")
      return
    }
    const validStages = newPipelineStages
      .map((s) => ({
        name: s.name.trim(),
        description: s.description?.trim() || "",
        color: normalizeHex(s.color, "#111111"),
      }))
      .filter((s) => Boolean(s.name))

    if (validStages.length === 0) {
      toast.error("At least one stage name is required")
      return
    }
    setCreatingPipeline(true)
    try {
      const pipelineRes = await pipelinesApi.create({ name: newPipelineName.trim() })
      const newPipeline = pipelineRes?.data || pipelineRes
      const pipelineId = newPipeline.id

      for (let i = 0; i < validStages.length; i++) {
        await pipelinesApi.createStage({
          name: validStages[i].name,
          description: validStages[i].description,
          color: validStages[i].color,
          pipelineId,
          order: i + 1,
        })
      }
      toast.success(`Pipeline "${newPipelineName}" created successfully`)
      setShowNewPipelineForm(false)
      setNewPipelineName("")
      setNewPipelineStages([createEmptyStage()])
      await loadInitialData()
      setValue("pipelineId", String(pipelineId))
    } catch (err) {
      toast.error(err?.message || "Failed to create pipeline")
    } finally {
      setCreatingPipeline(false)
    }
  }

  const addStageField = () => {
    setNewPipelineStages([...newPipelineStages, createEmptyStage()])
  }

  const removeStageField = (index) => {
    if (newPipelineStages.length <= 1) return
    setNewPipelineStages(newPipelineStages.filter((_, i) => i !== index))
  }

  const updateStageField = (index, key, value) => {
    const updated = [...newPipelineStages]
    updated[index] = { ...updated[index], [key]: value }
    setNewPipelineStages(updated)
  }

  const onSubmit = async (values) => {
    setSubmitting(true)
    try {
      const payload = {
        ...values,
        value: values.value !== "" && values.value !== undefined ? Number(values.value) : undefined,
        pipelineId: values.pipelineId ? Number(values.pipelineId) : undefined,
        stageId: values.stageId ? Number(values.stageId) : undefined,
        assignedUserId: values.assignedUserId ? Number(values.assignedUserId) : null,
      }
      await leadsApi.create(payload)
      toast.success("Lead created successfully")
      onSuccess?.()
      onClose?.()
    } catch (err) {
      toast.error(err?.message || "Failed to create lead")
    } finally {
      setSubmitting(false)
    }
  }

  const pipelineOptions = pipelines.map((p) => ({
    value: String(p.id),
    label: p.name,
  }))

  const stageOptions = stages.map((s) => ({
    value: String(s.id),
    label: s.name,
  }))

  const userOptions = users.map((u) => ({
    value: String(u.id || u._id),
    label: u.name || u.email,
  }))

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={600} size="lg">Add Lead</Text>}
      centered
      size="lg"
      withCloseButton={true}
      padding="md"
    >
      <p className="text-sm text-gray-500 mb-3">
        Enter details to create a new lead in your CRM pipeline.
      </p>

      <form id="add-lead-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <Controller
            name="title"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="border-none p-0 shadow-none">
                <FieldLabel htmlFor="lead-title" className="text-xs font-medium mb-0.5">
                  Title <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  {...field}
                  id="lead-title"
                  placeholder="e.g. VP of Sales / Software Engineer"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="contactName"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="border-none p-0 shadow-none">
                <FieldLabel htmlFor="lead-contact-name" className="text-xs font-medium mb-0.5">
                  Contact Name <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  {...field}
                  id="lead-contact-name"
                  placeholder="Yousaf Zain"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="email"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="border-none p-0 shadow-none">
                <FieldLabel htmlFor="lead-email" className="text-xs font-medium mb-0.5">
                  Email <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  {...field}
                  id="lead-email"
                  type="email"
                  placeholder="yousaf@example.com"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="phone"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="border-none p-0 shadow-none">
                <FieldLabel htmlFor="lead-phone" className="text-xs font-medium mb-0.5">Phone</FieldLabel>
                <Input
                  {...field}
                  id="lead-phone"
                  placeholder="+92 328 1234567"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="companyName"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="border-none p-0 shadow-none">
                <FieldLabel htmlFor="lead-company" className="text-xs font-medium mb-0.5">Company</FieldLabel>
                <Input
                  {...field}
                  id="lead-company"
                  placeholder="Starlight Logistics"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="source"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="border-none p-0 shadow-none">
                <FieldLabel htmlFor="lead-source" className="text-xs font-medium mb-0.5">Source</FieldLabel>
                <Input
                  {...field}
                  id="lead-source"
                  placeholder="Website, Referral, etc."
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="website"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="border-none p-0 shadow-none">
                <FieldLabel htmlFor="lead-website" className="text-xs font-medium mb-0.5">Website</FieldLabel>
                <Input
                  {...field}
                  id="lead-website"
                  placeholder="https://example.com"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="value"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="border-none p-0 shadow-none">
                <FieldLabel htmlFor="lead-value" className="text-xs font-medium mb-0.5">Estimated Value ($)</FieldLabel>
                <Input
                  {...field}
                  id="lead-value"
                  type="number"
                  placeholder="1000"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="status"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="border-none p-0 shadow-none">
                <FieldLabel htmlFor="lead-status" className="text-xs font-medium mb-0.5">Status</FieldLabel>
                <Select
                  id="lead-status"
                  data={STATUS_OPTIONS}
                  value={field.value}
                  onChange={(val) => field.onChange(val || "open")}
                  error={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="assignedUserId"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="border-none p-0 shadow-none">
                <FieldLabel htmlFor="lead-assignee" className="text-xs font-medium mb-0.5">Assignee</FieldLabel>
                <Select
                  id="lead-assignee"
                  placeholder={usersLoading ? "Loading users..." : "Select user to assign"}
                  data={userOptions}
                  value={field.value}
                  onChange={(val) => field.onChange(val || "")}
                  disabled={usersLoading}
                  clearable
                  searchable
                  error={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Divider label="Pipeline Assignment" labelPosition="center" my="xs" />

          {!showNewPipelineForm ? (
            <div>
              <Group gap="xs" align="end">
                <div style={{ flex: 1 }}>
                  <Controller
                    name="pipelineId"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid} className="border-none p-0 shadow-none">
                        <FieldLabel htmlFor="lead-pipeline" className="text-xs font-medium mb-0.5">
                          Pipeline <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Select
                          id="lead-pipeline"
                          placeholder={pipelinesLoading ? "Loading..." : "Select a pipeline"}
                          data={pipelineOptions}
                          value={field.value}
                          onChange={(val) => field.onChange(val || "")}
                          disabled={pipelinesLoading}
                          clearable
                          searchable
                          error={fieldState.invalid}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </div>
                <Tooltip label="Create new pipeline">
                  <ActionIcon
                    variant="light"
                    color="blue"
                    size="md"
                    onClick={() => setShowNewPipelineForm(true)}
                    mb={2}
                  >
                    <IconPlus size={18} />
                  </ActionIcon>
                </Tooltip>
              </Group>
              {pipelinesLoading && <Loader size="xs" mt={4} />}
            </div>
          ) : (
            <Stack gap="xs" p="xs" style={{ border: "1px solid #dee2e6", borderRadius: 8 }}>
              <Text fw={600} size="sm">
                Create New Pipeline
              </Text>
              <Field className="border-none p-0 shadow-none">
                <FieldLabel htmlFor="new-pipeline-name" className="text-xs font-medium mb-0.5">
                  Pipeline Name <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="new-pipeline-name"
                  placeholder="e.g. Sales Pipeline"
                  value={newPipelineName}
                  onChange={(e) => setNewPipelineName(e.currentTarget.value)}
                />
              </Field>
              <Divider my={2} />
              <Text size="xs" c="dimmed" fw={600} style={{ textTransform: "uppercase" }}>
                Pipeline Stages
              </Text>
              {newPipelineStages.map((stage, index) => {
                const currentColor = stage.color || "#111111"
                return (
                  <Paper
                    key={stage.id}
                    p="xs"
                    style={{
                      border: "1px solid #e2e8f0",
                      background: "#fff",
                      borderRadius: 8,
                      borderLeft: `4px solid ${currentColor}`,
                    }}
                  >
                    <Stack gap={6}>
                      <Group justify="space-between" align="center" wrap="nowrap">
                        <Group gap="xs" align="center">
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              backgroundColor: currentColor,
                              flexShrink: 0,
                            }}
                          />
                          <Text fw={600} size="xs" c="dark">
                            Stage {index + 1}
                          </Text>
                        </Group>
                        {newPipelineStages.length > 1 && (
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="sm"
                            onClick={() => removeStageField(index)}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        )}
                      </Group>
                      <Field className="border-none p-0 shadow-none">
                        <FieldLabel htmlFor={`stage-name-${index}`} className="text-xs font-medium mb-0.5">
                          Stage Name <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          id={`stage-name-${index}`}
                          placeholder={`e.g. Stage ${index + 1}`}
                          value={stage.name}
                          onChange={(e) => updateStageField(index, "name", e.currentTarget.value)}
                        />
                      </Field>
                      <Field className="border-none p-0 shadow-none">
                        <FieldLabel htmlFor={`stage-desc-${index}`} className="text-xs font-medium mb-0.5">Description</FieldLabel>
                        <Textarea
                          id={`stage-desc-${index}`}
                          placeholder="Optional details about this stage..."
                          value={stage.description}
                          onChange={(e) => updateStageField(index, "description", e.currentTarget.value)}
                          size="xs"
                          rows={2}
                        />
                      </Field>
                      <InteractiveColorPicker
                        value={currentColor}
                        onChange={(val) => updateStageField(index, "color", val)}
                        disabled={creatingPipeline}
                      />
                    </Stack>
                  </Paper>
                )
              })}
              <MantineButton
                type="button"
                variant="ghost"
                size="xs"
                className="justify-start gap-1 text-xs"
                onClick={addStageField}
              >
                <IconPlus size={14} /> Add another stage
              </MantineButton>
              <Group gap="xs" mt="2">
                <button
                  type="button"
                  onClick={handleCreatePipeline}
                  disabled={creatingPipeline}
                  className="px-3 py-1.5 text-xs font-medium rounded bg-black text-white hover:bg-white hover:text-black border border-black transition-colors"
                >
                  {creatingPipeline ? "Creating..." : "Create Pipeline"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewPipelineForm(false)
                    setNewPipelineName("")
                    setNewPipelineStages([createEmptyStage()])
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded bg-white text-black border border-gray-300 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </Group>
            </Stack>
          )}

          {selectedPipelineId && !showNewPipelineForm && (
            <Controller
              name="stageId"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="border-none p-0 shadow-none">
                  <FieldLabel htmlFor="lead-stage" className="text-xs font-medium mb-0.5">
                    Stage <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Select
                    id="lead-stage"
                    placeholder={stagesLoading ? "Loading stages..." : "Select a stage"}
                    data={stageOptions}
                    value={field.value}
                    onChange={(val) => field.onChange(val || "")}
                    disabled={stagesLoading || stages.length === 0}
                    error={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          )}
        </div>
      </form>

      <div className="flex justify-end gap-2 border-t pt-3 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium rounded-md bg-white text-black border border-gray-300 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="add-lead-form"
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium rounded-md bg-black text-white hover:bg-white hover:text-black border border-black transition-colors"
        >
          {submitting ? "Creating..." : "Create"}
        </button>
      </div>
    </Modal>
  )
}
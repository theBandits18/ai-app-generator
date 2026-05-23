// src/lib/config-validator.ts
import { z } from "zod";

// ── Primitive component schemas ───────────────────────────────────────────────
const StatSchema = z.object({
  type: z.literal("stat"),
  label: z.string().optional(),
  value: z.string().optional(),
  delta: z.string().optional(),
  color: z.enum(["accent", "accent2", "accent3", "success", "warning", "error"]).optional(),
});

const TableSchema = z.object({
  type: z.literal("table"),
  title: z.string().optional(),
  columns: z.array(z.string()).optional(),
  rows: z.array(z.array(z.unknown())).optional(),
});

const ChartSchema = z.object({
  type: z.literal("chart"),
  chartType: z.enum(["bar", "line", "pie"]).optional(),
  title: z.string().optional(),
  labels: z.array(z.string()).optional(),
  data: z.array(z.number()).optional(),
});

const FieldSchema = z.object({
  type: z.string().optional(),
  name: z.string().optional(),
  label: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  defaultValue: z.unknown().optional(),
});

const FormSchema = z.object({
  type: z.literal("form"),
  title: z.string().optional(),
  submitLabel: z.string().optional(),
  fields: z.array(FieldSchema).optional(),
});

// Unknown component — passthrough so UI can render a fallback
const UnknownComponentSchema = z.object({ type: z.string() }).passthrough();

const ComponentSchema = z.union([
  StatSchema,
  TableSchema,
  ChartSchema,
  FormSchema,
  UnknownComponentSchema,
]);

// ── Top-level app config ──────────────────────────────────────────────────────
export const AppConfigSchema = z.object({
  type: z.string().optional(),
  title: z.string().nullable().optional(),
  theme: z.string().optional(),
  submitLabel: z.string().optional(),
  fields: z.array(FieldSchema).optional(),
  components: z
    .array(z.union([ComponentSchema, z.null()]))
    .optional(),
});

export type AppConfigType = z.infer<typeof AppConfigSchema>;

// ── Validate and sanitize raw JSON ────────────────────────────────────────────
export function validateConfig(raw: unknown): {
  valid: boolean;
  config: AppConfigType | null;
  errors: string[];
} {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { valid: false, config: null, errors: ["Config must be a JSON object"] };
  }

  const result = AppConfigSchema.safeParse(raw);
  if (result.success) {
    return { valid: true, config: result.data, errors: [] };
  }

  const errors = result.error.issues.map(
    (i) => `${i.path.join(".") || "root"}: ${i.message}`
  );
  // Return partial config even if validation fails — graceful degradation
  return { valid: false, config: raw as AppConfigType, errors };
}

// ── App create/update schemas ─────────────────────────────────────────────────
export const CreateAppSchema = z.object({
  name: z.string().min(1, "Name required").max(80),
  description: z.string().max(300).optional(),
  isPublic: z.boolean().optional().default(false),
  config: z.record(z.unknown()),
});

export const UpdateAppSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(300).optional(),
  isPublic: z.boolean().optional(),
  config: z.record(z.unknown()).optional(),
});

export type CreateAppInput = z.infer<typeof CreateAppSchema>;
export type UpdateAppInput = z.infer<typeof UpdateAppSchema>;

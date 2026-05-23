// src/types/index.ts

export interface AppRecord {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  activeConfig: AppConfigRecord | null;
}

export interface AppConfigRecord {
  id: string;
  appId: string;
  version: number;
  config: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  validationErrors?: string[];
}

// Config component types
export type ComponentColor = "accent" | "accent2" | "accent3" | "success" | "warning" | "error";

export interface StatComponent {
  type: "stat";
  label?: string;
  value?: string;
  delta?: string;
  color?: ComponentColor;
}

export interface TableComponent {
  type: "table";
  title?: string;
  columns?: string[];
  rows?: unknown[][];
}

export interface ChartComponent {
  type: "chart";
  chartType?: "bar" | "line" | "pie";
  title?: string;
  labels?: string[];
  data?: number[];
}

export interface FormField {
  type?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  defaultValue?: unknown;
}

export interface FormComponent {
  type: "form";
  title?: string;
  submitLabel?: string;
  fields?: FormField[];
}

export type AnyComponent =
  | StatComponent
  | TableComponent
  | ChartComponent
  | FormComponent
  | Record<string, unknown>
  | null;

export interface AppConfig {
  type?: string;
  title?: string | null;
  theme?: string;
  submitLabel?: string;
  fields?: FormField[];
  components?: AnyComponent[];
  [key: string]: unknown;
}

import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { get, put } from "@vercel/blob";

export const LOCAL_USER_ID = "local-demo-user";

type JsonObject = Record<string, unknown>;

interface StoredConfig {
  id: string;
  appId: string;
  version: number;
  config: JsonObject;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StoredApp {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  activeConfig: StoredConfig | null;
  configHistory: StoredConfig[];
}

interface StoreShape {
  apps: StoredApp[];
}

const STORE_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(STORE_DIR, "apps.json");
const BLOB_STORE_PATH = "appgen/apps.json";

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

export function hasBlobStore() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}

function nowIso() {
  return new Date().toISOString();
}

function createSeedApp(input: {
  name: string;
  description: string;
  slug: string;
  isPublic: boolean;
  config: JsonObject;
}): StoredApp {
  const appId = randomUUID();
  const timestamp = nowIso();
  const configId = randomUUID();

  const activeConfig: StoredConfig = {
    id: configId,
    appId,
    version: 1,
    config: input.config,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return {
    id: appId,
    name: input.name,
    description: input.description,
    slug: input.slug,
    isPublic: input.isPublic,
    createdAt: timestamp,
    updatedAt: timestamp,
    userId: LOCAL_USER_ID,
    activeConfig,
    configHistory: [activeConfig],
  };
}

function seedApps(): StoredApp[] {
  return [
    createSeedApp({
      name: "Analytics Dashboard",
      description: "KPI stats, a signup table, and weekly chart",
      slug: "analytics-dashboard",
      isPublic: true,
      config: {
        type: "dashboard",
        title: "Analytics Dashboard",
        components: [
          { type: "stat", label: "Total Users", value: "24,391", delta: "+12%", color: "accent" },
          { type: "stat", label: "Revenue", value: "$84,200", delta: "+8.3%", color: "success" },
          { type: "stat", label: "Churn Rate", value: "2.4%", delta: "-0.6%", color: "warning" },
          {
            type: "table",
            title: "Recent Signups",
            columns: ["Name", "Plan", "Date", "Status"],
            rows: [
              ["Priya Mehta", "Pro", "2026-05-21", "active"],
              ["Arjun Shah", "Free", "2026-05-20", "pending"],
              ["Neha Joshi", "Enterprise", "2026-05-19", "active"],
            ],
          },
          {
            type: "chart",
            chartType: "bar",
            title: "Weekly Signups",
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            data: [42, 78, 55, 91, 63, 30, 48],
          },
        ],
      },
    }),
    createSeedApp({
      name: "User Onboarding Form",
      description: "Config-driven onboarding form",
      slug: "user-onboarding",
      isPublic: true,
      config: {
        type: "form",
        title: "User Onboarding",
        submitLabel: "Create Account",
        fields: [
          { type: "text", name: "fullName", label: "Full Name", required: true, placeholder: "Jane Doe" },
          { type: "email", name: "email", label: "Email Address", required: true, placeholder: "jane@example.com" },
          { type: "select", name: "role", label: "Role", required: true, options: ["Engineer", "Designer", "Product"] },
          { type: "toggle", name: "newsletter", label: "Subscribe to newsletter", defaultValue: true },
        ],
      },
    }),
    createSeedApp({
      name: "Broken Config Demo",
      description: "Shows graceful degradation for malformed widgets",
      slug: "broken-config-demo",
      isPublic: true,
      config: {
        type: "dashboard",
        title: null,
        components: [
          { type: "stat" },
          { type: "unknown_widget", label: "Mystery" },
          { type: "table", columns: null, rows: "not-an-array" },
          null,
          { label: "No type at all" },
        ],
      },
    }),
  ];
}

async function ensureStore() {
  if (hasBlobStore()) {
    try {
      await readBlobStore();
    } catch {
      const initial: StoreShape = { apps: seedApps() };
      await writeBlobStore(initial);
    }
    return;
  }

  await fs.mkdir(STORE_DIR, { recursive: true });

  try {
    await fs.access(STORE_FILE);
  } catch {
    const initial: StoreShape = { apps: seedApps() };
    await fs.writeFile(STORE_FILE, JSON.stringify(initial, null, 2), "utf8");
  }
}

async function readBlobStore() {
  const blob = await get(BLOB_STORE_PATH, { access: "private" });
  if (!blob || blob.statusCode !== 200 || !blob.stream) {
    throw new Error("Blob store not initialized");
  }

  const raw = await new Response(blob.stream).text();
  return JSON.parse(raw) as StoreShape;
}

async function writeBlobStore(store: StoreShape) {
  await put(BLOB_STORE_PATH, JSON.stringify(store, null, 2), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

async function readStore() {
  await ensureStore();

  if (hasBlobStore()) {
    return readBlobStore();
  }

  const raw = await fs.readFile(STORE_FILE, "utf8");
  return JSON.parse(raw) as StoreShape;
}

async function writeStore(store: StoreShape) {
  if (hasBlobStore()) {
    await writeBlobStore(store);
    return;
  }

  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

function sortByUpdated(apps: StoredApp[]) {
  return [...apps].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listLocalApps(input: { publicOnly?: boolean; userId?: string | null }) {
  const store = await readStore();
  const filtered = store.apps.filter((app) => {
    if (input.publicOnly) return app.isPublic;
    if (input.userId) return app.isPublic || app.userId === input.userId;
    return app.isPublic;
  });

  return sortByUpdated(filtered);
}

export async function getLocalApp(idOrSlug: string) {
  const store = await readStore();
  return store.apps.find((app) => app.id === idOrSlug || app.slug === idOrSlug) ?? null;
}

export async function createLocalApp(input: {
  name: string;
  description?: string;
  isPublic?: boolean;
  config: JsonObject;
  userId: string;
}) {
  const store = await readStore();
  const timestamp = nowIso();
  const appId = randomUUID();
  const baseSlug = slugify(input.name) || `app-${randomUUID().slice(0, 8)}`;
  let slug = baseSlug;

  while (store.apps.some((app) => app.slug === slug)) {
    slug = `${baseSlug}-${randomUUID().slice(0, 4)}`;
  }

  const activeConfig: StoredConfig = {
    id: randomUUID(),
    appId,
    version: 1,
    config: input.config,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const app: StoredApp = {
    id: appId,
    name: input.name,
    description: input.description ?? null,
    slug,
    isPublic: input.isPublic ?? false,
    createdAt: timestamp,
    updatedAt: timestamp,
    userId: input.userId,
    activeConfig,
    configHistory: [activeConfig],
  };

  store.apps.unshift(app);
  await writeStore(store);
  return app;
}

export async function updateLocalApp(
  idOrSlug: string,
  input: {
    name?: string;
    description?: string;
    isPublic?: boolean;
    config?: JsonObject;
  }
) {
  const store = await readStore();
  const appIndex = store.apps.findIndex((app) => app.id === idOrSlug || app.slug === idOrSlug);
  if (appIndex === -1) return null;

  const timestamp = nowIso();
  const app = store.apps[appIndex];

  if (input.name !== undefined) app.name = input.name;
  if (input.description !== undefined) app.description = input.description;
  if (input.isPublic !== undefined) app.isPublic = input.isPublic;

  if (input.config !== undefined) {
    const nextVersion = (app.activeConfig?.version ?? 0) + 1;
    app.configHistory = app.configHistory.map((config) => ({ ...config, isActive: false }));
    app.activeConfig = {
      id: randomUUID(),
      appId: app.id,
      version: nextVersion,
      config: input.config,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    app.configHistory.push(app.activeConfig);
  }

  app.updatedAt = timestamp;
  store.apps[appIndex] = app;
  await writeStore(store);
  return app;
}

export async function deleteLocalApp(idOrSlug: string) {
  const store = await readStore();
  const app = store.apps.find((entry) => entry.id === idOrSlug || entry.slug === idOrSlug) ?? null;
  if (!app) return null;

  store.apps = store.apps.filter((entry) => entry.id !== app.id);
  await writeStore(store);
  return app;
}

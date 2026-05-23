// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SAMPLE_CONFIGS = [
  {
    name: "Analytics Dashboard",
    description: "KPI stats, data table, and bar chart",
    slug: "analytics-dashboard",
    isPublic: true,
    config: {
      type: "dashboard",
      title: "Analytics Dashboard",
      components: [
        { type: "stat", label: "Total Users", value: "24,391", delta: "+12%", color: "accent" },
        { type: "stat", label: "Revenue", value: "$84,200", delta: "+8.3%", color: "success" },
        { type: "stat", label: "Churn Rate", value: "2.4%", delta: "-0.6%", color: "warning" },
        { type: "stat", label: "Uptime", value: "99.98%", delta: "+0.02%", color: "accent3" },
        {
          type: "table",
          title: "Recent Signups",
          columns: ["Name", "Plan", "Date", "Status"],
          rows: [
            ["Priya Mehta", "Pro", "2026-05-21", "active"],
            ["Arjun Shah", "Free", "2026-05-20", "pending"],
            ["Neha Joshi", "Enterprise", "2026-05-19", "active"],
            ["Ravi Kumar", "Pro", "2026-05-18", "churned"],
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
  },
  {
    name: "User Onboarding Form",
    description: "Dynamic form with validation",
    slug: "user-onboarding",
    isPublic: true,
    config: {
      type: "form",
      title: "User Onboarding",
      submitLabel: "Create Account",
      fields: [
        { type: "text", name: "fullName", label: "Full Name", required: true, placeholder: "Jane Doe" },
        { type: "email", name: "email", label: "Email Address", required: true, placeholder: "jane@example.com" },
        { type: "select", name: "role", label: "Role", options: ["Engineer", "Designer", "Product", "Marketing"], required: true },
        { type: "textarea", name: "bio", label: "Short Bio", placeholder: "Tell us about yourself...", required: false },
        { type: "toggle", name: "newsletter", label: "Subscribe to newsletter", defaultValue: true },
      ],
    },
  },
  {
    name: "Broken Config Demo",
    description: "Demonstrates graceful degradation on invalid/malformed config",
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
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Create a demo user
  const user = await prisma.user.upsert({
    where: { email: "demo@appgen.dev" },
    update: {},
    create: {
      email: "demo@appgen.dev",
      name: "Demo User",
    },
  });

  // Create sample apps
  for (const sample of SAMPLE_CONFIGS) {
    const { config, ...appData } = sample;
    const app = await prisma.app.upsert({
      where: { slug: appData.slug },
      update: { name: appData.name, description: appData.description },
      create: { ...appData, userId: user.id },
    });

    // Upsert active config
    const existing = await prisma.appConfig.findFirst({
      where: { appId: app.id, version: 1 },
    });

    if (!existing) {
      await prisma.appConfig.create({
        data: { appId: app.id, version: 1, config, isActive: true },
      });
    }
  }

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

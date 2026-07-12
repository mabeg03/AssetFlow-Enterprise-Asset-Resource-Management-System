import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableGateway } from "./ai-gateway.server";

const MODEL = "google/gemini-3-flash-preview";

const AuditItemSchema = z.object({
  assetTag: z.string(),
  expectedLocation: z.string(),
  foundLocation: z.string().nullable(),
  status: z.string(),
  department: z.string(),
  note: z.string().optional(),
});

export const summarizeAuditDiscrepancies = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        cycle: z.string(),
        items: z.array(AuditItemSchema).min(1).max(500),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableGateway(key);

    const prompt = `You are an asset-management auditor. Summarize discrepancies from audit cycle "${data.cycle}" in plain English for an ops manager.

Discrepancies (JSON):
${JSON.stringify(data.items, null, 2)}

Write 2–4 short sentences. Group by department when useful, quantify (e.g. "3 laptops missing in IT"), and suggest one likely cause if the pattern is clear (e.g. recent relocation, high-turnover team). No bullet points, no headings.`;

    const { text } = await generateText({ model: gateway(MODEL), prompt });
    return { summary: text.trim() };
  });

export const suggestMaintenancePriority = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        issue: z.string().min(3).max(2000),
        assetName: z.string().optional(),
        assetCategory: z.string().optional(),
        history: z.array(z.string()).max(20).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableGateway(key);

    const prompt = `You triage IT/facilities maintenance requests. Classify the priority as exactly one of: Low, Medium, High, Urgent.

Asset: ${data.assetName ?? "unknown"} (${data.assetCategory ?? "unknown category"})
Recent maintenance history: ${data.history?.join(" | ") ?? "none provided"}
Issue: "${data.issue}"

Rules:
- Urgent = safety risk or fully unusable business-critical asset
- High = business impact, degraded but partly working
- Medium = inconvenience, workaround exists
- Low = cosmetic / non-blocking

Respond in EXACTLY this format, nothing else:
PRIORITY: <Low|Medium|High|Urgent>
REASON: <one sentence, max 20 words>`;

    const { text } = await generateText({ model: gateway(MODEL), prompt });
    const priorityMatch = text.match(/PRIORITY:\s*(Low|Medium|High|Urgent)/i);
    const reasonMatch = text.match(/REASON:\s*(.+)/i);
    const priority = (priorityMatch?.[1] ?? "Medium").toLowerCase() as
      | "low"
      | "medium"
      | "high"
      | "urgent";
    const reason = reasonMatch?.[1]?.trim() ?? "Assessed based on description.";
    return { priority, reason };
  });

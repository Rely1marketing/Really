// app/api/chat/route.ts
import { NextRequest } from "next/server";
import { openaiClient } from "@/lib/openai";
import tools from "../../../../server/tools.json";

const SYSTEM_PROMPT =
  "Du är en Really.ai-assistent. Fråga alltid om samtycke när persondata importeras eller webbenrichment sker. Respektera quiet hours. När data saknas: ställ följdfrågor. När kampanj efterfrågas: ge 2–3 SMS-förslag + CTA + föreslagen tid (inte inom quiet hours) + kort motivering.";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...(body?.messages ?? []),
  ];

  const backendBase = process.env.BACKEND_URL || "http://localhost:3001";

  // Starta en streamad completion
  const response = await openaiClient.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    stream: true,
    messages,
    tools: tools as any,
  });

  const encoder = new TextEncoder();
  const toolCalls: Record<string, { name: string; arguments: string }> = {};

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const part of response) {
          const choice = part.choices?.[0];

          // Skicka vidare text till klienten
          const piece = choice?.delta?.content;
          if (piece) controller.enqueue(encoder.encode(piece));

          // Samla på oss eventuella tool calls (kan komma i chunkar utan id)
          const calls = choice?.delta?.tool_calls;
          if (calls && calls.length) {
            for (const [i, tc] of calls.entries()) {
              const id = tc.id ?? `tc-${Date.now()}-${i}`;
              const name = tc.function?.name || "";
              const argsChunk = tc.function?.arguments || "";

              const existing = toolCalls[id] || { name, arguments: "" };
              // Fyll i namn om första chunken saknade det
              if (!existing.name && name) existing.name = name;
              existing.arguments += argsChunk;
              toolCalls[id] = existing;
            }
          }
        }
      } catch (err) {
        console.error("OpenAI stream error", err);
      } finally {
        controller.close();

        // Kör ev. tool calls i bakgrunden (best effort)
        for (const tc of Object.values(toolCalls)) {
          try {
            const args = tc.arguments ? JSON.parse(tc.arguments) : {};
            await fetch(`${backendBase}/${tc.name}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(args),
            });
          } catch (err) {
            console.error("tool call failed", err);
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

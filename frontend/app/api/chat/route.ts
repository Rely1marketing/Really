import { NextRequest } from 'next/server';
import { openaiClient } from '@/lib/openai';
import tools from '../../../../server/tools.json';

const SYSTEM_PROMPT =
  'Du är en Really.ai-assistent. Fråga alltid om samtycke när persondata importeras eller webbenrichment sker. Respektera quiet hours. När data saknas: ställ följdfrågor. När kampanj efterfrågas: ge 2–3 SMS-förslag + CTA + föreslagen tid (inte inom quiet hours) + kort motivering.';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...body.messages];

  const response = await openaiClient.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    stream: true,
    messages,
    tools: tools as any,
  });

  const backendBase = process.env.BACKEND_URL || 'http://localhost:3001';
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const toolCalls: Record<
        string,
        { name: string; arguments: string }
      > = {};

      for await (const part of response) {
        const choice = part.choices[0];
        if (choice.delta?.content) {
          controller.enqueue(encoder.encode(choice.delta.content));
        }
        if (choice.delta?.tool_calls) {
          for (const tc of choice.delta.tool_calls) {
            const existing = toolCalls[tc.id] || {
              name: tc.function?.name || '',
              arguments: '',
            };
            existing.arguments += tc.function?.arguments || '';
            toolCalls[tc.id] = existing;
          }
        }
      }

      controller.close();

      for (const tc of Object.values(toolCalls)) {
        try {
          const args = tc.arguments ? JSON.parse(tc.arguments) : {};
          await fetch(`${backendBase}/${tc.name}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(args),
          });
        } catch (err) {
          console.error('tool call failed', err);
        }
      }
    },
  });

  return new Response(stream);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const response = await openaiClient.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    stream: true,
    messages: body.messages,
  });

  return new Response(response.toReadableStream(), {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
main
}

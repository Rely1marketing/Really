import { NextRequest } from 'next/server';
import { openaiClient } from '@/lib/openai';

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

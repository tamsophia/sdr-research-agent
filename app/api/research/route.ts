import { NextRequest } from "next/server";
import { runResearch } from "@/lib/pipeline";
import type { Lead, ProgressEvent } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const { lead }: { lead: Lead } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: ProgressEvent) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );
      };

      try {
        const emit = (step: string) => {
          send({ type: "progress", leadId: lead.id, step });
        };

        const result = await runResearch(lead, emit);

        if (result.disqualifyReason) {
          send({
            type: "disqualified",
            leadId: lead.id,
            disqualifyReason: result.disqualifyReason,
          });
        } else {
          send({ type: "complete", leadId: lead.id, brief: result.brief });
        }
      } catch (err) {
        send({
          type: "error",
          leadId: lead.id,
          message: err instanceof Error ? err.message : String(err),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

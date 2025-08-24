import { createDataStreamResponse } from "ai";
import { getUser } from '@/app/chat/hooks/get-user';
import { agent } from '@/voltagent';

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { messages, selectedModel } = await req.json();

    process.env.SELECTED_MODEL = selectedModel;

    return createDataStreamResponse({
      async execute(dataStream) {
        try {
          const result = await agent.streamText(messages);

          if (result.provider?.mergeIntoDataStream) {
            result.provider.mergeIntoDataStream(dataStream);
          }

          for await (const chunk of result.fullStream || []) {
            switch (chunk.type) {
              case "tool-call":
                dataStream.writeMessageAnnotation({
                  type: "tool-call",
                  value: {
                    toolCallId: chunk.toolCallId,
                    toolName: chunk.toolName,
                    args: chunk.args,
                    status: "calling",
                  },
                });
                break;
              case "tool-result":
                dataStream.writeMessageAnnotation({
                  type: "tool-result",
                  value: {
                    toolCallId: chunk.toolCallId,
                    toolName: chunk.toolName,
                    result: chunk.result,
                    status: "completed",
                  },
                });
                break;
              case "error":
                dataStream.writeMessageAnnotation({
                  type: "error",
                  value: {
                    error: chunk.error?.message || "Unknown error",
                  },
                });
                break;
            }
          }
        } catch (error) {
          console.error("Stream processing error:", error);
          dataStream.writeMessageAnnotation({
            type: "error",
            value: {
              error: error instanceof Error ? error.message : "Unknown error",
            },
          });
        }
      },
      onError: (error) =>
        `VoltAgent stream error: ${error instanceof Error ? error.message : String(error)}`,
    });
  } catch (error) {
    console.error("API route error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

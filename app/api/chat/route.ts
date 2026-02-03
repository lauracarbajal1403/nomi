import {
  consumeStream,
  convertToModelMessages,
  streamText,
  UIMessage,
} from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const prompt = convertToModelMessages(messages);

  const result = streamText({
    model: 'openai/gpt-4o-mini',
    system: `You are Nominikk, a helpful and friendly AI assistant. You are concise, accurate, and always try to help users with their questions. You have a warm personality and use clear, easy-to-understand language.`,
    messages: prompt,
    abortSignal: req.signal,
  });

  return result.toUIMessageStreamResponse({
    onFinish: async ({ isAborted }) => {
      if (isAborted) {
        console.log('Stream aborted');
      }
    },
    consumeSseStream: consumeStream,
  });
}

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const DEFAULT_MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0";

interface ClaudeTextContent {
  type: "text";
  text: string;
}

interface ClaudeResponse {
  content?: ClaudeTextContent[];
}

export interface BedrockTextClient {
  generateText(prompt: string): Promise<string>;
}

function isClaudeTextContent(value: unknown): value is ClaudeTextContent {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const content = value as Record<string, unknown>;

  return content.type === "text" && typeof content.text === "string";
}

function parseClaudeTextResponse(value: unknown): string {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Bedrock response body is invalid");
  }

  const response = value as ClaudeResponse;
  const text = response.content?.find(isClaudeTextContent)?.text;

  if (!text) {
    throw new Error("Bedrock response text is missing");
  }

  return text;
}

export class BedrockClaudeClient implements BedrockTextClient {
  constructor(
    private readonly client = new BedrockRuntimeClient({}),
    private readonly modelId =
      process.env.BEDROCK_MODEL_ID ?? DEFAULT_MODEL_ID,
  ) {}

  async generateText(prompt: string): Promise<string> {
    const body = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 1200,
      temperature: 0.4,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    };

    const result = await this.client.send(
      new InvokeModelCommand({
        modelId: this.modelId,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(body),
      }),
    );

    const responseBody = new TextDecoder().decode(result.body);
    const parsedBody: unknown = JSON.parse(responseBody);

    return parseClaudeTextResponse(parsedBody);
  }
}

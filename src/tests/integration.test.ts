import { createServer } from "../mcp.js";
import { config } from "dotenv";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import yaml from "js-yaml";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

config();

describe("Figma MCP Server Tests", () => {
  let server: McpServer;
  let client: Client;
  let figmaApiKey: string;
  let figmaFileKey: string;

  beforeAll(async () => {
    figmaApiKey = process.env.FIGMA_API_KEY || "";
    if (!figmaApiKey) {
      throw new Error("FIGMA_API_KEY is not set in environment variables");
    }

    figmaFileKey = process.env.FIGMA_FILE_KEY || "";
    if (!figmaFileKey) {
      throw new Error("FIGMA_FILE_KEY is not set in environment variables");
    }

    server = createServer({
      figmaApiKey,
      figmaOAuthToken: "",
      useOAuth: false,
    });

    client = new Client(
      {
        name: "figma-test-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      },
    );

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
  });

  afterAll(async () => {
    await client.close();
  });

  describe("Get Figma Data", () => {
    it("should be able to get Figma file data", async () => {
      const args: Record<string, unknown> = {
        fileKey: figmaFileKey,
      };

      const result = await client.request(
        {
          method: "tools/call",
          params: {
            name: "get_figma_data",
            arguments: args,
          },
        },
        CallToolResultSchema,
      );

      const first = result.content[0];
      if (!first || first.type !== "text") {
        throw new Error(`Expected first content block to be text, got ${first?.type ?? "nothing"}`);
      }
      const parsed = yaml.load(first.text);

      expect(parsed).toBeDefined();
    }, 60000);
  });
});

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

console.log("🧪 Simple test for get_figma_data tool\n");

async function simpleTest() {
  const transport = new StdioClientTransport({
    command: "node",
    args: ["dist/cli.js", "--stdio"],
    env: {
      ...process.env,
      FIGMA_API_KEY: process.env.FIGMA_API_KEY,
    },
  });

  const client = new Client(
    {
      name: "simple-test-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  try {
    await client.connect(transport);
    console.log("✅ Connected to MCP server\n");

    // List available tools
    console.log("📋 Listing available tools:");
    const tools = await client.listTools();
    const hasPaginationTool = tools.tools.find(t => t.name === "get_figma_data");
    
    if (hasPaginationTool) {
      console.log("✅ Found get_figma_data tool");
      console.log("  Description:", hasPaginationTool.description);
      console.log("  Schema includes pagination?", 
        JSON.stringify(hasPaginationTool.inputSchema).includes("page"));
    }

    // Try a simple call with a small file
    console.log("\n📄 Testing with a simple file request:");
    try {
      const result = await client.callTool("get_figma_data", {
        fileKey: "INffIHj89RN7TxM6EkuRAT",
        depth: 1,  // Shallow depth to get smaller response
      });

      console.log("✅ Response received!");
      const responseText = result.content[0].text;
      console.log(`Response size: ${responseText.length} characters`);
      
      // Check if pagination info is present
      if (responseText.includes("pagination:")) {
        console.log("✅ Pagination info found in response");
      } else {
        console.log("ℹ️  No pagination needed for this response");
      }
      
    } catch (toolError) {
      console.error("❌ Tool error:", toolError.message);
    }
    
  } catch (error) {
    console.error("❌ Connection error:", error.message);
  } finally {
    await client.close();
    process.exit(0);
  }
}

// Run the test
simpleTest().catch(console.error);
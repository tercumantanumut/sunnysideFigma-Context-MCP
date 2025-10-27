import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

console.log("🧪 Testing Pagination Feature for get_figma_data tool\n");

async function testPagination() {
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
      name: "pagination-test-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  try {
    await client.connect(transport);
    console.log("✅ Connected to MCP server\n");

    // Test 1: Call without pagination (should trigger pagination if response is large)
    console.log("📄 Test 1: Calling get_figma_data without pagination parameters");
    console.log("FileKey: INffIHj89RN7TxM6EkuRAT");
    console.log("NodeId: 516:5626\n");

    try {
      const result1 = await client.callTool("get_figma_data", {
        fileKey: "INffIHj89RN7TxM6EkuRAT",
        nodeId: "516:5626",
      });

      console.log("Response received!");
      
      // Parse the response to check for pagination
      const responseText = result1.content[0].text;
      const hasPagination = responseText.includes("pagination:");
      
      if (hasPagination) {
        console.log("✅ Pagination was automatically applied!");
        
        // Extract pagination info
        const lines = responseText.split('\n');
        const paginationLines = lines.filter(line => 
          line.includes('currentPage:') || 
          line.includes('totalPages:') || 
          line.includes('totalNodes:') ||
          line.includes('nodesPerPage:')
        );
        
        console.log("\nPagination info:");
        paginationLines.forEach(line => console.log("  " + line.trim()));
        
        // Test 2: Navigate to page 2
        console.log("\n📄 Test 2: Navigating to page 2");
        const result2 = await client.callTool("get_figma_data", {
          fileKey: "INffIHj89RN7TxM6EkuRAT",
          nodeId: "516:5626",
          page: 2,
        });
        
        const response2Text = result2.content[0].text;
        if (response2Text.includes("currentPage: 2")) {
          console.log("✅ Successfully navigated to page 2!");
        }
        
        // Test 3: Test by-pages mode
        console.log("\n📄 Test 3: Testing 'by-pages' pagination mode");
        const result3 = await client.callTool("get_figma_data", {
          fileKey: "INffIHj89RN7TxM6EkuRAT",
          paginationMode: "by-pages",
          page: 1,
        });
        
        const response3Text = result3.content[0].text;
        if (response3Text.includes("mode: by-pages")) {
          console.log("✅ 'by-pages' mode working correctly!");
          
          // Show what page we got
          const pageNameMatch = response3Text.match(/name: (.+)/);
          if (pageNameMatch) {
            console.log(`  Retrieved page: ${pageNameMatch[1]}`);
          }
        }
        
      } else {
        console.log("ℹ️  Response was small enough to fit without pagination");
        console.log(`Response size: ${responseText.length} characters`);
      }
      
    } catch (toolError) {
      console.error("❌ Tool call error:", toolError.message);
      if (toolError.message.includes("exceeds maximum allowed tokens")) {
        console.error("⚠️  The pagination feature may not be working correctly!");
      }
    }
    
    console.log("\n✅ All pagination tests completed!");
    
  } catch (error) {
    console.error("❌ Error during testing:", error.message);
  } finally {
    await client.close();
    process.exit(0);
  }
}

// Run the test
testPagination().catch(console.error);
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FigmaService, type FigmaAuthOptions } from "./services/figma.js";
import type { SimplifiedDesign } from "./services/simplify-node-response.js";
import yaml from "js-yaml";
import { Logger } from "./utils/logger.js";
import { pluginTools, handlePluginTool } from "./tools/plugin-tools.js";
import { figmaDevTools, handleFigmaDevTool } from "./tools/figma-dev-tools.js";
import { figmaCodegenTools, handleFigmaCodegenTool } from "./tools/figma-codegen-tools.js";
import { designSystemTrackerTools, handleDesignSystemTrackerTool } from "./tools/design-system-tracker.js";

const serverInfo = {
  name: "Figma MCP Server",
  version: process.env.NPM_PACKAGE_VERSION ?? "unknown",
};

type CreateServerOptions = {
  isHTTP?: boolean;
  outputFormat?: "yaml" | "json";
};

function createServer(
  authOptions: FigmaAuthOptions,
  { isHTTP = false, outputFormat = "yaml" }: CreateServerOptions = {},
) {
  const server = new McpServer(serverInfo);
  // const figmaService = new FigmaService(figmaApiKey);
  const figmaService = new FigmaService(authOptions);
  registerTools(server, figmaService, outputFormat);

  Logger.isHTTP = isHTTP;

  return server;
}

function registerTools(
  server: McpServer,
  figmaService: FigmaService,
  outputFormat: "yaml" | "json",
): void {
  // Register plugin tools first
  registerPluginTools(server);

  // Register Figma Dev Mode bridge tools
  registerFigmaDevTools(server);

  // Register new clean codegen tools
  registerFigmaCodegenTools(server);
  
  // Register Design System Evolution Tracker tools
  registerDesignSystemTrackerTools(server);
  // Tool to get file information
  server.tool(
    "get_figma_data",
    "When the nodeId cannot be obtained, obtain the layout information about the entire Figma file",
    {
      fileKey: z
        .string()
        .describe(
          "The key of the Figma file to fetch, often found in a provided URL like figma.com/(file|design)/<fileKey>/...",
        ),
      nodeId: z
        .string()
        .optional()
        .describe(
          "The ID of the node to fetch, often found as URL parameter node-id=<nodeId>, always use if provided",
        ),
      depth: z
        .number()
        .optional()
        .describe(
          "OPTIONAL. Do NOT use unless explicitly requested by the user. Controls how many levels deep to traverse the node tree,",
        ),
    },
    async ({ fileKey, nodeId, depth }) => {
      try {
        Logger.log(
          `Fetching ${
            depth ? `${depth} layers deep` : "all layers"
          } of ${nodeId ? `node ${nodeId} from file` : `full file`} ${fileKey}`,
        );

        let file: SimplifiedDesign;
        if (nodeId) {
          file = await figmaService.getNode(fileKey, nodeId, depth);
        } else {
          file = await figmaService.getFile(fileKey, depth);
        }

        Logger.log(`Successfully fetched file: ${file.name}`);
        const { nodes, globalVars, ...metadata } = file;

        const result = {
          metadata,
          nodes,
          globalVars,
        };

        Logger.log(`Generating ${outputFormat.toUpperCase()} result from file`);
        const formattedResult =
          outputFormat === "json" ? JSON.stringify(result, null, 2) : yaml.dump(result);

        Logger.log("Sending result to client");
        return {
          content: [{ type: "text", text: formattedResult }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error(`Error fetching file ${fileKey}:`, message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error fetching file: ${message}` }],
        };
      }
    },
  );

  // TODO: Clean up all image download related code, particularly getImages in Figma service
  // Tool to download images
  server.tool(
    "download_figma_images",
    "Download SVG and PNG images used in a Figma file based on the IDs of image or icon nodes",
    {
      fileKey: z.string().describe("The key of the Figma file containing the node"),
      nodes: z
        .object({
          nodeId: z
            .string()
            .describe("The ID of the Figma image node to fetch, formatted as 1234:5678"),
          imageRef: z
            .string()
            .optional()
            .describe(
              "If a node has an imageRef fill, you must include this variable. Leave blank when downloading Vector SVG images.",
            ),
          fileName: z.string().describe("The local name for saving the fetched file"),
        })
        .array()
        .describe("The nodes to fetch as images"),
      pngScale: z
        .number()
        .positive()
        .optional()
        .default(2)
        .describe(
          "Export scale for PNG images. Optional, defaults to 2 if not specified. Affects PNG images only.",
        ),
      localPath: z
        .string()
        .describe(
          "The absolute path to the directory where images are stored in the project. If the directory does not exist, it will be created. The format of this path should respect the directory format of the operating system you are running on. Don't use any special character escaping in the path name either.",
        ),
      svgOptions: z
        .object({
          outlineText: z
            .boolean()
            .optional()
            .default(true)
            .describe("Whether to outline text in SVG exports. Default is true."),
          includeId: z
            .boolean()
            .optional()
            .default(false)
            .describe("Whether to include IDs in SVG exports. Default is false."),
          simplifyStroke: z
            .boolean()
            .optional()
            .default(true)
            .describe("Whether to simplify strokes in SVG exports. Default is true."),
        })
        .optional()
        .default({})
        .describe("Options for SVG export"),
    },
    async ({ fileKey, nodes, localPath, svgOptions, pngScale }) => {
      try {
        const imageFills = nodes.filter(({ imageRef }) => !!imageRef) as {
          nodeId: string;
          imageRef: string;
          fileName: string;
        }[];
        const fillDownloads = figmaService.getImageFills(fileKey, imageFills, localPath);
        const renderRequests = nodes
          .filter(({ imageRef }) => !imageRef)
          .map(({ nodeId, fileName }) => ({
            nodeId,
            fileName,
            fileType: fileName.endsWith(".svg") ? ("svg" as const) : ("png" as const),
          }));

        const renderDownloads = figmaService.getImages(
          fileKey,
          renderRequests,
          localPath,
          pngScale,
          svgOptions,
        );

        const downloads = await Promise.all([fillDownloads, renderDownloads]).then(([f, r]) => [
          ...f,
          ...r,
        ]);

        // If any download fails, return false
        const saveSuccess = !downloads.find((success) => !success);
        return {
          content: [
            {
              type: "text",
              text: saveSuccess
                ? `Success, ${downloads.length} images downloaded: ${downloads.join(", ")}`
                : "Failed",
            },
          ],
        };
      } catch (error) {
        Logger.error(`Error downloading images from file ${fileKey}:`, error);
        return {
          isError: true,
          content: [{ type: "text", text: `Error downloading images: ${error}` }],
        };
      }
    },
  );
}

function registerPluginTools(server: McpServer): void {
  // Register get_figma_dev_code tool
  server.tool(
    "get_figma_dev_code",
    "Get the latest CSS and React code extracted from Figma via the plugin. This provides actual dev-mode code generation.",
    {
      format: z
        .enum(["css", "react", "both", "json"])
        .optional()
        .default("both")
        .describe("Format of code to return")
    },
    async (args) => {
      try {
        return await handlePluginTool("get_figma_dev_code", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in get_figma_dev_code:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );

  // Register get_figma_dev_history tool
  server.tool(
    "get_figma_dev_history",
    "Get the history of dev code extractions from the Figma plugin",
    {
      limit: z
        .number()
        .min(1)
        .max(10)
        .optional()
        .default(5)
        .describe("Maximum number of history items to return")
    },
    async (args) => {
      try {
        return await handlePluginTool("get_figma_dev_history", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in get_figma_dev_history:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );

  // Register generate_component_from_figma tool
  server.tool(
    "generate_component_from_figma",
    "Generate a complete React component with styling from the latest Figma dev data",
    {
      componentName: z
        .string()
        .optional()
        .describe("Name for the generated component (optional, will use Figma node name if not provided)"),
      styleType: z
        .enum(["css-modules", "styled-components", "tailwind", "inline"])
        .optional()
        .default("css-modules")
        .describe("Type of styling to generate"),
      includeChildren: z
        .boolean()
        .optional()
        .default(true)
        .describe("Whether to include child components")
    },
    async (args) => {
      try {
        return await handlePluginTool("generate_component_from_figma", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in generate_component_from_figma:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );

  // Register get_All_Layers_CSS tool
  server.tool(
    "get_All_Layers_CSS",
    "Get comprehensive CSS for all layers from the latest Figma extraction (like Figma's 'Copy all layers as CSS'). This provides pixel-perfect CSS for every element in the design.",
    {
      formatted: z
        .boolean()
        .optional()
        .default(true)
        .describe("Whether to return formatted CSS with comments")
    },
    async (args) => {
      try {
        return await handlePluginTool("get_All_Layers_CSS", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in get_All_Layers_CSS:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );

  // Register get_Basic_CSS tool
  server.tool(
    "get_Basic_CSS",
    "Get basic CSS for the main selected element from the latest Figma extraction",
    {
      includeClassName: z
        .boolean()
        .optional()
        .default(true)
        .describe("Whether to include the CSS class name wrapper")
    },
    async (args) => {
      try {
        return await handlePluginTool("get_Basic_CSS", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in get_Basic_CSS:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );

  // Register get_React tool
  server.tool(
    "get_React",
    "Get the complete React component structure from the latest Figma extraction with full component hierarchy",
    {
      includeCSS: z
        .boolean()
        .optional()
        .default(true)
        .describe("Whether to include the comprehensive CSS in the component"),
      componentFormat: z
        .enum(["functional", "class", "arrow"])
        .optional()
        .default("functional")
        .describe("React component format to use")
    },
    async (args) => {
      try {
        return await handlePluginTool("get_React", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in get_React:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );

  // Register get_JSON tool
  server.tool(
    "get_JSON",
    "Get the raw JSON data from the latest Figma extraction with complete layout and styling information",
    {
      includeChildren: z
        .boolean()
        .optional()
        .default(true)
        .describe("Whether to include child elements data"),
      pretty: z
        .boolean()
        .optional()
        .default(true)
        .describe("Whether to format JSON with indentation")
    },
    async (args) => {
      try {
        return await handlePluginTool("get_JSON", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in get_JSON:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );

  // Register get_UI_Screenshots tool
  server.tool(
    "get_UI_Screenshots",
    "Get information about UI screenshots and visual assets from the Figma extraction",
    {
      includeImageData: z
        .boolean()
        .optional()
        .default(false)
        .describe("Whether to include base64 image data (if available)")
    },
    async (args) => {
      try {
        return await handlePluginTool("get_UI_Screenshots", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in get_UI_Screenshots:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );

}

function registerFigmaDevTools(server: McpServer): void {
  // Register get_figma_dev_mode_code tool
  server.tool(
    "get_figma_dev_mode_code",
    "Get React + Tailwind code from Figma's official Dev Mode MCP Server. Works with current selection in Figma Desktop or specific node ID.",
    {
      nodeId: z
        .string()
        .optional()
        .describe("Optional Figma node ID. If not provided, uses current selection in Figma Desktop.")
    },
    async (args) => {
      try {
        return await handleFigmaDevTool("get_figma_dev_mode_code", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in get_figma_dev_mode_code:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );

  // Register check_figma_dev_connection tool
  server.tool(
    "check_figma_dev_connection",
    "Check if Figma's Dev Mode MCP Server is running and connected",
    {},
    async (args) => {
      try {
        return await handleFigmaDevTool("check_figma_dev_connection", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in check_figma_dev_connection:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );
}

function registerFigmaCodegenTools(server: McpServer): void {
  // Register clean CSS tool
  server.tool(
    "get_figma_css",
    "Get clean CSS from Figma using native getCSSAsync() API - follows Dev Mode standards",
    {
      nodeId: z
        .string()
        .optional()
        .describe("Optional Figma node ID. If not provided, uses current selection."),
      format: z
        .enum(["raw", "formatted", "with-selector"])
        .optional()
        .default("formatted")
        .describe("CSS output format")
    },
    async (args) => {
      try {
        return await handleFigmaCodegenTool("get_figma_css", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in get_figma_css:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );

  // Register clean React component tool
  server.tool(
    "get_react_component",
    "Generate clean React component with TypeScript - minimal, production-ready",
    {
      componentName: z
        .string()
        .optional()
        .describe("Custom component name (optional, will sanitize Figma name if not provided)"),
      styleType: z
        .enum(["css-modules", "inline", "external"])
        .optional()
        .default("css-modules")
        .describe("How to handle component styles"),
      includeProps: z
        .boolean()
        .optional()
        .default(true)
        .describe("Include TypeScript interface for props")
    },
    async (args) => {
      try {
        return await handleFigmaCodegenTool("get_react_component", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in get_react_component:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );

  // Register Tailwind component tool
  server.tool(
    "get_tailwind_component",
    "Generate React component with Tailwind classes - smart design token conversion",
    {
      componentName: z
        .string()
        .optional()
        .describe("Custom component name (optional)"),
      useDesignTokens: z
        .boolean()
        .optional()
        .default(true)
        .describe("Convert Figma design tokens to Tailwind variables"),
      responsiveBreakpoints: z
        .boolean()
        .optional()
        .default(false)
        .describe("Include responsive Tailwind classes")
    },
    async (args) => {
      try {
        return await handleFigmaCodegenTool("get_tailwind_component", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in get_tailwind_component:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );

  // Register styled-components tool
  server.tool(
    "get_styled_component",
    "Generate styled-components React component - clean, modern styling",
    {
      componentName: z
        .string()
        .optional()
        .describe("Custom component name (optional)"),
      useTheme: z
        .boolean()
        .optional()
        .default(false)
        .describe("Include theme props in styled-components"),
      exportType: z
        .enum(["default", "named", "both"])
        .optional()
        .default("default")
        .describe("Component export format")
    },
    async (args) => {
      try {
        return await handleFigmaCodegenTool("get_styled_component", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in get_styled_component:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );

  // Register codegen plugin generator
  server.tool(
    "generate_codegen_plugin",
    "Generate a proper Figma Dev Mode codegen plugin following official standards",
    {
      pluginName: z
        .string()
        .optional()
        .default("Custom Codegen Plugin")
        .describe("Name for the generated plugin"),
      supportedLanguages: z
        .array(z.enum(["React", "Vue", "Angular", "CSS", "Tailwind", "SCSS"]))
        .optional()
        .default(["React", "CSS"])
        .describe("Languages the plugin should support"),
      includePreferences: z
        .boolean()
        .optional()
        .default(true)
        .describe("Include codegen preferences (unit scaling, select options)")
    },
    async (args) => {
      try {
        return await handleFigmaCodegenTool("generate_codegen_plugin", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in generate_codegen_plugin:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );
}

function registerDesignSystemTrackerTools(server: McpServer): void {
  // Register design token extraction tool
  server.tool(
    "extract_design_tokens",
    "Extract and catalog design tokens from current Figma selection. Maps colors, spacing, typography to create the foundation for dependency tracking.",
    {
      includeVariables: z
        .boolean()
        .optional()
        .default(true)
        .describe("Include Figma variables (design tokens) in extraction"),
      includeStyles: z
        .boolean()
        .optional()
        .default(true)
        .describe("Include text/color styles in extraction"),
      scanDepth: z
        .number()
        .optional()
        .default(3)
        .describe("How deep to scan component hierarchy for tokens")
    },
    async (args) => {
      try {
        return await handleDesignSystemTrackerTool("extract_design_tokens", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in extract_design_tokens:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );

  // Register dependency graph builder
  server.tool(
    "build_dependency_graph",
    "Scan codebase and build dependency graph mapping design token usage across files. This is the foundation for impact analysis.",
    {
      codebasePath: z
        .string()
        .optional()
        .default("./src")
        .describe("Path to codebase root directory to scan"),
      filePatterns: z
        .array(z.string())
        .optional()
        .default(["**/*.{ts,tsx,js,jsx,css,scss,vue}"])
        .describe("File patterns to scan for token usage"),
      tokenFormats: z
        .array(z.string())
        .optional()
        .default(["css-variables", "tailwind-classes", "js-tokens"])
        .describe("Token formats to detect in code"),
      updateExisting: z
        .boolean()
        .optional()
        .default(true)
        .describe("Update existing dependency graph or create new one")
    },
    async (args) => {
      try {
        return await handleDesignSystemTrackerTool("build_dependency_graph", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in build_dependency_graph:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );

  // Register change impact analysis
  server.tool(
    "analyze_token_change_impact",
    "AI-powered analysis of what happens when a design token changes. Identifies affected components, edge cases, and generates migration code.",
    {
      tokenId: z
        .string()
        .describe("ID of the design token being changed"),
      newValue: z
        .string()
        .describe("New value for the design token"),
      changeReason: z
        .string()
        .optional()
        .describe("Optional: Why this change is being made (helps AI analysis)"),
      includeEdgeCases: z
        .boolean()
        .optional()
        .default(true)
        .describe("Include AI analysis of potential edge cases"),
      generateMigration: z
        .boolean()
        .optional()
        .default(true)
        .describe("Generate automatic migration code")
    },
    async (args) => {
      try {
        return await handleDesignSystemTrackerTool("analyze_token_change_impact", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in analyze_token_change_impact:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );

  // Register migration code generator
  server.tool(
    "generate_migration_code",
    "Generate comprehensive migration code for design token changes, including CSS updates, component modifications, and test cases.",
    {
      changeAnalysisId: z
        .string()
        .describe("ID of the change impact analysis to generate migration for"),
      migrationStrategy: z
        .enum(["gradual", "atomic", "feature-flag"])
        .optional()
        .default("gradual")
        .describe("Strategy for rolling out the change"),
      includeTests: z
        .boolean()
        .optional()
        .default(true)
        .describe("Generate test cases for the migration"),
      includeDocs: z
        .boolean()
        .optional()
        .default(true)
        .describe("Generate documentation updates")
    },
    async (args) => {
      try {
        return await handleDesignSystemTrackerTool("generate_migration_code", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in generate_migration_code:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );

  // Register debug tool for token registry
  server.tool(
    "debug_token_registry",
    "Debug tool to check what tokens are currently stored in the design token registry",
    {},
    async (args) => {
      try {
        return await handleDesignSystemTrackerTool("debug_token_registry", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in debug_token_registry:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );

  // Register design system health tracker
  server.tool(
    "track_design_system_health",
    "Monitor design system health over time. Identifies token drift, unused tokens, inconsistent usage patterns.",
    {
      healthChecks: z
        .array(z.enum(["token-drift", "unused-tokens", "inconsistent-usage", "accessibility-compliance", "performance-impact"]))
        .optional()
        .default(["token-drift", "unused-tokens", "inconsistent-usage"])
        .describe("Types of health checks to perform"),
      reportFormat: z
        .enum(["summary", "detailed", "actionable"])
        .optional()
        .default("actionable")
        .describe("Format of the health report")
    },
    async (args) => {
      try {
        return await handleDesignSystemTrackerTool("track_design_system_health", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in track_design_system_health:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );

  // Register token change simulator
  server.tool(
    "simulate_token_change",
    "Simulate a design token change without actually applying it. Perfect for design reviews and impact planning.",
    {
      tokenId: z
        .string()
        .describe("ID of the design token to simulate changing"),
      newValue: z
        .string()
        .describe("Simulated new value for the token"),
      includeVisualDiff: z
        .boolean()
        .optional()
        .default(false)
        .describe("Generate visual diff of affected components (requires rendering)"),
      scope: z
        .enum(["all", "components", "pages", "specific"])
        .optional()
        .default("all")
        .describe("Scope of simulation")
    },
    async (args) => {
      try {
        return await handleDesignSystemTrackerTool("simulate_token_change", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in simulate_token_change:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );

  // Register apply token change
  server.tool(
    "apply_token_change",
    "Apply a previously simulated token change to the actual files. Cannot be undone without rollback.",
    {
      simulationId: z
        .string()
        .describe("ID of the simulation to apply (from simulate_token_change)"),
      confirmApply: z
        .boolean()
        .optional()
        .default(false)
        .describe("Confirm that you want to apply the changes to actual files")
    },
    async (args) => {
      try {
        return await handleDesignSystemTrackerTool("apply_token_change", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in apply_token_change:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );

  // Register rollback token change
  server.tool(
    "rollback_token_change",
    "Rollback a previously applied token change to restore original values.",
    {
      simulationId: z
        .string()
        .describe("ID of the applied simulation to rollback"),
      confirmRollback: z
        .boolean()
        .optional()
        .default(false)
        .describe("Confirm that you want to rollback the changes")
    },
    async (args) => {
      try {
        return await handleDesignSystemTrackerTool("rollback_token_change", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in rollback_token_change:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );

  // Register list simulations
  server.tool(
    "list_token_simulations",
    "List all active token change simulations and their status.",
    {
      status: z
        .enum(["all", "applied", "simulated"])
        .optional()
        .default("all")
        .describe("Filter simulations by status")
    },
    async (args) => {
      try {
        return await handleDesignSystemTrackerTool("list_token_simulations", args);
      } catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        Logger.error("Error in list_token_simulations:", message);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }],
        };
      }
    }
  );
}

export { createServer };

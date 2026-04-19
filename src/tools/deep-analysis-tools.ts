import { z } from "zod";
import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
import { FigmaService } from "../services/figma.js";
import { Logger } from "../utils/logger.js";
import type { SimplifiedDesign, SimplifiedNode } from "../services/simplify-node-response.js";
import type {
  FrameSummary,
  PageSummary,
  ScreenTypeGroup,
  AppFlow,
  NavigationPattern,
  AppStructureAnalysis,
  ColorToken,
  TypographyToken,
} from "./shared/figma-types.js";

// Argument schemas (Zod) — kept separately so we can both describe the tool
// surface as JSON Schema for the MCP `Tool` type AND derive the TypeScript
// argument types via `z.infer` at the handler call sites.
const analyzeAppStructureArgsSchema = z.object({
  fileKey: z.string().describe("The Figma file key to analyze"),
  includeAllFrames: z.boolean().optional().default(true).describe("Include detailed analysis of all frames"),
  extractAssets: z.boolean().optional().default(false).describe("Extract asset information for each frame"),
  maxDepth: z.number().optional().default(4).describe("Maximum depth to traverse for each node"),
  outputFormat: z.enum(["detailed", "summary", "json"]).optional().default("detailed").describe("Output format"),
});

const batchExtractFramesArgsSchema = z.object({
  fileKey: z.string().describe("The Figma file key"),
  frameIds: z.array(z.string()).describe("Array of frame node IDs to extract"),
  includeCSS: z.boolean().optional().default(true).describe("Include CSS for each frame"),
  includeLayout: z.boolean().optional().default(true).describe("Include layout information"),
  includeChildren: z.boolean().optional().default(true).describe("Include child element details"),
});

const mapAppFlowArgsSchema = z.object({
  fileKey: z.string().describe("The Figma file key"),
  identifyScreenTypes: z.boolean().optional().default(true).describe("Identify different screen types (settings, onboarding, etc.)"),
  mapUserJourney: z.boolean().optional().default(true).describe("Map potential user journey paths"),
});

// Tool descriptors with JSON-Schema `inputSchema`, conforming to `Tool`
// from @modelcontextprotocol/sdk. Registration in `mcp.ts` uses inline Zod
// schemas directly, so this array is informational.
export const deepAnalysisTools: Tool[] = [
  {
    name: "analyze_app_structure",
    description: "Perform comprehensive analysis of entire app structure, extracting detailed information from all pages and key frames without manual selection",
    inputSchema: {
      type: "object",
      properties: {
        fileKey: { type: "string", description: "The Figma file key to analyze" },
        includeAllFrames: { type: "boolean", default: true, description: "Include detailed analysis of all frames" },
        extractAssets: { type: "boolean", default: false, description: "Extract asset information for each frame" },
        maxDepth: { type: "number", default: 4, description: "Maximum depth to traverse for each node" },
        outputFormat: { type: "string", enum: ["detailed", "summary", "json"], default: "detailed", description: "Output format" },
      },
      required: ["fileKey"],
    },
  },
  {
    name: "batch_extract_frames",
    description: "Extract detailed CSS, layout, and component information from multiple frames at once",
    inputSchema: {
      type: "object",
      properties: {
        fileKey: { type: "string", description: "The Figma file key" },
        frameIds: { type: "array", items: { type: "string" }, description: "Array of frame node IDs to extract" },
        includeCSS: { type: "boolean", default: true, description: "Include CSS for each frame" },
        includeLayout: { type: "boolean", default: true, description: "Include layout information" },
        includeChildren: { type: "boolean", default: true, description: "Include child element details" },
      },
      required: ["fileKey", "frameIds"],
    },
  },
  {
    name: "map_app_flow",
    description: "Analyze app navigation flow and screen relationships based on naming patterns and structure",
    inputSchema: {
      type: "object",
      properties: {
        fileKey: { type: "string", description: "The Figma file key" },
        identifyScreenTypes: { type: "boolean", default: true, description: "Identify different screen types (settings, onboarding, etc.)" },
        mapUserJourney: { type: "boolean", default: true, description: "Map potential user journey paths" },
      },
      required: ["fileKey"],
    },
  },
];

export async function handleDeepAnalysisTool(
  toolName: string,
  args: unknown,
  figmaService: FigmaService
): Promise<CallToolResult> {
  switch (toolName) {
    case "analyze_app_structure":
      return await analyzeAppStructure(analyzeAppStructureArgsSchema.parse(args), figmaService);
    case "batch_extract_frames":
      return await batchExtractFrames(args, figmaService);
    case "map_app_flow":
      return await mapAppFlow(args, figmaService);
    default:
      throw new Error(`Unknown deep analysis tool: ${toolName}`);
  }
}

async function analyzeAppStructure(
  args: z.infer<typeof analyzeAppStructureArgsSchema>,
  figmaService: FigmaService
): Promise<CallToolResult> {
  try {
    const { fileKey, includeAllFrames, extractAssets, maxDepth, outputFormat } = args;

    Logger.important(`Starting comprehensive app structure analysis for ${fileKey}`);

    // Get complete file structure
    const fileData: SimplifiedDesign = await figmaService.getFile(fileKey, maxDepth);

    const analysis: AppStructureAnalysis = {
      metadata: {
        fileName: fileData.name,
        fileKey,
        lastModified: fileData.lastModified,
        analysisTimestamp: new Date().toISOString()
      },
      structure: {
        totalPages: 0,
        totalFrames: 0,
        totalElements: 0,
        pages: []
      },
      designSystem: {
        colors: [],
        typography: [],
        components: [],
        patterns: []
      },
      appFlow: {
        screenTypes: {},
        navigationPatterns: [],
        userJourneys: []
      }
    };

    // Analyze each page
    if (fileData.nodes) {
      for (const page of fileData.nodes) {
        if (page.type === "CANVAS") {
          analysis.structure.totalPages++;

          const pageAnalysis: PageSummary = {
            id: page.id,
            name: page.name,
            type: page.type,
            frameCount: 0,
            frames: [],
            screenType: identifyScreenType(page.name),
            totalElements: countElements(page)
          };

          // Analyze frames within the page
          if (page.children && includeAllFrames) {
            for (const child of page.children) {
              if (child.type === "FRAME" || child.type === "COMPONENT" || child.type === "INSTANCE") {
                pageAnalysis.frameCount++;
                analysis.structure.totalFrames++;

                const frameAnalysis: FrameSummary = {
                  id: child.id,
                  name: child.name,
                  type: child.type,
                  width: child.boundingBox?.width ?? 0,
                  height: child.boundingBox?.height ?? 0,
                  screenType: identifyScreenType(child.name),
                  hasPrototype: false, // TODO: Extract prototype info
                  childCount: child.children ? child.children.length : 0
                };

                pageAnalysis.frames.push(frameAnalysis);
              }
            }
          }

          analysis.structure.totalElements += pageAnalysis.totalElements ?? 0;
          analysis.structure.pages.push(pageAnalysis);
        }
      }
    }

    // Analyze design system
    if (fileData.globalVars?.styles) {
      analysis.designSystem.colors = extractColorTokens(fileData.globalVars.styles);
      analysis.designSystem.typography = extractTypographyTokens(fileData.globalVars.styles);
    }

    // Analyze app flow patterns
    analysis.appFlow = analyzeAppFlowPatterns(analysis.structure.pages);

    Logger.log(`Analysis complete: ${analysis.structure.totalPages} pages, ${analysis.structure.totalFrames} frames`);

    // Format output
    let formattedOutput: string;
    switch (outputFormat) {
      case "summary":
        formattedOutput = formatAnalysisSummary(analysis);
        break;
      case "json":
        formattedOutput = JSON.stringify(analysis, null, 2);
        break;
      case "detailed":
      default:
        formattedOutput = formatDetailedAnalysis(analysis);
        break;
    }

    return {
      content: [{ type: "text", text: formattedOutput }]
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    Logger.error(`Error in app structure analysis:`, message);
    return {
      isError: true,
      content: [{ type: "text", text: `Error: ${message}` }]
    };
  }
}

// Helper functions
function identifyScreenType(name: string): string {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('setting')) return 'settings';
  if (lowerName.includes('onboard')) return 'onboarding';
  if (lowerName.includes('home') || lowerName.includes('main')) return 'home';
  if (lowerName.includes('profile')) return 'profile';
  if (lowerName.includes('lesson')) return 'lessons';
  if (lowerName.includes('ai') || lowerName.includes('chat')) return 'ai';
  if (lowerName.includes('preview')) return 'preview';
  if (lowerName.includes('notification')) return 'notifications';
  if (lowerName.includes('language')) return 'language';
  if (lowerName.includes('calendar')) return 'calendar';
  if (lowerName.includes('sync')) return 'sync';
  return 'unknown';
}

function countElements(node: SimplifiedNode): number {
  let count = 1;
  if (node.children) {
    for (const child of node.children) {
      count += countElements(child);
    }
  }
  return count;
}

function extractColorTokens(_styles: SimplifiedDesign["globalVars"]["styles"]): ColorToken[] {
  // TODO: Implement color token extraction
  return [];
}

function extractTypographyTokens(_styles: SimplifiedDesign["globalVars"]["styles"]): TypographyToken[] {
  // TODO: Implement typography token extraction
  return [];
}

function analyzeAppFlowPatterns(pages: PageSummary[]): AppFlow {
  const screenTypes: ScreenTypeGroup = {};
  const patterns: NavigationPattern[] = [];

  // Group screens by type
  pages.forEach((page: PageSummary) => {
    page.frames.forEach((frame: FrameSummary) => {
      const type = frame.screenType ?? 'unknown';
      if (!screenTypes[type]) {
        screenTypes[type] = [];
      }
      screenTypes[type].push(frame);
    });
  });

  // Identify navigation patterns
  const settings = screenTypes.settings ?? [];
  if (settings.length > 1) {
    patterns.push({
      type: 'settings_flow',
      description: 'Multiple settings screens indicating complex settings navigation',
      screens: settings.length
    });
  }

  return {
    screenTypes,
    navigationPatterns: patterns,
    userJourneys: [] // TODO: Implement journey mapping
  };
}

function formatDetailedAnalysis(analysis: AppStructureAnalysis): string {
  return `# 📱 Luminism App - Comprehensive Structure Analysis

## 📊 Overview
- **File**: ${analysis.metadata.fileName}
- **Pages**: ${analysis.structure.totalPages}
- **Frames**: ${analysis.structure.totalFrames}
- **Total Elements**: ${analysis.structure.totalElements}
- **Analysis Date**: ${analysis.metadata.analysisTimestamp}

## 📂 Page Structure
${analysis.structure.pages.map(page => `
### ${page.name} (${page.frameCount} frames)
- **Type**: ${page.screenType}
- **Elements**: ${page.totalElements}
- **Frames**: ${page.frames.map(f => `\n  - ${f.name} (${f.width}×${f.height}) - ${f.screenType}`).join('')}
`).join('\n')}

## 🎨 Design System
- **Colors**: ${analysis.designSystem.colors.length} tokens
- **Typography**: ${analysis.designSystem.typography.length} styles
- **Components**: ${analysis.designSystem.components.length} reusable components

## 🔄 App Flow Analysis
${Object.entries(analysis.appFlow.screenTypes).map(([type, screens]) =>
  `- **${type}**: ${screens.length} screens`
).join('\n')}

## 🚀 Navigation Patterns
${analysis.appFlow.navigationPatterns.map(pattern =>
  `- **${pattern.type}**: ${pattern.description} (${pattern.screens} screens)`
).join('\n')}
`;
}

function formatAnalysisSummary(analysis: AppStructureAnalysis): string {
  return `📱 ${analysis.metadata.fileName} - ${analysis.structure.totalPages} pages, ${analysis.structure.totalFrames} frames, ${analysis.structure.totalElements} elements`;
}

// Placeholder for batch extraction (to be implemented)
async function batchExtractFrames(_args: unknown, _figmaService: FigmaService): Promise<CallToolResult> {
  return {
    content: [{ type: "text", text: "Batch frame extraction - Coming soon!" }]
  };
}

// Placeholder for app flow mapping (to be implemented)
async function mapAppFlow(_args: unknown, _figmaService: FigmaService): Promise<CallToolResult> {
  return {
    content: [{ type: "text", text: "App flow mapping - Coming soon!" }]
  };
}

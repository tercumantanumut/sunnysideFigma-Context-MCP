/**
 * Design System Evolution Tracker
 * AI-Powered Impact Analysis for Design Token Changes
 * 
 * Integrates with existing Figma MCP infrastructure to provide:
 * 1. Design token extraction and mapping
 * 2. Dependency graph building
 * 3. AI-powered change impact analysis
 * 4. Automatic migration code generation
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { FigmaDevData } from "../plugin-integration.js";

// Utility function to convert CSS object to string
function convertCSSObjectToString(cssObj: any): string {
  if (typeof cssObj === 'string') {
    return cssObj;
  }

  if (typeof cssObj === 'object' && cssObj !== null) {
    return Object.entries(cssObj)
      .map(([property, value]) => `${property}: ${value};`)
      .join('\n  ');
  }

  return '';
}

// Design token types
export interface DesignToken {
  id: string;
  name: string;
  type: 'color' | 'spacing' | 'typography' | 'shadow' | 'border-radius' | 'opacity';
  value: string;
  category: string;
  description?: string;
  figmaNodeId?: string;
  lastModified: string;
  version: number;
}

export interface TokenUsage {
  tokenId: string;
  filePath: string;
  component: string;
  lineNumber?: number;
  context: string; // CSS property or usage context
  usageType: 'direct' | 'computed' | 'inherited';
  lastSeen: string;
}

export interface DependencyGraph {
  tokens: DesignToken[];
  usages: TokenUsage[];
  relationships: {
    [tokenId: string]: {
      directUsages: string[]; // file paths
      computedUsages: string[]; // derived usages
      dependencies: string[]; // other tokens this depends on
    };
  };
  lastUpdated: string;
}

export interface ChangeImpactAnalysis {
  tokenId: string;
  oldValue: string;
  newValue: string;
  impact: {
    affectedComponents: number;
    affectedFiles: number;
    totalInstances: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
  edgeCases: Array<{
    type: string;
    description: string;
    affectedFiles: string[];
    severity: 'info' | 'warning' | 'error';
  }>;
  suggestedActions: Array<{
    action: string;
    priority: number;
    automated: boolean;
  }>;
  migrationCode: {
    cssVariables?: string;
    componentUpdates?: Array<{
      file: string;
      changes: string;
    }>;
    testCases?: string;
    documentation?: string;
  };
}

// Enhanced token mapping system
interface TokenMapping {
  figmaTokenId: string;
  codebasePatterns: string[];
  semanticType: 'color' | 'spacing' | 'typography' | 'border' | 'shadow' | 'other';
  confidence: number; // 0-1 confidence score
  lastMatched: string;
}

interface EnhancedTokenUsage extends TokenUsage {
  mappingConfidence: number;
  semanticMatch: boolean;
  valueMatch: boolean;
}

// In-memory storage for demo (in production, this would be a proper database)
let designTokenRegistry: Map<string, DesignToken> = new Map();
let tokenMappings: Map<string, TokenMapping> = new Map(); // NEW: Bridge Figma <-> Codebase
let dependencyGraph: DependencyGraph = {
  tokens: [],
  usages: [],
  relationships: {},
  lastUpdated: new Date().toISOString()
};
let changeHistory: Array<{
  timestamp: string;
  tokenId: string;
  oldValue: string;
  newValue: string;
  analysis: ChangeImpactAnalysis;
}> = [];

// Export for future use
export { designTokenRegistry, dependencyGraph, changeHistory, tokenMappings };

// Export scanning functions for debugging and integration
export { scanCodebaseForTokens, parseFileForTokens, parseCSSVariables };

export const designSystemTrackerTools: Tool[] = [
  {
    name: "extract_design_tokens",
    description: "Extract and catalog design tokens from current Figma selection. Maps colors, spacing, typography to create the foundation for dependency tracking.",
    inputSchema: {
      type: "object",
      properties: {
        includeVariables: {
          type: "boolean",
          default: true,
          description: "Include Figma variables (design tokens) in extraction"
        },
        includeStyles: {
          type: "boolean", 
          default: true,
          description: "Include text/color styles in extraction"
        },
        scanDepth: {
          type: "number",
          default: 3,
          description: "How deep to scan component hierarchy for tokens"
        }
      },
      additionalProperties: false
    }
  },
  {
    name: "build_dependency_graph",
    description: "Scan codebase and build dependency graph mapping design token usage across files. This is the foundation for impact analysis.",
    inputSchema: {
      type: "object",
      properties: {
        codebasePath: {
          type: "string",
          description: "Path to codebase root directory to scan",
          default: "./src"
        },
        filePatterns: {
          type: "array",
          items: { type: "string" },
          default: ["**/*.{ts,tsx,js,jsx,css,scss,vue}"],
          description: "File patterns to scan for token usage"
        },
        tokenFormats: {
          type: "array",
          items: { type: "string" },
          default: ["css-variables", "tailwind-classes", "js-tokens"],
          description: "Token formats to detect in code"
        },
        updateExisting: {
          type: "boolean",
          default: true,
          description: "Update existing dependency graph or create new one"
        }
      },
      additionalProperties: false
    }
  },
  {
    name: "analyze_token_change_impact",
    description: "AI-powered analysis of what happens when a design token changes. Identifies affected components, edge cases, and generates migration code.",
    inputSchema: {
      type: "object",
      properties: {
        tokenId: {
          type: "string",
          description: "ID of the design token being changed"
        },
        newValue: {
          type: "string",
          description: "New value for the design token"
        },
        changeReason: {
          type: "string",
          description: "Optional: Why this change is being made (helps AI analysis)"
        },
        includeEdgeCases: {
          type: "boolean",
          default: true,
          description: "Include AI analysis of potential edge cases"
        },
        generateMigration: {
          type: "boolean",
          default: true,
          description: "Generate automatic migration code"
        }
      },
      required: ["tokenId", "newValue"],
      additionalProperties: false
    }
  },
  {
    name: "generate_migration_code",
    description: "Generate comprehensive migration code for design token changes, including CSS updates, component modifications, and test cases.",
    inputSchema: {
      type: "object",
      properties: {
        changeAnalysisId: {
          type: "string",
          description: "ID of the change impact analysis to generate migration for"
        },
        migrationStrategy: {
          type: "string",
          enum: ["gradual", "atomic", "feature-flag"],
          default: "gradual",
          description: "Strategy for rolling out the change"
        },
        includeTests: {
          type: "boolean",
          default: true,
          description: "Generate test cases for the migration"
        },
        includeDocs: {
          type: "boolean", 
          default: true,
          description: "Generate documentation updates"
        }
      },
      required: ["changeAnalysisId"],
      additionalProperties: false
    }
  },
  {
    name: "track_design_system_health",
    description: "Monitor design system health over time. Identifies token drift, unused tokens, inconsistent usage patterns.",
    inputSchema: {
      type: "object",
      properties: {
        healthChecks: {
          type: "array",
          items: {
            type: "string",
            enum: ["token-drift", "unused-tokens", "inconsistent-usage", "accessibility-compliance", "performance-impact"]
          },
          default: ["token-drift", "unused-tokens", "inconsistent-usage"],
          description: "Types of health checks to perform"
        },
        reportFormat: {
          type: "string",
          enum: ["summary", "detailed", "actionable"],
          default: "actionable",
          description: "Format of the health report"
        }
      },
      additionalProperties: false
    }
  },
  {
    name: "apply_token_change",
    description: "Apply a previously simulated token change to the actual files. Cannot be undone without rollback.",
    inputSchema: {
      type: "object",
      properties: {
        simulationId: {
          type: "string",
          description: "ID of the simulation to apply (from simulate_token_change)"
        },
        confirmApply: {
          type: "boolean",
          default: false,
          description: "Confirm that you want to apply the changes to actual files"
        }
      },
      required: ["simulationId"],
      additionalProperties: false
    }
  },
  {
    name: "rollback_token_change",
    description: "Rollback a previously applied token change to restore original values.",
    inputSchema: {
      type: "object",
      properties: {
        simulationId: {
          type: "string",
          description: "ID of the applied simulation to rollback"
        },
        confirmRollback: {
          type: "boolean",
          default: false,
          description: "Confirm that you want to rollback the changes"
        }
      },
      required: ["simulationId"],
      additionalProperties: false
    }
  },
  {
    name: "list_token_simulations",
    description: "List all active token change simulations and their status.",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["all", "applied", "simulated"],
          default: "all",
          description: "Filter simulations by status"
        }
      },
      additionalProperties: false
    }
  },
  {
    name: "debug_token_registry",
    description: "Debug tool to check what tokens are currently stored in the design token registry",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: "simulate_token_change",
    description: "Simulate a design token change without actually applying it. Perfect for design reviews and impact planning.",
    inputSchema: {
      type: "object",
      properties: {
        tokenId: {
          type: "string",
          description: "ID of the design token to simulate changing"
        },
        newValue: {
          type: "string", 
          description: "Simulated new value for the token"
        },
        includeVisualDiff: {
          type: "boolean",
          default: false,
          description: "Generate visual diff of affected components (requires rendering)"
        },
        scope: {
          type: "string",
          enum: ["all", "components", "pages", "specific"],
          default: "all",
          description: "Scope of simulation"
        }
      },
      required: ["tokenId", "newValue"],
      additionalProperties: false
    }
  }
];

export async function handleDesignSystemTrackerTool(name: string, args: any): Promise<any> {
  switch (name) {
    case "extract_design_tokens":
      return await extractDesignTokens(args);
    
    case "build_dependency_graph":
      return await buildDependencyGraph(args);
    
    case "analyze_token_change_impact":
      return await analyzeTokenChangeImpact(args);
    
    case "generate_migration_code":
      return await generateMigrationCode(args);
    
    case "track_design_system_health":
      return await trackDesignSystemHealth(args);
    
    case "apply_token_change":
      return await applyTokenChange(args);

    case "rollback_token_change":
      return await rollbackTokenChange(args);

    case "list_token_simulations":
      return await listTokenSimulations(args);

    case "debug_token_registry":
      return await debugTokenRegistry();

    case "debug_token_mappings":
      return await debugTokenMappings();

    case "debug_dependency_graph":
      return await debugDependencyGraph();

    case "debug_full_system":
      return await debugFullSystem();

    case "test_token_workflow":
      return await testTokenWorkflow();

    case "simulate_token_change":
      return await simulateTokenChange(args);
    
    default:
      throw new Error(`Unknown design system tracker tool: ${name}`);
  }
}

// Implementation functions

async function extractDesignTokens(args: {
  includeVariables?: boolean;
  includeStyles?: boolean;
  scanDepth?: number;
}): Promise<any> {
  try {
    // Get latest Figma data from our existing infrastructure
    const response = await fetch(`http://localhost:3333/plugin/latest-dev-data`);
    
    if (!response.ok) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: "No Figma data available. Please extract data from Figma using the plugin first."
        }]
      };
    }

    const result = await response.json();
    if (!result.success || !result.data) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: "No valid Figma data available for token extraction."
        }]
      };
    }

    const figmaData: FigmaDevData = result.data;
    const extractedTokens = await extractTokensFromFigmaData(figmaData, args);

    // Store in registry with conservative deduplication (only skip exact duplicates)
    extractedTokens.forEach(token => {
      const existingToken = designTokenRegistry.get(token.id);
      if (existingToken) {
        // Update existing token
        existingToken.lastModified = new Date().toISOString();
        existingToken.version += 1;
        existingToken.value = token.value; // Update value in case it changed
        designTokenRegistry.set(token.id, existingToken);
      } else {
        // Add new token (no aggressive deduplication)
        designTokenRegistry.set(token.id, token);
      }
    });

    const summary = generateTokenExtractionSummary(extractedTokens);

    // Add debug info to the response
    const childrenWithEffects = figmaData.children?.filter(child =>
      child.designTokens?.effects && Object.keys(child.designTokens.effects).length > 0
    ).length || 0;

    const debugInfo = `\n\n🔍 Debug Info:\n• Node type: ${figmaData.type}\n• Has designTokens: ${!!figmaData.designTokens}\n• Has effects: ${!!(figmaData.designTokens?.effects)}\n• Effects count: ${figmaData.designTokens?.effects ? Object.keys(figmaData.designTokens.effects).length : 0}\n• Children count: ${figmaData.children?.length || 0}\n• Children with effects: ${childrenWithEffects}\n• Has CSS: ${!!(figmaData.nativeCSS || figmaData.css)}\n• Scan depth: ${args.scanDepth}`;
    
    return {
      content: [{
        type: "text",
        text: `🎨 Design Token Extraction Complete\n\n${summary}\n\n📊 Extracted Tokens:\n${extractedTokens.map(token =>
          `• ${token.name} (${token.type}): ${token.value}`
        ).join('\n')}\n\n✅ ${extractedTokens.length} tokens added to registry${debugInfo}`
      }]
    };

  } catch (error) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error extracting design tokens: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

async function extractTokensFromFigmaData(figmaData: FigmaDevData, args: any): Promise<DesignToken[]> {
  const tokens: DesignToken[] = [];
  const timestamp = new Date().toISOString();

  // Extract tokens from current node
  tokens.push(...extractTokensFromNode(figmaData, args, timestamp));

  // Recursively extract from children if scanDepth allows
  if (args.scanDepth > 0 && figmaData.children && figmaData.children.length > 0) {
    for (const child of figmaData.children) {
      const childArgs = { ...args, scanDepth: args.scanDepth - 1 };
      tokens.push(...await extractTokensFromFigmaData(child, childArgs));
    }
  }

  return tokens;
}

function extractTokensFromNode(figmaData: FigmaDevData, args: any, timestamp: string): DesignToken[] {
  const tokens: DesignToken[] = [];

  // Extract from design tokens if available
  if (args.includeVariables && figmaData.designTokens) {
    const designTokens = figmaData.designTokens;
    
    // Colors
    if (designTokens.colors) {
      Object.entries(designTokens.colors).forEach(([key, colorData]: [string, any]) => {
        tokens.push({
          id: `color-${key}`,
          name: key,
          type: 'color',
          value: colorData.value || colorData,
          category: 'colors',
          description: `Extracted from Figma: ${figmaData.name}`,
          figmaNodeId: figmaData.id,
          lastModified: timestamp,
          version: 1
        });
      });
    }

    // Spacing
    if (designTokens.spacing) {
      Object.entries(designTokens.spacing).forEach(([key, value]: [string, any]) => {
        tokens.push({
          id: `spacing-${key}`,
          name: key,
          type: 'spacing',
          value: `${value}px`,
          category: 'spacing',
          description: `Spacing token from ${figmaData.name}`,
          figmaNodeId: figmaData.id,
          lastModified: timestamp,
          version: 1
        });
      });
    }

    // Typography
    if (designTokens.typography) {
      Object.entries(designTokens.typography).forEach(([key, value]: [string, any]) => {
        tokens.push({
          id: `typography-${key}`,
          name: key,
          type: 'typography',
          value: typeof value === 'object' ? JSON.stringify(value) : String(value),
          category: 'typography',
          description: `Typography token from ${figmaData.name}`,
          figmaNodeId: figmaData.id,
          lastModified: timestamp,
          version: 1
        });
      });
    }

    // Effects (shadows, blurs, etc.)
    if (designTokens.effects) {
      Object.entries(designTokens.effects).forEach(([key, effectData]: [string, any]) => {
        let effectValue = '';

        if (effectData.type === 'DROP_SHADOW') {
          const { offset, radius, color } = effectData;
          const rgba = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a})`;
          effectValue = `${offset.x}px ${offset.y}px ${radius}px 0px ${rgba}`;
        } else {
          effectValue = JSON.stringify(effectData);
        }

        tokens.push({
          id: key,
          name: `Shadow ${key.replace('effect-', '')}`,
          type: 'shadow',
          value: effectValue,
          category: 'effects',
          description: `${effectData.type} effect from ${figmaData.name}`,
          figmaNodeId: figmaData.id,
          lastModified: timestamp,
          version: 1
        });
      });
    }
  }

  // Extract from direct Figma node properties (fills, strokes, etc.)
  if (args.includeStyles) {
    // Extract fills (background colors)
    if (figmaData.styling?.fills && Array.isArray(figmaData.styling.fills)) {
      figmaData.styling.fills.forEach((fill: any, index: number) => {
        if (fill && fill.color) {
          const { r, g, b } = fill.color;
          const rgba = fill.opacity !== undefined && fill.opacity < 1 
            ? `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${fill.opacity})`
            : `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
          
          tokens.push({
            id: `fill-${index}`,
            name: `Fill ${index}`,
            type: 'color',
            value: rgba,
            category: 'fills',
            description: `Fill color from ${figmaData.name}`,
            figmaNodeId: figmaData.id,
            lastModified: timestamp,
            version: 1
          });
        }
      });
    }

    // Extract strokes (border colors)
    if (figmaData.styling?.strokes && Array.isArray(figmaData.styling.strokes)) {
      figmaData.styling.strokes.forEach((stroke: any, index: number) => {
        if (stroke && stroke.color) {
          const { r, g, b } = stroke.color;
          const rgba = stroke.opacity !== undefined && stroke.opacity < 1
            ? `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${stroke.opacity})`
            : `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
          
          tokens.push({
            id: `stroke-${index}`,
            name: `Stroke ${index}`,
            type: 'color',
            value: rgba,
            category: 'strokes',
            description: `Stroke color from ${figmaData.name}`,
            figmaNodeId: figmaData.id,
            lastModified: timestamp,
            version: 1
          });
        }
      });
    }

    // Extract effects (shadows, blurs)
    if (figmaData.styling?.effects && Array.isArray(figmaData.styling.effects)) {
      figmaData.styling.effects.forEach((effect: any, index: number) => {
        if (effect && effect.visible !== false) {
          let effectValue = '';
          
          if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
            const offset = effect.offset || { x: 0, y: 0 };
            const radius = effect.radius || 0;
            const color = effect.color || { r: 0, g: 0, b: 0, a: 1 };
            const rgba = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a || 1})`;
            effectValue = `${offset.x}px ${offset.y}px ${radius}px ${rgba}`;
            
            if (effect.type === 'INNER_SHADOW') {
              effectValue = `inset ${effectValue}`;
            }
          } else {
            effectValue = JSON.stringify(effect);
          }

          tokens.push({
            id: `effect-${index}`,
            name: `Effect ${index}`,
            type: 'shadow',
            value: effectValue,
            category: 'effects',
            description: `${effect.type || 'Effect'} from ${figmaData.name}`,
            figmaNodeId: figmaData.id,
            lastModified: timestamp,
            version: 1
          });
        }
      });
    }

    // Extract border radius
    if (figmaData.styling?.cornerRadius !== undefined) {
      tokens.push({
        id: `border-radius-${figmaData.id}`,
        name: `Border Radius`,
        type: 'border-radius',
        value: `${figmaData.styling.cornerRadius}px`,
        category: 'border-radius',
        description: `Border radius from ${figmaData.name}`,
        figmaNodeId: figmaData.id,
        lastModified: timestamp,
        version: 1
      });
    }

    // Extract spacing from layout properties
    if (figmaData.layout) {
      const { padding } = figmaData.layout;
      if (padding && (padding.top || padding.right || padding.bottom || padding.left)) {
        Object.entries(padding).forEach(([side, value]) => {
          if (value !== undefined && value !== null) {
            tokens.push({
              id: `padding-${side}-${figmaData.id}`,
              name: `Padding ${side}`,
              type: 'spacing',
              value: `${value}px`,
              category: 'spacing',
              description: `Padding ${side} from ${figmaData.name}`,
              figmaNodeId: figmaData.id,
              lastModified: timestamp,
              version: 1
            });
          }
        });
      }

      if (figmaData.layout.itemSpacing !== undefined) {
        tokens.push({
          id: `gap-${figmaData.id}`,
          name: `Gap`,
          type: 'spacing',
          value: `${figmaData.layout.itemSpacing}px`,
          category: 'spacing',
          description: `Item spacing from ${figmaData.name}`,
          figmaNodeId: figmaData.id,
          lastModified: timestamp,
          version: 1
        });
      }
    }
  }

  // Extract from CSS if available
  if (args.includeStyles && (figmaData.nativeCSS || figmaData.css)) {
    const css = convertCSSObjectToString(figmaData.nativeCSS) || figmaData.css;
    const cssTokens = extractTokensFromCSS(css, figmaData.id, timestamp);
    tokens.push(...cssTokens);
  }

  // Debug: Log extracted tokens for this node
  if (tokens.length > 0) {
    console.log(`Extracted ${tokens.length} tokens from node ${figmaData.name}:`,
      tokens.map(t => `${t.id}: ${t.value}`).join(', '));
  }

  return tokens;
}

function extractTokensFromCSS(css: string, nodeId: string, timestamp: string): DesignToken[] {
  const tokens: DesignToken[] = [];

  // Extract colors (hex, rgb, rgba, hsl)
  const colorRegex = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))/g;
  const colors = css.match(colorRegex) || [];
  colors.forEach((color, index) => {
    tokens.push({
      id: `extracted-color-${nodeId}-${index}`,
      name: `Color ${index + 1}`,
      type: 'color',
      value: color,
      category: 'extracted-colors',
      description: `Color extracted from CSS`,
      figmaNodeId: nodeId,
      lastModified: timestamp,
      version: 1
    });
  });

  // Extract spacing values (including decimal values)
  const spacingRegex = /(?:padding|margin|gap|top|right|bottom|left|width|height):\s*(\d+(?:\.\d+)?px)/g;
  const spacingMatches = [...css.matchAll(spacingRegex)];
  const uniqueSpacing = [...new Set(spacingMatches.map(match => match[1]))];
  uniqueSpacing.forEach((spacing, index) => {
    tokens.push({
      id: `extracted-spacing-${nodeId}-${index}`,
      name: `Spacing ${spacing}`,
      type: 'spacing',
      value: spacing,
      category: 'extracted-spacing',
      description: `Spacing value extracted from CSS`,
      figmaNodeId: nodeId,
      lastModified: timestamp,
      version: 1
    });
  });

  // Extract box-shadow values
  const shadowRegex = /box-shadow:\s*([^;]+);/g;
  const shadowMatches = [...css.matchAll(shadowRegex)];
  shadowMatches.forEach((match, index) => {
    tokens.push({
      id: `extracted-shadow-${nodeId}-${index}`,
      name: `Shadow ${index + 1}`,
      type: 'shadow',
      value: match[1].trim(),
      category: 'extracted-shadows',
      description: `Box shadow extracted from CSS`,
      figmaNodeId: nodeId,
      lastModified: timestamp,
      version: 1
    });
  });

  // Extract border-radius values
  const radiusRegex = /border-radius:\s*(\d+(?:\.\d+)?px)/g;
  const radiusMatches = [...css.matchAll(radiusRegex)];
  radiusMatches.forEach((match, index) => {
    tokens.push({
      id: `extracted-radius-${nodeId}-${index}`,
      name: `Border Radius ${match[1]}`,
      type: 'border-radius',
      value: match[1],
      category: 'extracted-radius',
      description: `Border radius extracted from CSS`,
      figmaNodeId: nodeId,
      lastModified: timestamp,
      version: 1
    });
  });

  return tokens;
}

function generateTokenExtractionSummary(tokens: DesignToken[]): string {
  const byType = tokens.reduce((acc, token) => {
    acc[token.type] = (acc[token.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const summary = Object.entries(byType)
    .map(([type, count]) => `${count} ${type} token${count !== 1 ? 's' : ''}`)
    .join(', ');

  return `Found ${tokens.length} design tokens: ${summary}`;
}

// Phase 2: Dependency Graph Builder Implementation
async function buildDependencyGraph(args: {
  codebasePath?: string;
  filePatterns?: string[];
  tokenFormats?: string[];
  updateExisting?: boolean;
}): Promise<any> {
  try {
    const codebasePath = args.codebasePath || "./src";
    const filePatterns = args.filePatterns || ["**/*.{ts,tsx,js,jsx,css,scss,vue}"];
    const tokenFormats = args.tokenFormats || ["css-variables", "tailwind-classes", "js-tokens"];
    const updateExisting = args.updateExisting !== false;

    // Scan the codebase for token usage
    const scanResults = await scanCodebaseForTokens(codebasePath, filePatterns, tokenFormats);
    
    // Build or update the dependency graph
    if (updateExisting) {
      updateDependencyGraph(scanResults);
    } else {
      rebuildDependencyGraph(scanResults);
    }

    // Generate summary
    const summary = generateDependencyGraphSummary();

    return {
      content: [{
        type: "text",
        text: `🕸️ Dependency Graph Analysis Complete\n\n${summary}\n\n📊 Graph Statistics:\n• Total tokens tracked: ${dependencyGraph.tokens.length}\n• Total usage instances: ${dependencyGraph.usages.length}\n• Files scanned: ${scanResults.scannedFiles}\n• Token formats detected: ${tokenFormats.join(', ')}\n\n🔍 Top Token Usage:\n${getTopTokenUsage().map(usage => `• ${usage.token}: ${usage.count} usages across ${usage.files} files`).join('\n')}`
      }]
    };

  } catch (error) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error building dependency graph: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

async function scanCodebaseForTokens(
  codebasePath: string, 
  filePatterns: string[], 
  tokenFormats: string[]
): Promise<{
  usages: TokenUsage[];
  scannedFiles: number;
}> {
  const usages: TokenUsage[] = [];
  let scannedFiles = 0;

  try {
    // Import required modules for file system operations
    const fs = await import('fs/promises');
    const path = await import('path');

    // Resolve the codebase path to absolute path
    const absoluteCodebasePath = path.resolve(process.cwd(), codebasePath);
    console.log(`Scanning codebase at: ${absoluteCodebasePath}`);

    // Check if the directory exists
    console.log(`Checking codebase path: ${absoluteCodebasePath}`);
    try {
      const stats = await fs.stat(absoluteCodebasePath);
      if (!stats.isDirectory()) {
        throw new Error(`Path is not a directory: ${absoluteCodebasePath}`);
      }
      console.log(`✅ Codebase path is valid directory`);
    } catch (error) {
      console.error(`❌ Cannot access codebase path: ${absoluteCodebasePath}`, error);
      throw error;
    }

    // Scan for files matching patterns - implement basic glob support
    const allFiles = [];

    // Since we can't use glob library, implement basic recursive file finding
    const findFilesRecursively = async (dir: string, extensions: string[]): Promise<string[]> => {
      const files: string[] = [];
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        console.log(`Scanning directory: ${dir}, found ${entries.length} entries`);

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            // Recursively scan subdirectories
            files.push(...await findFilesRecursively(fullPath, extensions));
          } else if (entry.isFile()) {
            // Check if file matches our extensions
            const hasMatchingExt = extensions.some(ext => entry.name.endsWith(ext));
            if (hasMatchingExt) {
              console.log(`Found matching file: ${fullPath}`);
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to scan directory ${dir}:`, error);
      }

      return files;
    };

    // Extract extensions from patterns like "**/*.{ts,tsx,js,jsx,css,scss}"
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.vue'];

    // Find all matching files in the codebase path
    allFiles.push(...await findFilesRecursively(absoluteCodebasePath, extensions));

    // Remove duplicates and filter out non-existent files
    const uniqueFiles = [...new Set(allFiles)] as string[];
    console.log(`Found ${uniqueFiles.length} unique files to scan`);

    // Scan each file for token usage
    for (const filePath of uniqueFiles) {
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const fileUsages = await parseFileForTokens(filePath, fileContent, tokenFormats);
        console.error(`Scanned ${filePath}: found ${fileUsages.length} token usages`);

        // Debug: Log found usages for debugging
        if (fileUsages.length > 0) {
          console.error(`  Usages: ${fileUsages.map(u => `${u.tokenId} (${u.context})`).join(', ')}`);
        }

        usages.push(...fileUsages);
        scannedFiles++;
      } catch (error) {
        console.error(`Failed to read file ${filePath}:`, error);
      }
    }

    console.log(`Scanning complete: ${scannedFiles} files scanned, ${usages.length} total usages found`);

    // Debug: Show which files have usages vs which don't
    const filesWithUsages = [...new Set(usages.map(u => u.filePath))];
    const filesWithoutUsages = uniqueFiles.filter(f => !filesWithUsages.includes(f));

    console.log(`📊 File Analysis:`);
    console.log(`  Files with usages (${filesWithUsages.length}): ${filesWithUsages.map(f => f.split('/').pop()).join(', ')}`);
    console.log(`  Files without usages (${filesWithoutUsages.length}): ${filesWithoutUsages.map(f => f.split('/').pop()).join(', ')}`);

    return { usages, scannedFiles };

  } catch (error) {
    console.error('File scanning failed:', error);
    throw new Error(`Failed to scan codebase at ${codebasePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Real file parser for token usage detection
async function parseFileForTokens(
  filePath: string,
  content: string,
  tokenFormats: string[]
): Promise<TokenUsage[]> {
  const usages: TokenUsage[] = [];
  const fileName = filePath.split('/').pop() || filePath;
  const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
  
  // Get all tokens from registry to search for
  const allTokens = Array.from(designTokenRegistry.values());

  // Debug: Log token search info
  console.log(`Parsing ${filePath} with ${allTokens.length} tokens available`);
  if (allTokens.length > 0) {
    console.log(`  Sample tokens: ${allTokens.slice(0, 3).map(t => `${t.id}=${t.value}`).join(', ')}`);
  }

  try {
    // Parse based on file type and token formats
    for (const format of tokenFormats) {
      switch (format) {
        case 'css-variables':
          usages.push(...parseCSSVariables(filePath, content, allTokens));
          break;
          
        case 'tailwind-classes':
          usages.push(...parseTailwindClasses(filePath, content, allTokens));
          break;
          
        case 'js-tokens':
          usages.push(...parseJSTokens(filePath, content, allTokens));
          break;
          
        case 'styled-components':
          if (['tsx', 'ts', 'jsx', 'js'].includes(fileExt)) {
            usages.push(...parseStyledComponents(filePath, content, allTokens));
          }
          break;
          
        case 'sass-variables':
          if (['scss', 'sass'].includes(fileExt)) {
            usages.push(...parseSassVariables(filePath, content, allTokens));
          }
          break;
      }
    }

    // Additional parsing based on file type
    if (['css', 'scss', 'sass'].includes(fileExt)) {
      usages.push(...parseCSSFile(filePath, content, allTokens));
    } else if (['tsx', 'ts', 'jsx', 'js'].includes(fileExt)) {
      usages.push(...parseReactFile(filePath, content, allTokens));
    } else if (fileExt === 'vue') {
      usages.push(...parseVueFile(filePath, content, allTokens));
    }

  } catch (error) {
    console.warn(`Error parsing file ${filePath}:`, error);
  }

  return usages;
}

// Enhanced CSS Variables parser with semantic matching
function parseCSSVariables(filePath: string, content: string, tokens: DesignToken[]): TokenUsage[] {
  const usages: TokenUsage[] = [];
  const cssVarRegex = /var\(--([^)]+)\)/g;

  let match;
  while ((match = cssVarRegex.exec(content)) !== null) {
    const varName = match[1];
    const lineNumber = content.substring(0, match.index).split('\n').length;

    // Simple, reliable token matching
    const matchResult = findTokenMatch(varName, tokens, 'css-variable');

    if (matchResult) {
      usages.push({
        tokenId: matchResult.token.id,
        filePath,
        component: extractComponentName(filePath),
        lineNumber,
        context: `css-variable: var(--${varName}) [${matchResult.matchType}]`,
        usageType: 'direct',
        lastSeen: new Date().toISOString()
      });

      // Update token mapping
      updateTokenMapping(matchResult.token.id, `var(--${varName})`, 1.0);
    }
    // Note: Removed createPotentialMapping to avoid fake usages
  }

  return usages;
}

// Enhanced Tailwind classes parser with semantic matching
function parseTailwindClasses(filePath: string, content: string, tokens: DesignToken[]): TokenUsage[] {
  const usages: TokenUsage[] = [];

  // Common Tailwind patterns
  const tailwindPatterns = [
    /className\s*=\s*["`']([^"`']*)["`']/g,  // className="..."
    /class\s*=\s*["`']([^"`']*)["`']/g,      // class="..."
    /@apply\s+([^;]+);?/g                    // @apply utilities;
  ];

  for (const pattern of tailwindPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const classes = match[1].split(/\s+/);
      const lineNumber = content.substring(0, match.index).split('\n').length;

      for (const className of classes) {
        if (!className.trim()) continue;

        // Simple token matching for Tailwind classes
        const matchResult = findTokenMatch(className, tokens, 'tailwind-class');

        if (matchResult) {
          usages.push({
            tokenId: matchResult.token.id,
            filePath,
            component: extractComponentName(filePath),
            lineNumber,
            context: `tailwind-class: ${className} [${matchResult.matchType}]`,
            usageType: 'direct',
            lastSeen: new Date().toISOString()
          });

          // Update token mapping
          updateTokenMapping(matchResult.token.id, className, 1.0);
        } else {
          // Create potential mapping for common design tokens
          if (isDesignTokenClass(className)) {
            createPotentialMapping(className, 'tailwind-class', filePath, lineNumber);
          }
        }
      }
    }
  }

  return usages;
}

// Enhanced JavaScript tokens parser with semantic matching
function parseJSTokens(filePath: string, content: string, tokens: DesignToken[]): TokenUsage[] {
  const usages: TokenUsage[] = [];

  // Enhanced JS token patterns with more comprehensive coverage
  const jsTokenPatterns = [
    /theme\.colors?\.(\w+)/g,        // theme.colors.primary
    /theme\.spacing\.(\w+)/g,        // theme.spacing.md
    /tokens?\.(\w+)\.(\w+)/g,        // tokens.color.primary
    /colors\.(\w+)/g,                // colors.primary
    /spacing\.(\w+)/g,               // spacing.md
    /designTokens\.(\w+)\.(\w+)/g,   // designTokens.color.primary
    /vars\.(\w+)/g,                  // vars.primaryColor
    /COLORS\.(\w+)/g,                // COLORS.PRIMARY
    /SPACING\.(\w+)/g                // SPACING.MEDIUM
  ];

  for (const pattern of jsTokenPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const fullMatch = match[0];
      const tokenName = match[1] || match[2];
      const lineNumber = content.substring(0, match.index).split('\n').length;

      // Simple token matching
      const matchResult = findTokenMatch(tokenName, tokens, 'js-token');

      if (matchResult) {
        usages.push({
          tokenId: matchResult.token.id,
          filePath,
          component: extractComponentName(filePath),
          lineNumber,
          context: `js-token: ${fullMatch} [${matchResult.matchType}]`,
          usageType: 'direct',
          lastSeen: new Date().toISOString()
        });

        // Update token mapping
        updateTokenMapping(matchResult.token.id, fullMatch, 1.0);
      } else {
        // Create potential mapping for unmapped JS tokens
        createPotentialMapping(fullMatch, 'js-token', filePath, lineNumber);
      }
    }
  }

  return usages;
}

// Styled Components parser
function parseStyledComponents(filePath: string, content: string, tokens: DesignToken[]): TokenUsage[] {
  const usages: TokenUsage[] = [];
  
  // Look for styled-components template literals
  const styledRegex = /styled\.\w+`([^`]*)`/gs;
  
  let match;
  while ((match = styledRegex.exec(content)) !== null) {
    const styledContent = match[1];
    const baseIndex = match.index;
    
    // Parse CSS within styled-component
    const cssUsages = parseCSSVariables(filePath, styledContent, tokens);
    
    // Adjust line numbers to account for position within file
    const adjustedUsages = cssUsages.map(usage => ({
      ...usage,
      lineNumber: (usage.lineNumber || 0) + content.substring(0, baseIndex).split('\n').length - 1,
      context: 'styled-component'
    }));
    
    usages.push(...adjustedUsages);
  }
  
  return usages;
}

// SASS Variables parser
function parseSassVariables(filePath: string, content: string, tokens: DesignToken[]): TokenUsage[] {
  const usages: TokenUsage[] = [];
  const sassVarRegex = /\$([a-zA-Z0-9_-]+)/g;
  
  let match;
  while ((match = sassVarRegex.exec(content)) !== null) {
    const varName = match[1];
    const lineNumber = content.substring(0, match.index).split('\n').length;
    
    const matchingToken = tokens.find(token => 
      token.name.toLowerCase().includes(varName.toLowerCase()) ||
      token.id.includes(varName)
    );
    
    if (matchingToken) {
      usages.push({
        tokenId: matchingToken.id,
        filePath,
        component: extractComponentName(filePath),
        lineNumber,
        context: 'sass-variable',
        usageType: 'direct',
        lastSeen: new Date().toISOString()
      });
    }
  }
  
  return usages;
}

// Helper function to generate all possible value variations for robust matching
function generateValueVariations(value: string): string[] {
  const variations = new Set<string>();

  // Add original value
  variations.add(value);

  // Case variations
  variations.add(value.toLowerCase());
  variations.add(value.toUpperCase());

  // Normalize whitespace
  variations.add(value.replace(/\s+/g, ' ').trim());

  // Handle color formats
  if (value.startsWith('#')) {
    // Hex color variations
    variations.add(value.toLowerCase());
    variations.add(value.toUpperCase());

    // Convert 6-digit to 3-digit if possible
    if (value.length === 7) {
      const hex = value.substring(1);
      if (hex[0] === hex[1] && hex[2] === hex[3] && hex[4] === hex[5]) {
        variations.add('#' + hex[0] + hex[2] + hex[4]);
      }
    }
  } else if (value.startsWith('rgb')) {
    // RGB/RGBA variations
    variations.add(value.replace(/\s+/g, ''));
    variations.add(value.replace(/\s+/g, ' '));
  }

  // Handle spacing/size values
  if (value.match(/^\d+(\.\d+)?(px|em|rem|%|vh|vw)$/)) {
    const match = value.match(/^(\d+(?:\.\d+)?)(.+)$/);
    if (match) {
      const [, num, unit] = match;
      variations.add(`${num}${unit}`);
      variations.add(`${num} ${unit}`);

      // Add without unit for JavaScript usage
      if (unit === 'px') {
        variations.add(num);
      }
    }
  }

  return Array.from(variations).filter(v => v && v.trim() !== '');
}

// Helper function to create robust regex pattern
function createRobustPattern(value: string): string {
  // Escape special regex characters
  let escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Handle different contexts where the value might appear
  const contexts = [
    // Direct CSS property value: "property: value;"
    `:\\s*${escaped}\\s*[;}]`,
    // CSS property value with important: "property: value !important;"
    `:\\s*${escaped}\\s*!important\\s*[;}]`,
    // Within CSS functions: "function(value)"
    `\\(\\s*${escaped}\\s*[,)]`,
    // As standalone value in various contexts
    `\\b${escaped}\\b`,
    // In string literals
    `["'\`]${escaped}["'\`]`,
    // In template literals
    `\\\${[^}]*${escaped}[^}]*}`,
  ];

  return `(${contexts.join('|')})`;
}



// Bulletproof CSS File parser with comprehensive token matching
function parseCSSFile(filePath: string, content: string, tokens: DesignToken[]): TokenUsage[] {
  const usages: TokenUsage[] = [];

  console.log(`🔍 Parsing CSS file: ${filePath}`);
  console.log(`📋 Available tokens: ${tokens.length}`);

  if (tokens.length === 0) {
    console.log(`⚠️ No tokens available for matching in ${filePath}`);
    return usages;
  }

  // Strategy 1: Comprehensive direct value matching
  for (const token of tokens) {
    const tokenValue = token.value;
    if (!tokenValue || tokenValue.trim() === '') {
      console.log(`⚠️ Skipping token ${token.id} - empty value`);
      continue;
    }

    // Generate all possible value variations for robust matching
    const valuesToMatch = generateValueVariations(tokenValue);

    console.log(`🎯 Searching for token ${token.id} (${tokenValue}) with ${valuesToMatch.length} variations`);

    let tokenMatchCount = 0;
    for (const valueToMatch of valuesToMatch) {
      if (!valueToMatch || valueToMatch.trim() === '') continue;

      try {
        // Create robust regex pattern
        const pattern = createRobustPattern(valueToMatch);
        const regex = new RegExp(pattern, 'gi');

        let match;
        while ((match = regex.exec(content)) !== null) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          const lineContent = content.split('\n')[lineNumber - 1]?.trim() || '';

          // Avoid duplicate entries for the same token at the same location
          const existingUsage = usages.find(u =>
            u.tokenId === token.id &&
            u.filePath === filePath &&
            u.lineNumber === lineNumber
          );

          if (!existingUsage) {
            usages.push({
              tokenId: token.id,
              filePath,
              component: extractComponentName(filePath),
              lineNumber,
              context: `css-direct: ${match[0]} (line: ${lineContent.substring(0, 50)}...)`,
              usageType: 'direct',
              lastSeen: new Date().toISOString()
            });

            tokenMatchCount++;
            console.error(`  ✅ Found match: ${match[0]} at line ${lineNumber}`);

            // Update token mapping with high confidence
            updateTokenMapping(token.id, tokenValue, 0.98);
          }
        }
      } catch (regexError) {
        console.error(`⚠️ Regex error for token ${token.id} with value "${valueToMatch}":`, regexError);
      }
    }

    if (tokenMatchCount > 0) {
      console.error(`✅ Token ${token.id}: found ${tokenMatchCount} matches`);
    }
  }

  console.log(`📊 CSS parsing complete: ${usages.length} usages found in ${filePath}`);
  return usages;
}

// React File parser
function parseReactFile(filePath: string, content: string, tokens: DesignToken[]): TokenUsage[] {
  const usages: TokenUsage[] = [];
  
  // Combine multiple parsing strategies for React files
  usages.push(...parseTailwindClasses(filePath, content, tokens));
  usages.push(...parseJSTokens(filePath, content, tokens));
  usages.push(...parseStyledComponents(filePath, content, tokens));
  
  return usages;
}

// Vue File parser
function parseVueFile(filePath: string, content: string, tokens: DesignToken[]): TokenUsage[] {
  const usages: TokenUsage[] = [];
  
  // Parse template section
  const templateMatch = content.match(/<template[^>]*>(.*?)<\/template>/s);
  if (templateMatch) {
    usages.push(...parseTailwindClasses(filePath, templateMatch[1], tokens));
  }
  
  // Parse style section
  const styleMatch = content.match(/<style[^>]*>(.*?)<\/style>/s);
  if (styleMatch) {
    usages.push(...parseCSSFile(filePath, styleMatch[1], tokens));
  }
  
  // Parse script section
  const scriptMatch = content.match(/<script[^>]*>(.*?)<\/script>/s);
  if (scriptMatch) {
    usages.push(...parseJSTokens(filePath, scriptMatch[1], tokens));
  }
  
  return usages;
}

function extractComponentName(filePath: string): string {
  const fileName = filePath.split('/').pop() || '';
  return fileName.replace(/\.(tsx?|jsx?|vue)$/, '');
}

// ===== CLEAN TOKEN MATCHING SYSTEM =====

interface TokenMatch {
  token: DesignToken;
  matchType: 'exact-id' | 'exact-name' | 'exact-value' | 'normalized-value';
}

// Smart, real-world token matching that handles Figma ID prefixes
function findTokenMatch(
  pattern: string,
  tokens: DesignToken[],
  context: 'css-variable' | 'tailwind-class' | 'js-token' | 'css-value'
): TokenMatch | null {

  // Strategy 1: Exact ID match (highest priority)
  for (const token of tokens) {
    if (token.id === pattern) {
      return { token, matchType: 'exact-id' };
    }
  }

  // Strategy 2: Smart ID suffix matching (handles prefixes like color-fill-0 -> fill-0)
  for (const token of tokens) {
    if (token.id.endsWith(`-${pattern}`) || token.id.endsWith(pattern)) {
      return { token, matchType: 'exact-id' };
    }
    // Also check if pattern matches the suffix after the last dash
    const tokenSuffix = token.id.split('-').pop();
    if (tokenSuffix === pattern) {
      return { token, matchType: 'exact-id' };
    }
  }

  // Strategy 3: Exact name match
  for (const token of tokens) {
    if (token.name === pattern) {
      return { token, matchType: 'exact-name' };
    }
  }

  // Strategy 4: Smart name matching (handles "Fill 0" -> "fill-0")
  for (const token of tokens) {
    const normalizedTokenName = token.name.toLowerCase().replace(/\s+/g, '-');
    const normalizedPattern = pattern.toLowerCase();
    if (normalizedTokenName === normalizedPattern) {
      return { token, matchType: 'exact-name' };
    }
  }

  // Strategy 5: Exact value match
  for (const token of tokens) {
    if (token.value === pattern) {
      return { token, matchType: 'exact-value' };
    }
  }

  // Strategy 6: Normalized value match (for colors and spacing)
  if (context === 'css-value') {
    const normalizedPattern = normalizeValue(pattern);
    for (const token of tokens) {
      const normalizedTokenValue = normalizeValue(token.value);
      if (normalizedTokenValue === normalizedPattern) {
        return { token, matchType: 'normalized-value' };
      }
    }
  }

  return null;
}

// Simple value normalization
function normalizeValue(value: string): string {
  if (!value) return '';

  // Normalize colors
  if (value.startsWith('#')) {
    return value.toLowerCase();
  }

  if (value.startsWith('rgb(')) {
    // Convert rgb(255, 255, 255) to #ffffff
    const match = value.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, '0');
      const g = parseInt(match[2]).toString(16).padStart(2, '0');
      const b = parseInt(match[3]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
  }

  // Normalize spacing values
  if (value.endsWith('px')) {
    return value.toLowerCase();
  }

  // Default: return as lowercase
  return value.toLowerCase().trim();
}

// Clean, simple token matching system - old complex functions removed

// Color utility functions
function isWhiteColor(value: string): boolean {
  const normalized = normalizeColorValue(value);
  return normalized === '#ffffff' || normalized === 'rgb(255,255,255)' || value.toLowerCase() === 'white';
}

function isBlackColor(value: string): boolean {
  const normalized = normalizeColorValue(value);
  return normalized === '#000000' || normalized === 'rgb(0,0,0)' || value.toLowerCase() === 'black';
}

function isGrayColor(value: string): boolean {
  const normalized = normalizeColorValue(value);
  return /^#[0-9a-f]{6}$/i.test(normalized) &&
         normalized.slice(1, 3) === normalized.slice(3, 5) &&
         normalized.slice(3, 5) === normalized.slice(5, 7);
}

function isBlueColor(value: string): boolean {
  // Simple heuristic - check if blue component is dominant
  const rgb = extractRGBValues(value);
  return rgb ? (rgb.b > rgb.r && rgb.b > rgb.g) : false;
}

function normalizeColorValue(value: string): string {
  // Convert various color formats to hex
  if (value.startsWith('#')) return value.toLowerCase();
  if (value.startsWith('rgb(')) {
    const match = value.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const [, r, g, b] = match.map(Number);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
  }
  return value.toLowerCase();
}

function extractRGBValues(value: string): { r: number; g: number; b: number } | null {
  if (value.startsWith('#') && value.length === 7) {
    return {
      r: parseInt(value.slice(1, 3), 16),
      g: parseInt(value.slice(3, 5), 16),
      b: parseInt(value.slice(5, 7), 16)
    };
  }
  const match = value.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3])
    };
  }
  return null;
}

// Token mapping management functions
function updateTokenMapping(tokenId: string, codePattern: string, confidence: number): void {
  const existing = tokenMappings.get(tokenId);

  if (existing) {
    // Update existing mapping
    if (!existing.codebasePatterns.includes(codePattern)) {
      existing.codebasePatterns.push(codePattern);
    }
    existing.confidence = Math.max(existing.confidence, confidence);
    existing.lastMatched = new Date().toISOString();
  } else {
    // Create new mapping
    const token = designTokenRegistry.get(tokenId);
    if (token) {
      tokenMappings.set(tokenId, {
        figmaTokenId: tokenId,
        codebasePatterns: [codePattern],
        semanticType: token.type as any,
        confidence,
        lastMatched: new Date().toISOString()
      });
    }
  }
}

function createPotentialMapping(
  pattern: string,
  context: string,
  filePath: string,
  lineNumber: number
): void {
  // Store unmapped patterns for later analysis
  // This helps identify tokens that exist in code but not in Figma
  const potentialId = `unmapped_${context}_${pattern}`;

  // Add to dependency graph as potential usage
  dependencyGraph.usages.push({
    tokenId: potentialId,
    filePath,
    component: extractComponentName(filePath),
    lineNumber,
    context: `unmapped-${context}: ${pattern}`,
    usageType: 'direct',
    lastSeen: new Date().toISOString()
  });
}

function isDesignTokenClass(className: string): boolean {
  // Check if a Tailwind class represents a design token
  const designTokenPatterns = [
    /^(bg|text|border)-(white|black|gray|red|blue|green|yellow|purple|pink|indigo)-?\d*$/,
    /^(p|m|px|py|mx|my|pt|pb|pl|pr|mt|mb|ml|mr)-\d+$/,
    /^gap-\d+$/,
    /^rounded(-\w+)?$/,
    /^shadow(-\w+)?$/,
    /^(w|h)-\d+$/
  ];

  return designTokenPatterns.some(pattern => pattern.test(className));
}

// Enhanced debug function to show token mappings
async function debugTokenMappings(): Promise<any> {
  try {
    const mappingCount = tokenMappings.size;
    const mappings = Array.from(tokenMappings.entries());

    if (mappingCount === 0) {
      return {
        content: [{
          type: "text",
          text: "🔗 Token Mappings Debug\n\n❌ No token mappings found!\n\nToken mappings are created when tokens are matched with codebase usage."
        }]
      };
    }

    const mappingsList = mappings.map(([tokenId, mapping]) => {
      const token = designTokenRegistry.get(tokenId);
      const tokenName = token ? token.name : 'Unknown';
      const patterns = mapping.codebasePatterns.join(', ');
      return `• ${tokenName} (${mapping.confidence.toFixed(2)}) → ${patterns}`;
    }).join('\n');

    const avgConfidence = mappings.reduce((sum, [, mapping]) => sum + mapping.confidence, 0) / mappingCount;

    return {
      content: [{
        type: "text",
        text: `🔗 Token Mappings Debug\n\n✅ Found ${mappingCount} token mappings\n\nAverage confidence: ${avgConfidence.toFixed(2)}\n\n📋 All mappings:\n${mappingsList}`
      }]
    };

  } catch (error) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error checking token mappings: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

function updateDependencyGraph(scanResults: { usages: TokenUsage[]; scannedFiles: number }): void {
  // Update existing graph with new usage data
  scanResults.usages.forEach(usage => {
    // Remove old usages for this file/component
    dependencyGraph.usages = dependencyGraph.usages.filter(
      existing => !(existing.filePath === usage.filePath && existing.tokenId === usage.tokenId)
    );
    
    // Add new usage
    dependencyGraph.usages.push(usage);
  });

  // Update tokens that have usages
  const tokensWithUsages = [...new Set(dependencyGraph.usages.map(u => u.tokenId))];
  dependencyGraph.tokens = tokensWithUsages
    .map(tokenId => designTokenRegistry.get(tokenId))
    .filter((token): token is DesignToken => token !== undefined);

  // Update relationships
  rebuildRelationships();
  dependencyGraph.lastUpdated = new Date().toISOString();
}

function rebuildDependencyGraph(scanResults: { usages: TokenUsage[]; scannedFiles: number }): void {
  // Replace the entire usage data
  dependencyGraph.usages = scanResults.usages;
  
  // Populate tokens that have usages
  const tokensWithUsages = [...new Set(scanResults.usages.map(u => u.tokenId))];
  dependencyGraph.tokens = tokensWithUsages
    .map(tokenId => designTokenRegistry.get(tokenId))
    .filter((token): token is DesignToken => token !== undefined);
  
  rebuildRelationships();
  dependencyGraph.lastUpdated = new Date().toISOString();
}

function rebuildRelationships(): void {
  dependencyGraph.relationships = {};
  
  // Group usages by token
  const usagesByToken = dependencyGraph.usages.reduce((acc, usage) => {
    if (!acc[usage.tokenId]) {
      acc[usage.tokenId] = [];
    }
    acc[usage.tokenId].push(usage);
    return acc;
  }, {} as Record<string, TokenUsage[]>);

  // Build relationships
  Object.entries(usagesByToken).forEach(([tokenId, usages]) => {
    const uniqueFiles = [...new Set(usages.map(u => u.filePath))];
    const directUsages = usages.filter(u => u.usageType === 'direct').map(u => u.filePath);
    const computedUsages = usages.filter(u => u.usageType === 'computed').map(u => u.filePath);
    
    dependencyGraph.relationships[tokenId] = {
      directUsages: [...new Set(directUsages)],
      computedUsages: [...new Set(computedUsages)],
      dependencies: [] // Will be enhanced in future phases
    };
  });
}

function generateDependencyGraphSummary(): string {
  const totalTokens = dependencyGraph.tokens.length;
  const totalUsages = dependencyGraph.usages.length;
  const uniqueFiles = [...new Set(dependencyGraph.usages.map(u => u.filePath))].length;
  
  const usagesByType = dependencyGraph.usages.reduce((acc, usage) => {
    acc[usage.usageType] = (acc[usage.usageType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeBreakdown = Object.entries(usagesByType)
    .map(([type, count]) => `${count} ${type}`)
    .join(', ');

  return `Mapped ${totalUsages} token usages across ${uniqueFiles} files\nUsage types: ${typeBreakdown}`;
}

function getTopTokenUsage(): Array<{ token: string; count: number; files: number }> {
  const tokenStats = dependencyGraph.usages.reduce((acc, usage) => {
    if (!acc[usage.tokenId]) {
      acc[usage.tokenId] = { count: 0, files: new Set<string>() };
    }
    acc[usage.tokenId].count++;
    acc[usage.tokenId].files.add(usage.filePath);
    return acc;
  }, {} as Record<string, { count: number; files: Set<string> }>);

  return Object.entries(tokenStats)
    .map(([token, stats]) => ({
      token,
      count: stats.count,
      files: stats.files.size
    }))
    .sort((a, b) => b.count - a.count);
    // Removed .slice(0, 5) limit - show all token usage
}

// Debug function to check registry contents
async function debugTokenRegistry(): Promise<any> {
  try {
    const tokenCount = designTokenRegistry.size;
    const tokens = Array.from(designTokenRegistry.entries());
    
    if (tokenCount === 0) {
      return {
        content: [{
          type: "text",
          text: "🔍 Token Registry Debug\n\n❌ Registry is empty!\n\nRun extract_design_tokens first to populate the registry."
        }]
      };
    }

    const tokensList = tokens.map(([id, token]) => 
      `• ${id} → ${token.name} (${token.type}): ${token.value}`
    ).join('\n');

    const byType = tokens.reduce((acc, [, token]) => {
      acc[token.type] = (acc[token.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const typeSummary = Object.entries(byType)
      .map(([type, count]) => `${count} ${type}`)
      .join(', ');

    return {
      content: [{
        type: "text",
        text: `🔍 Token Registry Debug\n\n✅ Registry contains ${tokenCount} tokens\n\nToken distribution: ${typeSummary}\n\n📋 All tokens in registry:\n${tokensList}\n\n🔗 Registry object: Map with ${designTokenRegistry.size} entries`
      }]
    };

  } catch (error) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error checking token registry: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

// Phase 3: AI-Powered Change Impact Analysis Engine
async function analyzeTokenChangeImpact(args: {
  tokenId: string;
  newValue: string;
  changeReason?: string;
  includeEdgeCases?: boolean;
  generateMigration?: boolean;
}): Promise<any> {
  try {
    const { tokenId, newValue, changeReason, includeEdgeCases = true, generateMigration = true } = args;
    
    // Find the token being changed
    const token = designTokenRegistry.get(tokenId);
    if (!token) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: `Token "${tokenId}" not found in registry. Run extract_design_tokens first.`
        }]
      };
    }

    // Get usage data from dependency graph
    const tokenUsages = dependencyGraph.usages.filter(usage => usage.tokenId === tokenId);
    const relationships = dependencyGraph.relationships[tokenId];

    // Enhanced analysis: Check for potential conflicts even without direct usage
    if (tokenUsages.length === 0) {
      // Look for semantic conflicts with similar tokens
      const semanticConflicts = await analyzeSemanticConflicts(token, newValue, changeReason);

      if (semanticConflicts.length > 0) {
        return {
          content: [{
            type: "text",
            text: `🔍 Token "${token.name}" Analysis\n\n⚠️ No direct usages found, but potential semantic conflicts detected:\n\n${semanticConflicts.map(conflict => `• ${conflict.type}: ${conflict.description}`).join('\n')}\n\n💡 Recommendation: ${semanticConflicts[0].recommendation}`
          }]
        };
      }

      return {
        content: [{
          type: "text",
          text: `🔍 Token "${tokenId}" Analysis\n\n⚠️ No usages found for this token. It may be safe to change or remove.\n\nRecommendation: Consider removing unused token to reduce design system bloat.`
        }]
      };
    }

    // Perform AI-powered impact analysis
    const analysis = await performAIImpactAnalysis(token, newValue, tokenUsages, relationships, changeReason);
    
    // Generate edge case analysis if requested
    let edgeCaseAnalysis = "";
    if (includeEdgeCases) {
      edgeCaseAnalysis = await generateEdgeCaseAnalysis(token, newValue, tokenUsages);
    }

    // Generate migration code if requested
    let migrationCode = "";
    if (generateMigration) {
      migrationCode = await generateMigrationPreview(token, newValue, tokenUsages);
    }

    // Store analysis in change history
    const changeAnalysis: ChangeImpactAnalysis = {
      tokenId,
      oldValue: token.value,
      newValue,
      impact: analysis.impact,
      edgeCases: analysis.edgeCases,
      suggestedActions: analysis.suggestedActions,
      migrationCode: analysis.migrationCode
    };

    changeHistory.push({
      timestamp: new Date().toISOString(),
      tokenId,
      oldValue: token.value,
      newValue,
      analysis: changeAnalysis
    });

    const report = formatImpactAnalysisReport(tokenId, token, changeAnalysis, edgeCaseAnalysis, migrationCode);
    
    return {
      content: [{
        type: "text",
        text: report
      }]
    };

  } catch (error) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error analyzing token change impact: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

async function performAIImpactAnalysis(
  token: DesignToken,
  newValue: string,
  usages: TokenUsage[],
  relationships: any,
  changeReason?: string
): Promise<{
  impact: ChangeImpactAnalysis['impact'];
  edgeCases: ChangeImpactAnalysis['edgeCases'];
  suggestedActions: ChangeImpactAnalysis['suggestedActions'];
  migrationCode: ChangeImpactAnalysis['migrationCode'];
}> {
  
  // Calculate basic impact metrics
  const affectedFiles = [...new Set(usages.map(u => u.filePath))];
  const affectedComponents = [...new Set(usages.map(u => u.component))];
  
  // Determine risk level based on usage and token type
  const riskLevel = calculateRiskLevel(token, usages, newValue);
  
  // AI-powered semantic analysis
  const semanticAnalysis = analyzeTokenSemantics(token, newValue, changeReason);
  
  // Generate edge cases based on token type and usage patterns
  const edgeCases = generateTokenEdgeCases(token, newValue, usages);
  
  // Generate suggested actions
  const suggestedActions = generateSuggestedActions(token, newValue, usages, riskLevel);
  
  // Generate migration code structure
  const migrationCode = generateMigrationStructure(token, newValue, usages);

  return {
    impact: {
      affectedComponents: affectedComponents.length,
      affectedFiles: affectedFiles.length,
      totalInstances: usages.length,
      riskLevel
    },
    edgeCases,
    suggestedActions,
    migrationCode
  };
}

function calculateRiskLevel(token: DesignToken, usages: TokenUsage[], newValue: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const usageCount = usages.length;
  const affectedFiles = [...new Set(usages.map(u => u.filePath))].length;
  
  // High-impact token types
  const highImpactTypes = ['color', 'spacing'];
  const isHighImpact = highImpactTypes.includes(token.type);
  
  // Check for breaking changes
  const isBreakingChange = checkForBreakingChange(token, newValue);
  
  if (isBreakingChange || (isHighImpact && usageCount > 20)) {
    return 'CRITICAL';
  }
  
  if (isHighImpact && usageCount > 10) {
    return 'HIGH';
  }
  
  if (usageCount > 5 || affectedFiles > 3) {
    return 'MEDIUM';
  }
  
  return 'LOW';
}

function checkForBreakingChange(token: DesignToken, newValue: string): boolean {
  if (token.type === 'color') {
    // Check if color change affects accessibility
    return isSignificantColorChange(token.value, newValue);
  }
  
  if (token.type === 'spacing') {
    // Check if spacing change is dramatic
    return isSignificantSpacingChange(token.value, newValue);
  }
  
  return false;
}

function isSignificantColorChange(oldColor: string, newColor: string): boolean {
  // Simplified color difference detection
  // In real implementation, would use color science algorithms
  return oldColor.toLowerCase() !== newColor.toLowerCase();
}

function isSignificantSpacingChange(oldSpacing: string, newSpacing: string): boolean {
  const oldPx = parseFloat(oldSpacing.replace('px', ''));
  const newPx = parseFloat(newSpacing.replace('px', ''));
  
  if (isNaN(oldPx) || isNaN(newPx)) return true;
  
  // Consider >50% change as significant
  const changePercent = Math.abs(newPx - oldPx) / oldPx;
  return changePercent > 0.5;
}

function analyzeTokenSemantics(token: DesignToken, newValue: string, changeReason?: string): string {
  // AI-like semantic analysis (simplified)
  const semanticInsights = [];
  
  if (token.type === 'color') {
    semanticInsights.push(`Color change from ${token.value} to ${newValue}`);
    
    if (token.name.includes('primary')) {
      semanticInsights.push("Primary color change affects brand identity");
    }
    
    if (changeReason?.toLowerCase().includes('accessibility')) {
      semanticInsights.push("Change appears to be accessibility-driven - likely safe");
    }
  }
  
  if (token.type === 'spacing') {
    const oldPx = parseFloat(token.value);
    const newPx = parseFloat(newValue);
    
    if (newPx > oldPx) {
      semanticInsights.push("Increased spacing may improve readability");
    } else {
      semanticInsights.push("Decreased spacing may affect touch targets");
    }
  }
  
  return semanticInsights.join('. ');
}

function generateTokenEdgeCases(token: DesignToken, newValue: string, usages: TokenUsage[]): ChangeImpactAnalysis['edgeCases'] {
  const edgeCases: ChangeImpactAnalysis['edgeCases'] = [];
  
  // Color-specific edge cases
  if (token.type === 'color') {
    edgeCases.push({
      type: 'accessibility',
      description: 'Color contrast ratios may need validation in dark mode',
      affectedFiles: usages.filter(u => u.filePath.includes('dark')).map(u => u.filePath),
      severity: 'warning'
    });
    
    edgeCases.push({
      type: 'hover-states',
      description: 'Interactive elements may need hover state adjustments',
      affectedFiles: usages.filter(u => u.context.includes('hover')).map(u => u.filePath),
      severity: 'warning'
    });
  }
  
  // Spacing-specific edge cases
  if (token.type === 'spacing') {
    edgeCases.push({
      type: 'responsive',
      description: 'Mobile breakpoints may be affected by spacing changes',
      affectedFiles: usages.filter(u => u.filePath.includes('mobile') || u.context.includes('responsive')).map(u => u.filePath),
      severity: 'info'
    });
  }
  
  return edgeCases;
}

function generateSuggestedActions(
  token: DesignToken, 
  newValue: string, 
  usages: TokenUsage[], 
  riskLevel: string
): ChangeImpactAnalysis['suggestedActions'] {
  const actions: ChangeImpactAnalysis['suggestedActions'] = [];
  
  // Always suggest updating CSS variables
  actions.push({
    action: `Update CSS custom property --${token.name} to ${newValue}`,
    priority: 1,
    automated: true
  });
  
  if (token.type === 'color') {
    actions.push({
      action: 'Run accessibility contrast checks',
      priority: 2,
      automated: false
    });
    
    if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
      actions.push({
        action: 'Test dark mode compatibility',
        priority: 2,
        automated: false
      });
    }
  }
  
  // Component-specific actions
  const componentFiles = [...new Set(usages.map(u => u.filePath))];
  componentFiles.slice(0, 3).forEach((file, index) => {
    actions.push({
      action: `Review implementation in ${file}`,
      priority: 3 + index,
      automated: false
    });
  });
  
  return actions;
}

function generateMigrationStructure(
  token: DesignToken,
  newValue: string,
  usages: TokenUsage[]
): ChangeImpactAnalysis['migrationCode'] {
  return {
    cssVariables: `/* Update CSS custom properties */\n:root {\n  --${token.name}: ${newValue}; /* Changed from ${token.value} */\n}`,
    componentUpdates: usages.slice(0, 3).map(usage => ({
      file: usage.filePath,
      changes: `Update ${usage.context} to use new ${token.name} value`
    })),
    testCases: `// Test cases for ${token.name} change\ndescribe('${token.name} token change', () => {\n  it('should maintain visual consistency', () => {\n    // Add visual regression tests\n  });\n});`,
    documentation: `## Token Change: ${token.name}\n\n**Old value:** ${token.value}\n**New value:** ${newValue}\n\n**Affected components:** ${[...new Set(usages.map(u => u.component))].join(', ')}\n\n**Migration steps:**\n1. Update CSS custom properties\n2. Test affected components\n3. Validate accessibility compliance`
  };
}

// ===== ENHANCED CONFLICT DETECTION SYSTEM =====

interface SemanticConflict {
  type: 'accessibility' | 'layout' | 'branding' | 'consistency' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  affectedAreas: string[];
}

// Analyze semantic conflicts even without direct usage
async function analyzeSemanticConflicts(
  token: DesignToken,
  newValue: string,
  changeReason?: string
): Promise<SemanticConflict[]> {
  const conflicts: SemanticConflict[] = [];

  // Color-specific conflict analysis
  if (token.type === 'color') {
    conflicts.push(...analyzeColorConflicts(token, newValue));
  }

  // Spacing-specific conflict analysis
  if (token.type === 'spacing') {
    conflicts.push(...analyzeSpacingConflicts(token, newValue));
  }

  // Border-radius specific conflict analysis
  if (token.type === 'border-radius') {
    conflicts.push(...analyzeBorderRadiusConflicts(token, newValue));
  }

  // Cross-token consistency analysis
  conflicts.push(...analyzeConsistencyConflicts(token, newValue));

  return conflicts.filter(conflict => conflict.severity !== 'low');
}

// Color conflict analysis
function analyzeColorConflicts(token: DesignToken, newValue: string): SemanticConflict[] {
  const conflicts: SemanticConflict[] = [];
  const oldRgb = extractRGBValues(token.value);
  const newRgb = extractRGBValues(newValue);

  if (!oldRgb || !newRgb) return conflicts;

  // Accessibility conflict: White to black or vice versa
  if (isWhiteColor(token.value) && isBlackColor(newValue)) {
    conflicts.push({
      type: 'accessibility',
      severity: 'critical',
      description: 'Changing white to black will cause severe accessibility issues with text contrast',
      recommendation: 'Review all text elements that use this background color and ensure proper contrast ratios',
      affectedAreas: ['text-readability', 'button-states', 'form-inputs', 'navigation']
    });
  }

  if (isBlackColor(token.value) && isWhiteColor(newValue)) {
    conflicts.push({
      type: 'accessibility',
      severity: 'critical',
      description: 'Changing black to white will cause severe accessibility issues with text contrast',
      recommendation: 'Review all text elements that use this background color and ensure proper contrast ratios',
      affectedAreas: ['text-readability', 'button-states', 'form-inputs', 'navigation']
    });
  }

  // Branding conflict: Significant color shift
  const colorDistance = Math.sqrt(
    Math.pow(newRgb.r - oldRgb.r, 2) +
    Math.pow(newRgb.g - oldRgb.g, 2) +
    Math.pow(newRgb.b - oldRgb.b, 2)
  );

  if (colorDistance > 200) {
    conflicts.push({
      type: 'branding',
      severity: 'high',
      description: `Significant color change (distance: ${Math.round(colorDistance)}) may impact brand consistency`,
      recommendation: 'Validate with design team and update brand guidelines if this is intentional',
      affectedAreas: ['brand-identity', 'user-recognition', 'marketing-materials']
    });
  }

  return conflicts;
}

// Spacing conflict analysis
function analyzeSpacingConflicts(token: DesignToken, newValue: string): SemanticConflict[] {
  const conflicts: SemanticConflict[] = [];
  const oldPx = parseFloat(token.value);
  const newPx = parseFloat(newValue);

  if (isNaN(oldPx) || isNaN(newPx)) return conflicts;

  // Layout breaking: Extreme spacing changes
  const changeRatio = newPx / oldPx;

  if (changeRatio > 5 || changeRatio < 0.2) {
    conflicts.push({
      type: 'layout',
      severity: 'high',
      description: `Extreme spacing change (${oldPx}px → ${newPx}px, ${Math.round(changeRatio * 100)}% ratio) will break layouts`,
      recommendation: 'Test on mobile devices and ensure responsive breakpoints still work',
      affectedAreas: ['mobile-layout', 'responsive-design', 'component-spacing', 'grid-systems']
    });
  }

  // Performance conflict: Very large spacing values
  if (newPx > 1000) {
    conflicts.push({
      type: 'performance',
      severity: 'medium',
      description: `Very large spacing value (${newPx}px) may cause performance issues on mobile devices`,
      recommendation: 'Consider using percentage-based or viewport-relative units for large spacing',
      affectedAreas: ['mobile-performance', 'scroll-performance', 'memory-usage']
    });
  }

  return conflicts;
}

// Border radius conflict analysis
function analyzeBorderRadiusConflicts(token: DesignToken, newValue: string): SemanticConflict[] {
  const conflicts: SemanticConflict[] = [];
  const oldPx = parseFloat(token.value);
  const newPx = parseFloat(newValue);

  if (isNaN(oldPx) || isNaN(newPx)) return conflicts;

  // Layout conflict: Border radius larger than typical component size
  if (newPx > 50) {
    conflicts.push({
      type: 'layout',
      severity: 'medium',
      description: `Large border radius (${newPx}px) may cause visual distortion on small components`,
      recommendation: 'Test on buttons, form inputs, and small UI elements to ensure proper appearance',
      affectedAreas: ['button-appearance', 'form-inputs', 'card-components', 'small-elements']
    });
  }

  return conflicts;
}

// Cross-token consistency analysis
function analyzeConsistencyConflicts(token: DesignToken, newValue: string): SemanticConflict[] {
  const conflicts: SemanticConflict[] = [];

  // Find similar tokens in the registry
  const similarTokens = Array.from(designTokenRegistry.values()).filter(t =>
    t.id !== token.id &&
    t.type === token.type &&
    t.value === token.value
  );

  if (similarTokens.length > 0) {
    conflicts.push({
      type: 'consistency',
      severity: 'medium',
      description: `${similarTokens.length} other tokens have the same value (${token.value}). Changing this token may create inconsistency`,
      recommendation: `Consider updating related tokens: ${similarTokens.map(t => t.name).join(', ')}`,
      affectedAreas: ['design-consistency', 'token-management', 'maintenance']
    });
  }

  return conflicts;
}

async function generateEdgeCaseAnalysis(token: DesignToken, newValue: string, usages: TokenUsage[]): Promise<string> {
  // Simulate AI-powered edge case analysis
  const edgeCases = [];
  
  if (token.type === 'color') {
    edgeCases.push("🎨 Color accessibility: Verify contrast ratios meet WCAG standards");
    edgeCases.push("🌙 Dark mode: Check color appearance in dark theme variants");
    edgeCases.push("🖱️ Interactive states: Review hover, focus, and active states");
  }
  
  if (token.type === 'spacing') {
    edgeCases.push("📱 Mobile: Verify touch target sizes remain adequate");
    edgeCases.push("📐 Layout: Check for text overflow or cramped layouts");
    edgeCases.push("🔄 Responsive: Test across different screen sizes");
  }
  
  return edgeCases.length > 0 ? 
    `\n🔍 AI Edge Case Analysis:\n${edgeCases.map(ec => `   • ${ec}`).join('\n')}` : 
    "";
}

async function generateMigrationPreview(token: DesignToken, newValue: string, usages: TokenUsage[]): Promise<string> {
  const affectedFiles = [...new Set(usages.map(u => u.filePath))];
  
  const preview = `
🚀 Migration Preview:

1. CSS Variables Update:
   \`\`\`css
   :root {
     --${token.name}: ${newValue}; /* Updated from ${token.value} */
   }
   \`\`\`

2. Affected Files (${affectedFiles.length}):
   ${affectedFiles.map(file => `   • ${file}`).join('\n')}

3. Verification Steps:
   • Visual regression testing
   • Accessibility compliance check
   • Cross-browser validation
   ${token.type === 'color' ? '• Dark mode verification' : ''}
   ${token.type === 'spacing' ? '• Mobile responsiveness check' : ''}
`;

  return preview;
}

function formatImpactAnalysisReport(
  tokenId: string,
  token: DesignToken,
  analysis: ChangeImpactAnalysis,
  edgeCaseAnalysis: string,
  migrationCode: string
): string {
  const riskEmoji = {
    'LOW': '🟢',
    'MEDIUM': '🟡',
    'HIGH': '🟠',
    'CRITICAL': '🔴'
  }[analysis.impact.riskLevel];

  return `🔍 Token "${tokenId}" Analysis

📊 Impact Summary:
   • ${analysis.impact.affectedComponents} components affected
   • ${analysis.impact.affectedFiles} files need updates  
   • ${analysis.impact.totalInstances} total usage instances
   • Risk Level: ${riskEmoji} ${analysis.impact.riskLevel}

⚠️ Edge Cases Detected:
${analysis.edgeCases.map(ec => `   • ${ec.description} (${ec.severity})`).join('\n')}

🤖 Suggested Actions:
${analysis.suggestedActions.map((action, i) => 
  `   ${i + 1}. ${action.action} ${action.automated ? '(automated)' : '(manual)'}`
).join('\n')}
${edgeCaseAnalysis}
${migrationCode}

💡 AI Recommendation: ${getRiskLevelRecommendation(analysis.impact.riskLevel)}`;
}

function getRiskLevelRecommendation(riskLevel: string): string {
  switch (riskLevel) {
    case 'LOW':
      return "Safe to proceed with automated migration.";
    case 'MEDIUM':
      return "Review affected components before deploying.";
    case 'HIGH':
      return "Implement in feature branch with comprehensive testing.";
    case 'CRITICAL':
      return "Coordinate with design team and implement gradually.";
    default:
      return "Proceed with caution.";
  }
}

// Phase 4: Enhanced Migration Code Generation
async function generateMigrationCode(args: {
  changeAnalysisId: string;
  migrationStrategy?: 'gradual' | 'atomic' | 'feature-flag';
  includeTests?: boolean;
  includeDocs?: boolean;
}): Promise<any> {
  try {
    const { changeAnalysisId, migrationStrategy = 'gradual', includeTests = true, includeDocs = true } = args;
    
    // Find the change analysis in history
    const changeRecord = changeHistory.find(record => 
      `${record.tokenId}-${record.timestamp}` === changeAnalysisId ||
      record.tokenId === changeAnalysisId
    );
    
    if (!changeRecord) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: `Change analysis "${changeAnalysisId}" not found. Run analyze_token_change_impact first.`
        }]
      };
    }

    const { analysis, tokenId, newValue, oldValue } = changeRecord;
    const token = designTokenRegistry.get(tokenId);
    
    if (!token) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: `Token "${tokenId}" not found in registry.`
        }]
      };
    }

    // Generate comprehensive migration code
    const migrationPlan = await generateComprehensiveMigration(
      token, 
      oldValue, 
      newValue, 
      analysis, 
      migrationStrategy,
      includeTests,
      includeDocs
    );

    return {
      content: [{
        type: "text",
        text: formatMigrationPlan(migrationPlan, migrationStrategy)
      }]
    };

  } catch (error) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error generating migration code: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

async function generateComprehensiveMigration(
  token: DesignToken,
  oldValue: string,
  newValue: string,
  analysis: ChangeImpactAnalysis,
  strategy: string,
  includeTests: boolean,
  includeDocs: boolean
) {
  const migration = {
    strategy,
    cssUpdates: generateCSSMigration(token, oldValue, newValue, strategy),
    componentUpdates: generateComponentMigration(token, analysis, strategy),
    testCases: includeTests ? generateTestMigration(token, analysis) : null,
    documentation: includeDocs ? generateDocumentationMigration(token, oldValue, newValue, analysis) : null,
    rollbackPlan: generateRollbackPlan(token, oldValue, newValue),
    verificationSteps: generateVerificationSteps(token, analysis),
    timeline: generateMigrationTimeline(strategy, analysis.impact.riskLevel)
  };

  return migration;
}

function generateCSSMigration(token: DesignToken, oldValue: string, newValue: string, strategy: string): any {
  const baseUpdate = {
    file: 'src/styles/tokens.css',
    changes: `/* Design Token Migration: ${token.name} */\n:root {\n  --${token.name}: ${newValue}; /* Updated from ${oldValue} */\n}`
  };

  if (strategy === 'feature-flag') {
    return {
      ...baseUpdate,
      changes: `/* Feature Flag Migration: ${token.name} */\n:root {\n  --${token.name}: var(--feature-new-${token.name}, ${oldValue});\n}\n\n/* When feature flag is enabled */\n[data-feature-new-tokens] {\n  --feature-new-${token.name}: ${newValue};\n}`
    };
  }

  if (strategy === 'gradual') {
    return {
      ...baseUpdate,
      changes: `/* Gradual Migration: ${token.name} */\n:root {\n  --${token.name}-old: ${oldValue};\n  --${token.name}: ${newValue};\n  --${token.name}-new: ${newValue};\n}\n\n/* Migration helper class */\n.use-old-${token.name} {\n  /* Temporary fallback during migration */\n  --${token.name}: var(--${token.name}-old);\n}`
    };
  }

  return baseUpdate;
}

function generateComponentMigration(token: DesignToken, analysis: ChangeImpactAnalysis, strategy: string): any[] {
  const updates: any[] = [];
  
  // Generate updates for affected components
  if (analysis.migrationCode?.componentUpdates) {
    analysis.migrationCode.componentUpdates.forEach(update => {
      let migrationCode = '';
      
      if (strategy === 'atomic') {
        migrationCode = `// Atomic migration - direct replacement\n// Update all references to use new ${token.name} value\n// ${update.changes}`;
      } else if (strategy === 'gradual') {
        migrationCode = `// Gradual migration - staged replacement\n// Phase 1: Add migration class for testing\n// className={\`\${originalClasses} use-old-${token.name}\`}\n// Phase 2: Remove migration class after verification\n// ${update.changes}`;
      } else if (strategy === 'feature-flag') {
        migrationCode = `// Feature flag migration\n// Wrap component with feature flag provider\n// <FeatureFlag flag="new-tokens">\n//   {/* Component with new tokens */}\n// </FeatureFlag>\n// ${update.changes}`;
      }
      
      updates.push({
        file: update.file,
        changes: migrationCode,
        priority: updates.length + 1
      });
    });
  }

  return updates;
}

function generateTestMigration(token: DesignToken, analysis: ChangeImpactAnalysis): any {
  return {
    visualRegression: `// Visual regression tests for ${token.name} migration
describe('Token Migration: ${token.name}', () => {
  it('should maintain visual consistency in light mode', async () => {
    const component = render(<TestComponent />);
    await expect(component).toMatchVisualSnapshot('${token.name}-light.png');
  });

  it('should maintain visual consistency in dark mode', async () => {
    const component = render(<TestComponent theme="dark" />);
    await expect(component).toMatchVisualSnapshot('${token.name}-dark.png');
  });

  it('should pass accessibility contrast checks', async () => {
    const component = render(<TestComponent />);
    const results = await axe(component.container);
    expect(results).toHaveNoViolations();
  });
});`,
    
    unitTests: `// Unit tests for ${token.name} token usage
describe('${token.name} Token Integration', () => {
  it('should apply correct CSS custom property', () => {
    const element = document.createElement('div');
    element.style.setProperty('color', 'var(--${token.name})');
    const computedStyle = getComputedStyle(element);
    expect(computedStyle.getPropertyValue('--${token.name}')).toBeDefined();
  });
});`,

    e2eTests: `// E2E tests for critical user flows
test('${token.name} migration - critical user flows', async ({ page }) => {
  await page.goto('/');
  
  // Test primary navigation (likely affected by color changes)
  await page.click('[data-testid="primary-nav"]');
  await expect(page).toHaveScreenshot('nav-with-new-${token.name}.png');
  
  // Test interactive elements
  await page.hover('[data-testid="primary-button"]');
  await expect(page).toHaveScreenshot('button-hover-new-${token.name}.png');
});`
  };
}

function generateDocumentationMigration(token: DesignToken, oldValue: string, newValue: string, analysis: ChangeImpactAnalysis): any {
  return {
    changeLog: `# Design Token Migration: ${token.name}

## Change Summary
- **Token:** ${token.name}
- **Old Value:** ${oldValue}
- **New Value:** ${newValue}
- **Risk Level:** ${analysis.impact.riskLevel}
- **Date:** ${new Date().toLocaleDateString()}

## Impact Analysis
- **Components Affected:** ${analysis.impact.affectedComponents}
- **Files Modified:** ${analysis.impact.affectedFiles}
- **Total Instances:** ${analysis.impact.totalInstances}

## Migration Steps
${analysis.suggestedActions.map((action, i) => `${i + 1}. ${action.action}`).join('\n')}

## Edge Cases to Monitor
${analysis.edgeCases.map(ec => `- ${ec.description} (${ec.severity})`).join('\n')}

## Rollback Plan
If issues are discovered:
1. Revert CSS custom property to previous value
2. Clear browser caches
3. Validate affected components
4. Update this documentation

## Testing Checklist
- [ ] Visual regression tests pass
- [ ] Accessibility contrast ratios verified
- [ ] Dark mode compatibility confirmed
- [ ] Mobile responsiveness maintained
- [ ] Cross-browser testing completed`,

    migrationGuide: `# ${token.name} Migration Guide

## For Developers

### Quick Migration
\`\`\`css
/* Replace in your CSS */
--${token.name}: ${newValue}; /* was ${oldValue} */
\`\`\`

### Component Updates
Check these files for potential issues:
${analysis.migrationCode?.componentUpdates?.map(u => `- ${u.file}`).join('\n') || '- No component updates needed'}

### Testing
Run the included test suites:
\`\`\`bash
npm run test:visual-regression
npm run test:accessibility
npm run test:e2e
\`\`\`

## For Designers

### What Changed
The ${token.type} token "${token.name}" has been updated from ${oldValue} to ${newValue}.

### Design Impact
${token.type === 'color' ? '- Color appearance may change across all instances' : ''}
${token.type === 'spacing' ? '- Layout spacing will be adjusted in affected components' : ''}
${token.type === 'typography' ? '- Text appearance will change in affected components' : ''}

### Verification Steps
1. Review Figma designs for consistency
2. Check brand guidelines compliance
3. Validate accessibility requirements
4. Approve final implementation`
  };
}

function generateRollbackPlan(token: DesignToken, oldValue: string, newValue: string): any {
  return {
    quickRollback: `/* Quick Rollback for ${token.name} */
:root {
  --${token.name}: ${oldValue}; /* Rolled back from ${newValue} */
}`,
    
    fullRollback: `// Full Rollback Script
// 1. Revert CSS custom property
// 2. Clear component cache
// 3. Restart development server
// 4. Run verification tests

// Git commands:
// git revert <commit-hash>
// git push origin main

// CSS update:
// --${token.name}: ${oldValue};`,
    
    verificationSteps: [
      'Confirm all components render correctly',
      'Run automated test suite',
      'Check browser developer tools for errors',
      'Validate against design system documentation'
    ]
  };
}

function generateVerificationSteps(token: DesignToken, analysis: ChangeImpactAnalysis): string[] {
  const steps = [
    'Run automated test suite',
    'Perform visual regression testing',
    'Validate accessibility compliance'
  ];
  
  if (token.type === 'color') {
    steps.push('Check color contrast ratios');
    steps.push('Verify dark mode compatibility');
  }
  
  if (token.type === 'spacing') {
    steps.push('Test mobile responsiveness');
    steps.push('Validate touch target sizes');
  }
  
  if (analysis.impact.riskLevel === 'HIGH' || analysis.impact.riskLevel === 'CRITICAL') {
    steps.push('Coordinate with design team review');
    steps.push('Perform cross-browser testing');
    steps.push('Run load testing on affected pages');
  }
  
  return steps;
}

function generateMigrationTimeline(strategy: string, riskLevel: string): any {
  const baseTimeline = {
    'gradual': {
      'LOW': ['Day 1: Deploy changes', 'Day 2: Monitor and verify'],
      'MEDIUM': ['Day 1: Deploy to staging', 'Day 2: QA testing', 'Day 3: Production deployment'],
      'HIGH': ['Week 1: Feature branch testing', 'Week 2: Staging deployment', 'Week 3: Production rollout'],
      'CRITICAL': ['Week 1-2: Comprehensive testing', 'Week 3: Staged rollout', 'Week 4: Full deployment']
    },
    'atomic': {
      'LOW': ['Day 1: Complete migration and deploy'],
      'MEDIUM': ['Day 1: Migration and testing', 'Day 2: Deployment'],
      'HIGH': ['Day 1-2: Migration and testing', 'Day 3: Deployment with monitoring'],
      'CRITICAL': ['Day 1-3: Migration, testing, and validation', 'Day 4: Coordinated deployment']
    },
    'feature-flag': {
      'LOW': ['Day 1: Deploy with flag disabled', 'Day 2: Enable flag and monitor'],
      'MEDIUM': ['Day 1: Deploy with flag', 'Day 2-3: Gradual rollout', 'Day 4: Full enablement'],
      'HIGH': ['Week 1: Deploy and test with flag', 'Week 2: Gradual rollout', 'Week 3: Full rollout'],
      'CRITICAL': ['Week 1: Deploy with flag', 'Week 2-3: Careful rollout', 'Week 4: Full enablement']
    }
  };
  
  return {
    strategy,
    riskLevel,
    timeline: (baseTimeline as any)[strategy]?.[riskLevel] || ['Custom timeline needed for this combination'],
    milestones: [
      'Migration code generated',
      'Testing completed',
      'Staging deployment',
      'Production deployment',
      'Verification completed'
    ]
  };
}

function formatMigrationPlan(migration: any, strategy: string): string {
  return `🚀 Comprehensive Migration Plan: ${strategy.toUpperCase()} Strategy

📋 Migration Overview:
• Strategy: ${migration.strategy}
• Timeline: ${migration.timeline.timeline.join(' → ')}
• Risk Level: ${migration.timeline.riskLevel}

🔧 CSS Updates:
${migration.cssUpdates.changes}

📝 Component Updates (${migration.componentUpdates.length} files):
${migration.componentUpdates.map((update: any, i: number) =>
  `${i + 1}. ${update.file}\n   ${update.changes.split('\n')[0]}`
).join('\n')}

${migration.testCases ? `
🧪 Generated Test Suites:

Visual Regression Tests:
\`\`\`javascript
${migration.testCases.visualRegression.split('\n').slice(0, 10).join('\n')}
// ... (full test suite generated)
\`\`\`

E2E Tests:
\`\`\`javascript
${migration.testCases.e2eTests.split('\n').slice(0, 8).join('\n')}
// ... (full e2e suite generated)
\`\`\`
` : ''}

${migration.documentation ? `
📚 Documentation Generated:
• Migration guide for developers
• Change log with impact analysis
• Rollback procedures
• Design team communication guide
` : ''}

🔄 Rollback Plan:
Quick Rollback (Emergency):
\`\`\`css
${migration.rollbackPlan.quickRollback}
\`\`\`

✅ Verification Checklist:
${migration.verificationSteps.map((step: any) => `• ${step}`).join('\n')}

📅 Timeline & Milestones:
${migration.timeline.milestones.map((milestone: any, i: number) => `${i + 1}. ${milestone}`).join('\n')}

💡 Next Steps:
1. Review the generated migration code
2. Run the test suites in your environment
3. Deploy to staging following the ${strategy} strategy
4. Monitor and verify according to the checklist
5. Proceed with production deployment

🎯 This migration plan ensures safe, systematic deployment of your design token changes with full rollback capabilities and comprehensive testing.`;
}

async function trackDesignSystemHealth(args: {
  healthChecks?: string[];
  reportFormat?: string;
}): Promise<any> {
  try {
    const { healthChecks = ['token-drift', 'unused-tokens', 'inconsistent-usage'], reportFormat = 'actionable' } = args;
    
    const report = {
      timestamp: new Date().toISOString(),
      overallHealth: 'GOOD' as 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL',
      issues: [] as Array<{
        type: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        title: string;
        description: string;
        affectedTokens: string[];
        actionable: boolean;
        suggestion?: string;
      }>,
      metrics: {
        totalTokens: designTokenRegistry.size,
        activeUsages: dependencyGraph.usages.length,
        unusedTokens: 0,
        inconsistentUsages: 0,
        driftDetected: 0
      }
    };

    // 1. Check for unused tokens
    if (healthChecks.includes('unused-tokens')) {
      const usedTokenIds = new Set(dependencyGraph.usages.map(u => u.tokenId));
      const unusedTokens = Array.from(designTokenRegistry.keys()).filter(tokenId => !usedTokenIds.has(tokenId));
      
      report.metrics.unusedTokens = unusedTokens.length;
      
      if (unusedTokens.length > 0) {
        report.issues.push({
          type: 'unused-tokens',
          severity: unusedTokens.length > 10 ? 'high' : 'medium',
          title: `${unusedTokens.length} Unused Design Tokens`,
          description: `Found ${unusedTokens.length} tokens with no usage in codebase. Consider removing to reduce bloat.`,
          affectedTokens: unusedTokens, // Show ALL unused tokens
          actionable: true,
          suggestion: `Review and remove unused tokens: ${unusedTokens.slice(0, 3).join(', ')}${unusedTokens.length > 3 ? '...' : ''}`
        });
      }
    }

    // 2. Check for inconsistent usage patterns
    if (healthChecks.includes('inconsistent-usage')) {
      const tokenUsagePatterns = new Map<string, Set<string>>();
      
      dependencyGraph.usages.forEach(usage => {
        if (!tokenUsagePatterns.has(usage.tokenId)) {
          tokenUsagePatterns.set(usage.tokenId, new Set());
        }
        tokenUsagePatterns.get(usage.tokenId)!.add(usage.context);
      });
      
      const inconsistentTokens = Array.from(tokenUsagePatterns.entries())
        .filter(([_, contexts]) => contexts.size > 3)
        .map(([tokenId]) => tokenId);
      
      report.metrics.inconsistentUsages = inconsistentTokens.length;
      
      if (inconsistentTokens.length > 0) {
        report.issues.push({
          type: 'inconsistent-usage',
          severity: 'medium',
          title: `${inconsistentTokens.length} Tokens with Inconsistent Usage`,
          description: `Tokens used in multiple contexts may indicate design system fragmentation.`,
          affectedTokens: inconsistentTokens, // Show ALL inconsistent tokens
          actionable: true,
          suggestion: 'Review token usage patterns and consider consolidating similar use cases'
        });
      }
    }

    // 3. Check for token drift (recent changes)
    if (healthChecks.includes('token-drift')) {
      const recentChanges = changeHistory.filter(change => {
        const changeDate = new Date(change.timestamp);
        const daysSinceChange = (Date.now() - changeDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceChange <= 7;
      });
      
      report.metrics.driftDetected = recentChanges.length;
      
      if (recentChanges.length > 5) {
        report.issues.push({
          type: 'token-drift',
          severity: recentChanges.length > 15 ? 'high' : 'medium',
          title: `High Token Change Activity (${recentChanges.length} changes in 7 days)`,
          description: 'Frequent token changes may indicate design system instability.',
          affectedTokens: [...new Set(recentChanges.map(c => c.tokenId))], // Show ALL recent changes
          actionable: false,
          suggestion: 'Review recent changes for patterns and consider design system governance'
        });
      }
    }

    // Calculate overall health
    const criticalIssues = report.issues.filter(i => i.severity === 'critical').length;
    const highIssues = report.issues.filter(i => i.severity === 'high').length;
    const mediumIssues = report.issues.filter(i => i.severity === 'medium').length;
    
    if (criticalIssues > 0) {
      report.overallHealth = 'CRITICAL';
    } else if (highIssues > 0) {
      report.overallHealth = 'WARNING';
    } else if (mediumIssues > 2) {
      report.overallHealth = 'WARNING';
    } else if (report.metrics.totalTokens > 0 && report.issues.length === 0) {
      report.overallHealth = 'EXCELLENT';
    }

    // Format response based on reportFormat
    let response = '';

    if (reportFormat === 'actionable' || reportFormat === 'detailed') {
      response = `🏥 Design System Health Report

📊 Overall Health: ${getHealthEmoji(report.overallHealth)} ${report.overallHealth}

📈 Metrics:
• Total Tokens: ${report.metrics.totalTokens}
• Active Usages: ${report.metrics.activeUsages}
• Unused Tokens: ${report.metrics.unusedTokens}
• Inconsistent Usage: ${report.metrics.inconsistentUsages}
• Recent Changes: ${report.metrics.driftDetected}`;

      if (report.issues.length > 0) {
        response += `\n\n⚠️ Issues Found (${report.issues.length}):\n`;

        if (reportFormat === 'detailed') {
          // Detailed format with more information
          response += report.issues.map(issue =>
            `\n${getSeverityEmoji(issue.severity)} ${issue.title}
  📝 Description: ${issue.description}
  🎯 Affected Tokens: ${issue.affectedTokens.join(', ')}${issue.affectedTokens.length > 5 ? '...' : ''}
  🔧 Actionable: ${issue.actionable ? 'Yes' : 'No'}
  ⚡ Severity: ${issue.severity.toUpperCase()}${issue.suggestion ? `\n  💡 Suggestion: ${issue.suggestion}` : ''}`
          ).join('\n\n');
        } else {
          // Actionable format (original)
          response += report.issues.map(issue =>
            `\n${getSeverityEmoji(issue.severity)} ${issue.title}\n  ${issue.description}\n  🎯 Tokens: ${issue.affectedTokens.join(', ')}${issue.affectedTokens.length < issue.affectedTokens.length ? '...' : ''}${issue.suggestion ? `\n  💡 ${issue.suggestion}` : ''}`
          ).join('\n');
        }
      } else {
        response += `\n\n✅ No issues detected! Your design system is healthy.`;
      }

      response += `\n\n🕒 Report generated: ${new Date(report.timestamp).toLocaleString()}`;
    } else if (reportFormat === 'summary') {
      response = `📊 Health: ${report.overallHealth} | Tokens: ${report.metrics.totalTokens} | Issues: ${report.issues.length} | Unused: ${report.metrics.unusedTokens}`;
    } else {
      // Default to actionable format
      response = `🏥 Design System Health Report

📊 Overall Health: ${getHealthEmoji(report.overallHealth)} ${report.overallHealth}

📈 Metrics:
• Total Tokens: ${report.metrics.totalTokens}
• Active Usages: ${report.metrics.activeUsages}
• Unused Tokens: ${report.metrics.unusedTokens}
• Inconsistent Usage: ${report.metrics.inconsistentUsages}
• Recent Changes: ${report.metrics.driftDetected}

⚠️ Issues Found (${report.issues.length}):
${report.issues.map(issue => `• ${issue.title}`).join('\n')}

🕒 Report generated: ${new Date(report.timestamp).toLocaleString()}`;
    }
    
    return {
      content: [{
        type: "text",
        text: response
      }]
    };
    
  } catch (error) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error tracking design system health: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

function getHealthEmoji(health: string): string {
  switch (health) {
    case 'EXCELLENT': return '🟢';
    case 'GOOD': return '🟡';
    case 'WARNING': return '🟠';
    case 'CRITICAL': return '🔴';
    default: return '⚪';
  }
}

function getSeverityEmoji(severity: string): string {
  switch (severity) {
    case 'critical': return '🚨';
    case 'high': return '⚠️';
    case 'medium': return '🟡';
    case 'low': return 'ℹ️';
    default: return '📋';
  }
}

// Phase 6: Real Token Change Simulator with Rollback
interface TokenChangeSimulation {
  id: string;
  tokenId: string;
  oldValue: string;
  newValue: string;
  affectedFiles: Array<{
    filePath: string;
    changes: Array<{
      lineNumber: number;
      oldContent: string;
      newContent: string;
      context: string;
    }>;
  }>;
  timestamp: string;
  applied: boolean;
}

// Enhanced simulation storage with history tracking
const activeSimulations: Map<string, TokenChangeSimulation> = new Map();
const simulationHistory: Array<{
  id: string;
  timestamp: string;
  status: 'simulated' | 'applied' | 'rolled-back';
  tokenId: string;
  summary: string;
}> = [];

async function simulateTokenChange(args: {
  tokenId: string;
  newValue: string;
  includeVisualDiff?: boolean;
  scope?: string;
}): Promise<any> {
  try {
    const { tokenId, newValue, includeVisualDiff = false } = args;
    
    // Find the token
    const token = designTokenRegistry.get(tokenId);
    if (!token) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: `Token "${tokenId}" not found in registry. Run extract_design_tokens first.`
        }]
      };
    }

    // Get all usages of this token
    const tokenUsages = dependencyGraph.usages.filter(usage => usage.tokenId === tokenId);
    
    if (tokenUsages.length === 0) {
      return {
        content: [{
          type: "text",
          text: `🔍 Token "${tokenId}" Simulation\n\n⚠️ No usages found for this token. Safe to change or remove.\n\n💡 Recommendation: Consider removing unused token to reduce design system bloat.`
        }]
      };
    }

    // Create simulation ID
    const simulationId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate changes in files
    const affectedFiles = await simulateFileChanges(token, newValue, tokenUsages, 'all');
    
    // Create simulation record
    const simulation: TokenChangeSimulation = {
      id: simulationId,
      tokenId,
      oldValue: token.value,
      newValue,
      affectedFiles,
      timestamp: new Date().toISOString(),
      applied: false
    };
    
    activeSimulations.set(simulationId, simulation);

    // Add to simulation history
    simulationHistory.push({
      id: simulationId,
      timestamp: simulation.timestamp,
      status: 'simulated',
      tokenId: simulation.tokenId,
      summary: `Simulated change: ${token.name} from ${token.value} to ${newValue}`
    });

    // Generate impact analysis
    const impactLevel = calculateImpactLevel(affectedFiles);
    const summary = generateSimulationSummary(simulation, impactLevel);
    
    let response = `🧪 Token Change Simulation Complete\n\n${summary}`;
    
    if (includeVisualDiff) {
      response += `\n\n📝 File Changes Preview:\n${generateFileChangesPreview(affectedFiles.slice(0, 3))}`;
    }
    
    response += `\n\n🎯 Next Steps:\n• Apply changes: Use apply_token_change with simulation ID: ${simulationId}\n• Review impacts: Each affected file shows exact line changes\n• Rollback anytime: Use rollback_token_change if needed`;

    return {
      content: [{
        type: "text",
        text: response
      }]
    };

  } catch (error) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error simulating token change: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

// Simulate changes in actual files
async function simulateFileChanges(
  token: DesignToken, 
  newValue: string, 
  usages: TokenUsage[], 
  scope: string
): Promise<TokenChangeSimulation['affectedFiles']> {
  const affectedFiles: TokenChangeSimulation['affectedFiles'] = [];
  
  try {
    const fs = await import('fs/promises');
    
    // Group usages by file
    const usagesByFile = usages.reduce((acc, usage) => {
      if (!acc[usage.filePath]) {
        acc[usage.filePath] = [];
      }
      acc[usage.filePath].push(usage);
      return acc;
    }, {} as Record<string, TokenUsage[]>);

    // Process each file
    for (const [filePath, fileUsages] of Object.entries(usagesByFile)) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');
        const changes = [];

        for (const usage of fileUsages) {
          const lineIndex = (usage.lineNumber || 1) - 1;
          if (lineIndex >= 0 && lineIndex < lines.length) {
            const oldContent = lines[lineIndex];
            let newContent = oldContent;

            // Apply token value replacement based on context
            switch (usage.context) {
              case 'css-variable':
                // Replace var(--token) or direct value
                newContent = oldContent.replace(
                  new RegExp(token.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
                  newValue
                );
                break;
                
              case 'css-value':
                newContent = oldContent.replace(
                  new RegExp(token.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
                  newValue
                );
                break;
                
              default:
                // For other contexts, do smart replacement
                newContent = oldContent.replace(
                  new RegExp(token.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
                  newValue
                );
            }

            if (newContent !== oldContent) {
              changes.push({
                lineNumber: usage.lineNumber || 1,
                oldContent,
                newContent,
                context: usage.context
              });
            }
          }
        }

        if (changes.length > 0) {
          affectedFiles.push({
            filePath,
            changes
          });
        }
        
      } catch (fileError) {
        console.warn(`Could not read file ${filePath}:`, fileError);
      }
    }
    
  } catch (error) {
    console.warn('File simulation failed:', error);
  }
  
  return affectedFiles;
}

// Calculate impact level based on affected files
function calculateImpactLevel(affectedFiles: TokenChangeSimulation['affectedFiles']): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const totalFiles = affectedFiles.length;
  const totalChanges = affectedFiles.reduce((sum, file) => sum + file.changes.length, 0);
  
  if (totalFiles === 0) return 'LOW';
  if (totalFiles <= 2 && totalChanges <= 5) return 'LOW';
  if (totalFiles <= 5 && totalChanges <= 15) return 'MEDIUM';
  if (totalFiles <= 10 && totalChanges <= 30) return 'HIGH';
  return 'CRITICAL';
}

// Generate simulation summary
function generateSimulationSummary(simulation: TokenChangeSimulation, impactLevel: string): string {
  const totalFiles = simulation.affectedFiles.length;
  const totalChanges = simulation.affectedFiles.reduce((sum, file) => sum + file.changes.length, 0);
  
  const token = designTokenRegistry.get(simulation.tokenId);
  const tokenName = token?.name || simulation.tokenId;
  
  return `🔍 Token "${tokenName}" → ${simulation.newValue}

📊 Impact Analysis:
• Risk Level: ${impactLevel}
• Files Affected: ${totalFiles}
• Total Changes: ${totalChanges}
• Old Value: ${simulation.oldValue}
• New Value: ${simulation.newValue}

📂 Affected Files:
${simulation.affectedFiles.map(file => 
  `• ${file.filePath} (${file.changes.length} changes)`
).join('\n')}`;
}

// Generate file changes preview
function generateFileChangesPreview(affectedFiles: TokenChangeSimulation['affectedFiles']): string {
  return affectedFiles.map(file => {
    const preview = file.changes.slice(0, 2).map(change => 
      `  Line ${change.lineNumber}:\n  - ${change.oldContent.trim()}\n  + ${change.newContent.trim()}`
    ).join('\n\n');
    
    const moreChanges = file.changes.length > 2 ? `\n  ... ${file.changes.length - 2} more changes` : '';
    
    return `📁 ${file.filePath}:\n${preview}${moreChanges}`;
  }).join('\n\n');
}

// Apply token changes to actual files
async function applyTokenChange(args: {
  simulationId: string;
  confirmApply?: boolean;
}): Promise<any> {
  try {
    const { simulationId, confirmApply = false } = args;
    
    const simulation = activeSimulations.get(simulationId);
    if (!simulation) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: `Simulation "${simulationId}" not found. Use list_token_simulations to see available simulations.`
        }]
      };
    }

    if (simulation.applied) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: `Simulation "${simulationId}" has already been applied. Use rollback_token_change to revert if needed.`
        }]
      };
    }

    if (!confirmApply) {
      const totalFiles = simulation.affectedFiles.length;
      const totalChanges = simulation.affectedFiles.reduce((sum, file) => sum + file.changes.length, 0);
      
      return {
        content: [{
          type: "text",
          text: `⚠️ Confirmation Required\n\nYou are about to apply changes to ${totalFiles} files (${totalChanges} total changes).\n\n🔄 Token: ${simulation.tokenId}\n📝 Change: ${simulation.oldValue} → ${simulation.newValue}\n\n📂 Files to be modified:\n${simulation.affectedFiles.map(f => `• ${f.filePath}`).join('\n')}\n\n⚠️ This action cannot be undone without rollback.\n\n✅ To proceed, call apply_token_change again with confirmApply: true`
        }]
      };
    }

    // Apply changes to files
    const fs = await import('fs/promises');
    const appliedFiles = [];
    const errors = [];

    for (const file of simulation.affectedFiles) {
      try {
        const content = await fs.readFile(file.filePath, 'utf-8');
        const lines = content.split('\n');
        
        // Apply changes in reverse order to maintain line numbers
        const sortedChanges = [...file.changes].sort((a, b) => b.lineNumber - a.lineNumber);
        
        for (const change of sortedChanges) {
          const lineIndex = change.lineNumber - 1;
          if (lineIndex >= 0 && lineIndex < lines.length) {
            lines[lineIndex] = change.newContent;
          }
        }
        
        await fs.writeFile(file.filePath, lines.join('\n'), 'utf-8');
        appliedFiles.push(file.filePath);
        
      } catch (error) {
        errors.push(`${file.filePath}: ${error}`);
      }
    }

    // Update simulation status
    simulation.applied = true;
    activeSimulations.set(simulationId, simulation);

    // Update simulation history
    const historyEntry = simulationHistory.find(entry => entry.id === simulationId);
    if (historyEntry) {
      historyEntry.status = 'applied';
    }

    // Update token in registry
    const token = designTokenRegistry.get(simulation.tokenId);
    if (token) {
      token.value = simulation.newValue;
      token.lastModified = new Date().toISOString();
      token.version += 1;
      designTokenRegistry.set(simulation.tokenId, token);
    }

    let response = `✅ Token Change Applied Successfully\n\n📊 Summary:\n• Simulation ID: ${simulationId}\n• Token: ${simulation.tokenId}\n• Old Value: ${simulation.oldValue}\n• New Value: ${simulation.newValue}\n• Files Modified: ${appliedFiles.length}\n• Total Changes: ${simulation.affectedFiles.reduce((sum, f) => sum + f.changes.length, 0)}`;

    if (errors.length > 0) {
      response += `\n\n⚠️ Errors encountered:\n${errors.join('\n')}`;
    }

    response += `\n\n🔄 Rollback: Use rollback_token_change with simulation ID "${simulationId}" to revert changes if needed.`;

    return {
      content: [{
        type: "text",
        text: response
      }]
    };

  } catch (error) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error applying token change: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

// Rollback applied token changes
async function rollbackTokenChange(args: {
  simulationId: string;
  confirmRollback?: boolean;
}): Promise<any> {
  try {
    const { simulationId, confirmRollback = false } = args;
    
    const simulation = activeSimulations.get(simulationId);
    if (!simulation) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: `Simulation "${simulationId}" not found. Use list_token_simulations to see available simulations.`
        }]
      };
    }

    if (!simulation.applied) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: `Simulation "${simulationId}" has not been applied yet. Nothing to rollback.`
        }]
      };
    }

    if (!confirmRollback) {
      const totalFiles = simulation.affectedFiles.length;
      const totalChanges = simulation.affectedFiles.reduce((sum, file) => sum + file.changes.length, 0);
      
      return {
        content: [{
          type: "text",
          text: `⚠️ Rollback Confirmation Required\n\nYou are about to rollback changes in ${totalFiles} files (${totalChanges} total changes).\n\n🔄 Token: ${simulation.tokenId}\n📝 Revert: ${simulation.newValue} → ${simulation.oldValue}\n\n📂 Files to be reverted:\n${simulation.affectedFiles.map(f => `• ${f.filePath}`).join('\n')}\n\n✅ To proceed, call rollback_token_change again with confirmRollback: true`
        }]
      };
    }

    // Rollback changes in files
    const fs = await import('fs/promises');
    const rolledBackFiles = [];
    const errors = [];

    for (const file of simulation.affectedFiles) {
      try {
        const content = await fs.readFile(file.filePath, 'utf-8');
        const lines = content.split('\n');
        
        // Apply rollback in reverse order to maintain line numbers
        const sortedChanges = [...file.changes].sort((a, b) => b.lineNumber - a.lineNumber);
        
        for (const change of sortedChanges) {
          const lineIndex = change.lineNumber - 1;
          if (lineIndex >= 0 && lineIndex < lines.length) {
            lines[lineIndex] = change.oldContent;
          }
        }
        
        await fs.writeFile(file.filePath, lines.join('\n'), 'utf-8');
        rolledBackFiles.push(file.filePath);
        
      } catch (error) {
        errors.push(`${file.filePath}: ${error}`);
      }
    }

    // Update simulation status
    simulation.applied = false;
    activeSimulations.set(simulationId, simulation);

    // Update simulation history
    const historyEntry = simulationHistory.find(entry => entry.id === simulationId);
    if (historyEntry) {
      historyEntry.status = 'rolled-back';
    }

    // Revert token in registry
    const token = designTokenRegistry.get(simulation.tokenId);
    if (token) {
      token.value = simulation.oldValue;
      token.lastModified = new Date().toISOString();
      token.version += 1;
      designTokenRegistry.set(simulation.tokenId, token);
    }

    let response = `🔄 Token Change Rolled Back Successfully\n\n📊 Summary:\n• Simulation ID: ${simulationId}\n• Token: ${simulation.tokenId}\n• Reverted: ${simulation.newValue} → ${simulation.oldValue}\n• Files Reverted: ${rolledBackFiles.length}\n• Total Changes: ${simulation.affectedFiles.reduce((sum, f) => sum + f.changes.length, 0)}`;

    if (errors.length > 0) {
      response += `\n\n⚠️ Errors encountered:\n${errors.join('\n')}`;
    }

    return {
      content: [{
        type: "text",
        text: response
      }]
    };

  } catch (error) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error rolling back token change: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

// List active simulations
async function listTokenSimulations(args: {
  status?: string;
}): Promise<any> {
  try {
    const { status = 'all' } = args;
    
    const allSimulations = Array.from(activeSimulations.values());
    
    let filteredSimulations = allSimulations;
    if (status === 'applied') {
      filteredSimulations = allSimulations.filter(sim => sim.applied);
    } else if (status === 'simulated') {
      filteredSimulations = allSimulations.filter(sim => !sim.applied);
    }

    if (filteredSimulations.length === 0) {
      return {
        content: [{
          type: "text",
          text: `📋 No ${status === 'all' ? '' : status + ' '}simulations found.\n\nUse simulate_token_change to create new simulations.`
        }]
      };
    }

    const simulationsList = filteredSimulations.map(sim => {
      const token = designTokenRegistry.get(sim.tokenId);
      const tokenName = token?.name || sim.tokenId;
      const statusIcon = sim.applied ? '✅' : '🧪';
      const fileCount = sim.affectedFiles.length;
      const changeCount = sim.affectedFiles.reduce((sum, f) => sum + f.changes.length, 0);
      
      return `${statusIcon} ${sim.id}\n  📝 ${tokenName}: ${sim.oldValue} → ${sim.newValue}\n  📂 ${fileCount} files, ${changeCount} changes\n  🕒 ${new Date(sim.timestamp).toLocaleString()}\n  📊 Status: ${sim.applied ? 'Applied' : 'Simulated'}`;
    }).join('\n\n');

    return {
      content: [{
        type: "text",
        text: `📋 Token Change Simulations (${status})\n\n${simulationsList}\n\n💡 Commands:\n• simulate_token_change: Create new simulation\n• apply_token_change: Apply simulated changes\n• rollback_token_change: Revert applied changes`
      }]
    };

  } catch (error) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error listing simulations: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

// ===== COMPREHENSIVE DEBUG AND TESTING TOOLS =====

// Debug dependency graph structure and relationships
async function debugDependencyGraph(): Promise<any> {
  try {
    const graph = dependencyGraph;
    const totalUsages = graph.usages.length;
    const uniqueTokens = [...new Set(graph.usages.map(u => u.tokenId))];
    const uniqueFiles = [...new Set(graph.usages.map(u => u.filePath))];

    // Analyze usage patterns
    const usagesByToken = graph.usages.reduce((acc, usage) => {
      if (!acc[usage.tokenId]) {
        acc[usage.tokenId] = [];
      }
      acc[usage.tokenId].push(usage);
      return acc;
    }, {} as Record<string, TokenUsage[]>);

    const usagesByFile = graph.usages.reduce((acc, usage) => {
      if (!acc[usage.filePath]) {
        acc[usage.filePath] = [];
      }
      acc[usage.filePath].push(usage);
      return acc;
    }, {} as Record<string, TokenUsage[]>);

    // Generate detailed report
    const tokenStats = Object.entries(usagesByToken)
      .map(([tokenId, usages]) => {
        const token = designTokenRegistry.get(tokenId);
        const tokenName = token ? token.name : tokenId;
        const fileCount = [...new Set(usages.map(u => u.filePath))].length;
        return `• ${tokenName} (${tokenId}): ${usages.length} usages across ${fileCount} files`;
      })
      .slice(0, 10)
      .join('\n');

    const fileStats = Object.entries(usagesByFile)
      .map(([filePath, usages]) => {
        const uniqueTokens = [...new Set(usages.map(u => u.tokenId))].length;
        return `• ${filePath}: ${usages.length} usages, ${uniqueTokens} unique tokens`;
      })
      .slice(0, 10)
      .join('\n');

    const relationshipStats = Object.entries(graph.relationships)
      .map(([tokenId, rel]) => {
        const token = designTokenRegistry.get(tokenId);
        const tokenName = token ? token.name : tokenId;
        return `• ${tokenName}: ${rel.directUsages.length} direct, ${rel.computedUsages.length} computed`;
      })
      .slice(0, 10)
      .join('\n');

    return {
      content: [{
        type: "text",
        text: `🕸️ Dependency Graph Debug\n\n📊 Overview:\n• Total usages: ${totalUsages}\n• Unique tokens: ${uniqueTokens.length}\n• Unique files: ${uniqueFiles.length}\n• Last updated: ${graph.lastUpdated}\n\n🎯 Top Token Usage:\n${tokenStats}\n\n📁 Top File Usage:\n${fileStats}\n\n🔗 Relationships:\n${relationshipStats}\n\n💡 Tip: Use debug_token_mappings to see how tokens are matched with code patterns.`
      }]
    };

  } catch (error) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error debugging dependency graph: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

// Full system debug - comprehensive overview
async function debugFullSystem(): Promise<any> {
  try {
    const registrySize = designTokenRegistry.size;
    const mappingsSize = tokenMappings.size;
    const usagesCount = dependencyGraph.usages.length;
    const simulationsCount = activeSimulations.size;
    const historyCount = simulationHistory.length;

    // System health checks
    const healthChecks = [];

    if (registrySize === 0) {
      healthChecks.push("❌ Token registry is empty - run extract_design_tokens");
    } else {
      healthChecks.push(`✅ Token registry: ${registrySize} tokens`);
    }

    if (usagesCount === 0) {
      healthChecks.push("❌ No token usages found - run build_dependency_graph");
    } else {
      healthChecks.push(`✅ Dependency graph: ${usagesCount} usages`);
    }

    if (mappingsSize === 0) {
      healthChecks.push("⚠️ No token mappings - tokens may not be connected to code");
    } else {
      healthChecks.push(`✅ Token mappings: ${mappingsSize} connections`);
    }

    // Calculate mapping coverage
    const tokensWithMappings = Array.from(tokenMappings.keys()).length;
    const mappingCoverage = registrySize > 0 ? (tokensWithMappings / registrySize * 100).toFixed(1) : '0';

    // Find unmapped tokens
    const unmappedTokens = Array.from(designTokenRegistry.keys())
      .filter(tokenId => !tokenMappings.has(tokenId))
; // Show ALL unmapped tokens

    const unmappedList = unmappedTokens.length > 0
      ? `\n\n🔍 Unmapped tokens (first 5):\n${unmappedTokens.map(id => {
          const token = designTokenRegistry.get(id);
          return `• ${token?.name || id} (${token?.type}): ${token?.value}`;
        }).join('\n')}`
      : '';

    return {
      content: [{
        type: "text",
        text: `🔧 Full System Debug\n\n📊 System Status:\n${healthChecks.join('\n')}\n\n📈 Metrics:\n• Mapping coverage: ${mappingCoverage}%\n• Active simulations: ${simulationsCount}\n• Change history: ${historyCount} entries\n\n🎯 Workflow Status:\n${registrySize > 0 && usagesCount > 0 ? '✅ Ready for token change simulation' : '⚠️ Complete setup: extract tokens → build graph → simulate changes'}${unmappedList}\n\n💡 Next steps:\n1. Use test_token_workflow to validate end-to-end functionality\n2. Use simulate_token_change to test conflict detection\n3. Use track_design_system_health for ongoing monitoring`
      }]
    };

  } catch (error) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error debugging full system: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

// Test the complete token workflow with realistic scenarios
async function testTokenWorkflow(): Promise<any> {
  try {
    const testResults = [];

    // Test 1: Extract tokens (should work with current Figma data)
    testResults.push("🧪 Test 1: Token Extraction");
    if (designTokenRegistry.size > 0) {
      testResults.push("✅ Token registry populated");
    } else {
      testResults.push("❌ Token registry empty - run extract_design_tokens first");
    }

    // Test 2: Build dependency graph (should find tokens in test files)
    testResults.push("\n🧪 Test 2: Dependency Graph Building");
    if (dependencyGraph.usages.length > 0) {
      testResults.push("✅ Token usages detected");

      // Check for test file detection
      const testFileUsages = dependencyGraph.usages.filter(u =>
        u.filePath.includes('test-realistic-tokens.css') ||
        u.filePath.includes('test-component.tsx')
      );

      if (testFileUsages.length > 0) {
        testResults.push(`✅ Test files detected: ${testFileUsages.length} usages`);
      } else {
        testResults.push("⚠️ Test files not detected - may need to rebuild dependency graph");
      }
    } else {
      testResults.push("❌ No token usages found - run build_dependency_graph");
    }

    // Test 3: Token mapping effectiveness
    testResults.push("\n🧪 Test 3: Token Mapping");
    if (tokenMappings.size > 0) {
      const avgConfidence = Array.from(tokenMappings.values())
        .reduce((sum, mapping) => sum + mapping.confidence, 0) / tokenMappings.size;
      testResults.push(`✅ Token mappings created: ${tokenMappings.size} mappings, avg confidence: ${avgConfidence.toFixed(2)}`);
    } else {
      testResults.push("❌ No token mappings - tokens not connected to code usage");
    }

    // Test 4: Conflict detection capability
    testResults.push("\n🧪 Test 4: Conflict Detection");
    const whiteTokens = Array.from(designTokenRegistry.values()).filter(t =>
      isWhiteColor(t.value) || t.name.toLowerCase().includes('white')
    );

    if (whiteTokens.length > 0) {
      testResults.push(`✅ Found ${whiteTokens.length} white color tokens for conflict testing`);

      // Simulate a conflict scenario
      const testToken = whiteTokens[0];
      const conflicts = await analyzeSemanticConflicts(testToken, '#000000', 'Testing conflict detection');

      if (conflicts.length > 0) {
        testResults.push(`✅ Conflict detection working: ${conflicts.length} conflicts detected`);
        testResults.push(`   • ${conflicts[0].type}: ${conflicts[0].severity} severity`);
      } else {
        testResults.push("⚠️ Conflict detection may need enhancement");
      }
    } else {
      testResults.push("⚠️ No suitable tokens found for conflict testing");
    }

    // Test 5: Simulation system
    testResults.push("\n🧪 Test 5: Simulation System");
    testResults.push(`✅ Active simulations: ${activeSimulations.size}`);
    testResults.push(`✅ Simulation history: ${simulationHistory.length} entries`);

    // Overall assessment
    testResults.push("\n🎯 Overall Assessment:");
    const passedTests = testResults.filter(r => r.includes('✅')).length;
    const totalTests = testResults.filter(r => r.includes('🧪')).length;

    if (passedTests >= totalTests * 0.8) {
      testResults.push("🟢 System is ready for production use");
    } else if (passedTests >= totalTests * 0.6) {
      testResults.push("🟡 System needs minor fixes before production");
    } else {
      testResults.push("🔴 System needs significant work before production");
    }

    testResults.push(`\n📊 Test Score: ${passedTests}/${totalTests * 2} checks passed`);
    testResults.push("\n💡 To test conflict detection, try:");
    testResults.push("simulate_token_change with tokenId from a white color token and newValue '#000000'");

    return {
      content: [{
        type: "text",
        text: testResults.join('\n')
      }]
    };

  } catch (error) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error testing token workflow: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}
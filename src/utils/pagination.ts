import yaml from "js-yaml";
import type { SimplifiedNode, SimplifiedDesign } from "~/services/simplify-node-response.js";

// Conservative estimate: ~4 characters per token on average
const CHARS_PER_TOKEN = 4;
const MAX_TOKENS = 25000;
const SAFETY_MARGIN = 0.8; // Use 80% of max to be safe
const TARGET_TOKENS = Math.floor(MAX_TOKENS * SAFETY_MARGIN);
const TARGET_CHARS = TARGET_TOKENS * CHARS_PER_TOKEN;

export type PaginationMode = "by-pages" | "by-nodes" | "auto";

export interface PaginationMetadata {
  currentPage: number;
  totalPages: number;
  totalNodes: number;
  nodesPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
  mode: PaginationMode;
  pageContent?: string; // Description of what's on this page
}

export interface PaginatedResponse {
  metadata: any;
  nodes: SimplifiedNode[];
  globalVars: any;
  pagination: PaginationMetadata;
  navigationHint?: string;
}

/**
 * Estimates the token count for a given object when serialized
 */
export function estimateTokenCount(obj: any, format: "yaml" | "json" = "yaml"): number {
  const serialized = format === "json" ? JSON.stringify(obj, null, 2) : yaml.dump(obj);
  return Math.ceil(serialized.length / CHARS_PER_TOKEN);
}

/**
 * Splits nodes into pages based on token limits
 */
export function paginateNodes(
  nodes: SimplifiedNode[],
  metadata: any,
  globalVars: any,
  options: {
    page?: number;
    pageSize?: number;
    mode?: PaginationMode;
    format?: "yaml" | "json";
  } = {}
): PaginatedResponse {
  const { page = 1, pageSize, mode = "auto", format = "yaml" } = options;

  // Estimate base size (metadata + globalVars)
  const baseSize = estimateTokenCount({ metadata, globalVars }, format);
  const availableTokens = TARGET_TOKENS - baseSize;

  // Handle different pagination modes
  if (mode === "by-pages") {
    return paginateByPages(nodes, metadata, globalVars, page, format);
  }

  // Calculate optimal page size if not provided
  let optimalPageSize = pageSize;
  if (!optimalPageSize) {
    // Estimate average node size
    const sampleSize = Math.min(10, nodes.length);
    const sampleNodes = nodes.slice(0, sampleSize);
    const sampleTokens = estimateTokenCount(sampleNodes, format);
    const avgTokensPerNode = sampleTokens / sampleSize;
    
    // Calculate how many nodes fit in available space
    optimalPageSize = Math.max(1, Math.floor(availableTokens / avgTokensPerNode));
  }

  // Calculate pagination info
  const totalNodes = nodes.length;
  const totalPages = Math.ceil(totalNodes / optimalPageSize);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  
  // Get nodes for current page
  const startIdx = (currentPage - 1) * optimalPageSize;
  const endIdx = Math.min(startIdx + optimalPageSize, totalNodes);
  const pageNodes = nodes.slice(startIdx, endIdx);

  // Generate page content description
  const pageContent = generatePageContent(pageNodes);

  // Create pagination metadata
  const pagination: PaginationMetadata = {
    currentPage,
    totalPages,
    totalNodes,
    nodesPerPage: optimalPageSize,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    mode: mode === "auto" ? "by-nodes" : mode,
    pageContent
  };

  // Generate navigation hint
  const navigationHint = generateNavigationHint(pagination);

  return {
    metadata,
    nodes: pageNodes,
    globalVars,
    pagination,
    navigationHint
  };
}

/**
 * Paginate by Figma pages (CANVAS nodes)
 */
function paginateByPages(
  nodes: SimplifiedNode[],
  metadata: any,
  globalVars: any,
  pageNum: number,
  format: "yaml" | "json"
): PaginatedResponse {
  // Filter to get only CANVAS (page) nodes
  const pages = nodes.filter(node => node.type === "CANVAS");
  const totalPages = pages.length;
  const currentPage = Math.max(1, Math.min(pageNum, totalPages));
  
  // Get the selected page
  const selectedPage = pages[currentPage - 1];
  const pageNodes = selectedPage ? [selectedPage] : [];

  const pagination: PaginationMetadata = {
    currentPage,
    totalPages,
    totalNodes: 1,
    nodesPerPage: 1,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    mode: "by-pages",
    pageContent: selectedPage ? `Page: ${selectedPage.name}` : "No page found"
  };

  return {
    metadata,
    nodes: pageNodes,
    globalVars,
    pagination,
    navigationHint: generateNavigationHint(pagination)
  };
}

/**
 * Generate a description of what's on the current page
 */
function generatePageContent(nodes: SimplifiedNode[]): string {
  if (nodes.length === 0) return "No content";
  
  const types = nodes.reduce((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const summary = Object.entries(types)
    .map(([type, count]) => `${count} ${type}`)
    .join(", ");

  const nodeNames = nodes.slice(0, 3).map(n => n.name).join(", ");
  const more = nodes.length > 3 ? ` and ${nodes.length - 3} more` : "";

  return `${summary} - Including: ${nodeNames}${more}`;
}

/**
 * Generate navigation instructions for AI
 */
function generateNavigationHint(pagination: PaginationMetadata): string {
  const hints: string[] = [
    `\n📄 Page ${pagination.currentPage} of ${pagination.totalPages}`,
    `Content: ${pagination.pageContent || "Various nodes"}`
  ];

  if (pagination.totalPages > 1) {
    hints.push("\nTo navigate:");
    if (pagination.hasNext) {
      hints.push(`- Next page: Call get_figma_data with page=${pagination.currentPage + 1}`);
    }
    if (pagination.hasPrev) {
      hints.push(`- Previous page: Call get_figma_data with page=${pagination.currentPage - 1}`);
    }
    hints.push(`- Jump to page: Call get_figma_data with page=N (1-${pagination.totalPages})`);
    
    if (pagination.mode === "by-pages") {
      hints.push("\nEach page represents a Figma page (CANVAS node) in the design file.");
    } else {
      hints.push(`\nEach page contains up to ${pagination.nodesPerPage} nodes.`);
    }
  }

  return hints.join("\n");
}

/**
 * Check if a response would exceed token limits
 */
export function wouldExceedTokenLimit(
  data: any,
  format: "yaml" | "json" = "yaml"
): boolean {
  const tokens = estimateTokenCount(data, format);
  return tokens > TARGET_TOKENS;
}

/**
 * Get pagination summary for file overview
 */
export function getPaginationSummary(
  nodes: SimplifiedNode[],
  mode: PaginationMode = "auto"
): string {
  if (mode === "by-pages") {
    const pages = nodes.filter(node => node.type === "CANVAS");
    return `This file contains ${pages.length} pages. Use pagination to explore each page in detail.`;
  }

  const totalNodes = nodes.length;
  const avgNodeSize = 100; // Conservative estimate
  const nodesPerPage = Math.floor(TARGET_TOKENS / avgNodeSize);
  const totalPages = Math.ceil(totalNodes / nodesPerPage);

  return `This file contains ${totalNodes} nodes across ${totalPages} pages. Use pagination to explore the full design.`;
}
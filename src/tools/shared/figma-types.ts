/**
 * Shared Figma analysis types used by multiple tool modules.
 *
 * Single source of truth for screen/frame summaries, page summaries, and
 * app-structure analysis shapes. Do NOT duplicate these types in tool
 * modules — import from here instead.
 */

import type { SimplifiedNode } from "../../services/simplify-node-response.js";
import type {
  SimplifiedComponentDefinition,
  SimplifiedComponentSetDefinition,
} from "../../utils/sanitization.js";

/** A single frame/component/instance summary. */
export interface FrameSummary {
  id: string;
  name: string;
  type: string;
  width?: number;
  height?: number;
  childCount: number;
  hasPrototype: boolean;
  /** Inferred screen category (settings, onboarding, home, etc.) — only populated by deep-analysis. */
  screenType?: string;
}

/** A page (CANVAS) summary with its top-level frames. */
export interface PageSummary {
  id: string;
  name: string;
  type: string;
  frameCount: number;
  frames: FrameSummary[];
  thumbnailUrl?: string;
  /** Deep-analysis extras. */
  screenType?: string;
  totalElements?: number;
}

/** Groups frames by inferred screenType. */
export type ScreenTypeGroup = Record<string, FrameSummary[]>;

export interface NavigationPattern {
  type: string;
  description: string;
  screens: number;
}

export interface UserJourney {
  name: string;
  steps: string[];
}

export interface AppFlow {
  screenTypes: ScreenTypeGroup;
  navigationPatterns: NavigationPattern[];
  userJourneys: UserJourney[];
}

export interface ColorToken {
  id: string;
  name: string;
  value: string;
}

export interface TypographyToken {
  id: string;
  name: string;
  properties: Record<string, unknown>;
}

export interface DesignSystemTokens {
  colors: ColorToken[];
  typography: TypographyToken[];
  components: SimplifiedComponentDefinition[];
  patterns: string[];
}

export interface StructureAnalysis {
  totalPages: number;
  totalFrames: number;
  totalElements: number;
  pages: PageSummary[];
}

export interface AppStructureAnalysis {
  metadata: {
    fileName: string;
    fileKey: string;
    lastModified: string;
    analysisTimestamp: string;
  };
  structure: StructureAnalysis;
  designSystem: DesignSystemTokens;
  appFlow: AppFlow;
}

/** Re-export for consumers that need the simplified Figma shapes. */
export type { SimplifiedNode, SimplifiedComponentDefinition, SimplifiedComponentSetDefinition };

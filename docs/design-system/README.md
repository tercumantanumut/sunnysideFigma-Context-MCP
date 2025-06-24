# Design System Tools

The Sunnyside Figma MCP server includes advanced design system management tools that help teams track design token evolution, analyze change impacts, and maintain consistency between design and code.

## 🆕 Recent Enhancements

- **✅ Fixed TokenId Display Consistency** - Resolved naming conflicts between token IDs and display names in impact analysis
- **✅ Enhanced File Scanning** - Improved recursive file discovery with proper path resolution (now scans 5+ files vs 0 before)
- **✅ Advanced Conflict Detection** - Real-time detection of design token conflicts and inconsistencies across codebase
- **✅ Multi-format Health Reports** - Support for actionable, detailed, and summary report formats
- **✅ Production Testing** - Comprehensive test suite with realistic conflict scenarios and edge cases

## Overview

Design systems are living entities that evolve over time. These tools provide:
- **Token Extraction** - Catalog design tokens from Figma
- **Dependency Tracking** - Map token usage across codebases
- **Impact Analysis** - AI-powered change impact assessment
- **Migration Generation** - Automated code migration
- **Health Monitoring** - System drift detection
- **Change Simulation** - Safe preview of modifications

## Available Tools

### Token Management

#### `extract_design_tokens`
Extracts and catalogs design tokens from current Figma selection, creating the foundation for dependency tracking.

**Parameters:**
- `includeVariables` (default: true) - Include Figma variables (design tokens)
- `includeStyles` (default: true) - Include text/color styles
- `scanDepth` (default: 3) - Component hierarchy scan depth

**Example:**
```javascript
extract_design_tokens({
  includeVariables: true,
  includeStyles: true,
  scanDepth: 5
})
```

**Output:**
```
🎨 Design Token Extraction Complete

Found 9 design tokens: 2 color tokens, 6 spacing tokens, 1 border-radius token

📊 Extracted Tokens:
• fill-0 (color): #ffffff
• paddingTop (spacing): 0px
• paddingRight (spacing): 0px
• paddingBottom (spacing): 0px
• paddingLeft (spacing): 0px
• gap (spacing): 0px
• Fill 0 (color): rgb(255, 255, 255)
• Border Radius (border-radius): 0px
• Gap (spacing): 0px

✅ 9 tokens added to registry

🔍 Debug Info:
• Node type: FRAME
• Has designTokens: true
• Has effects: true
• Effects count: 0
• Children count: 1
• Children with effects: 0
• Has CSS: true
• Scan depth: 3
```

#### `build_dependency_graph`
Scans codebase and builds dependency graph mapping design token usage across files.

**Parameters:**
- `codebasePath` (default: "./src") - Path to codebase root
- `filePatterns` (default: ["**/*.{ts,tsx,js,jsx,css,scss,vue}"]) - File patterns to scan
- `tokenFormats` (default: ["css-variables", "tailwind-classes", "js-tokens"]) - Token formats to detect
- `updateExisting` (default: true) - Update existing graph

**Example:**
```javascript
build_dependency_graph({
  codebasePath: "./src",
  filePatterns: ["**/*.{ts,tsx,css,scss}"],
  tokenFormats: ["css-variables", "tailwind-classes"]
})
```

**Output:**
```
🕸️ Dependency Graph Analysis Complete

Mapped 19 token usages across 5 files
Usage types: 19 direct

📊 Graph Statistics:
• Total tokens tracked: 0
• Total usage instances: 19
• Files scanned: 5
• Token formats detected: css-variables, tailwind-classes, js-tokens

🔍 Top Token Usage:
• colors.primary: 3 usages across 3 files
• tokens.colors.background: 3 usages across 3 files
• --color-primary: 2 usages across 2 files
• shadow-sm: 2 usages across 2 files
• bg-white: 2 usages across 2 files
```

### Change Analysis

#### `analyze_token_change_impact`
AI-powered analysis of what happens when a design token changes. Identifies affected components, edge cases, and generates migration strategies.

**Parameters:**
- `tokenId` (required) - ID of the design token being changed
- `newValue` (required) - New value for the token
- `changeReason` (optional) - Why the change is being made
- `generateMigration` (default: true) - Generate automatic migration code
- `includeEdgeCases` (default: true) - Include AI analysis of potential edge cases

**Example:**
```javascript
analyze_token_change_impact({
  tokenId: "color-primary-500",
  newValue: "#2563eb",
  changeReason: "Improved WCAG AA compliance",
  generateMigration: true,
  includeEdgeCases: true
})
```

**Output:**
```
🔍 Token "color-fill-0" Analysis

⚠️ No usages found for this token. It may be safe to change or remove.

Recommendation: Consider removing unused token to reduce design system bloat.
```

**Advanced Output (with conflicts detected):**
```
🔍 Token "color-fill-0" Analysis

⚠️ No direct usages found, but potential semantic conflicts detected:

• accessibility: Changing white to black will cause severe accessibility issues with text contrast
• branding: Significant color change (distance: 442) may impact brand consistency

💡 Recommendation: Review all text elements that use this background color and ensure proper contrast ratios
```

#### `generate_migration_code`
Generates comprehensive migration code for design token changes, including CSS updates, component modifications, and test cases.

**Parameters:**
- `changeAnalysisId` (required) - ID of the change impact analysis
- `migrationStrategy` (default: "gradual") - Strategy for rolling out changes
- `includeTests` (default: true) - Generate test cases
- `includeDocs` (default: true) - Generate documentation updates

**Migration Strategies:**
- `gradual` - Phased rollout with backwards compatibility
- `atomic` - All-at-once change
- `feature-flag` - Feature flag controlled rollout

### System Health

#### `track_design_system_health`
Monitors design system health over time, identifying token drift, unused tokens, and inconsistent usage patterns.

**Parameters:**
- `healthChecks` (default: ["token-drift", "unused-tokens", "inconsistent-usage"]) - Types of checks
- `reportFormat` (default: "actionable") - Report format

**Health Checks:**
- `token-drift` - Detect inconsistent token usage
- `unused-tokens` - Identify unused tokens
- `inconsistent-usage` - Find usage pattern inconsistencies
- `accessibility-compliance` - Check accessibility standards
- `performance-impact` - Assess performance implications

**Report Formats:**
- `actionable` - Focused on immediate actions with suggestions
- `detailed` - Comprehensive analysis with full context
- `summary` - Brief overview for dashboards

**Example Output:**
```
🏥 Design System Health Report

📊 Overall Health: 🟡 GOOD

📈 Metrics:
• Total Tokens: 9
• Active Usages: 19
• Unused Tokens: 9
• Inconsistent Usage: 0
• Recent Changes: 0

⚠️ Issues Found (1):

🟡 9 Unused Design Tokens
  Found 9 tokens with no usage in codebase. Consider removing to reduce bloat.
  🎯 Tokens: color-fill-0, spacing-paddingTop, spacing-paddingRight, spacing-paddingBottom, spacing-paddingLeft
  💡 Review and remove unused tokens: color-fill-0, spacing-paddingTop, spacing-paddingRight...

🕒 Report generated: 6/24/2025, 12:02:04 PM
```

#### `simulate_token_change`
Simulates a design token change without actually applying it. Perfect for design reviews and impact planning.

**Parameters:**
- `tokenId` (required) - ID of token to simulate changing
- `newValue` (required) - Simulated new value
- `scope` (default: "all") - Scope of simulation
- `includeVisualDiff` (default: false) - Generate visual diff

## Design System Workflows

### Initial Setup
```javascript
// 1. Extract current design tokens
extract_design_tokens({
  includeVariables: true,
  includeStyles: true,
  scanDepth: 5
})

// 2. Build dependency graph
build_dependency_graph({
  codebasePath: "./src",
  filePatterns: ["**/*.{ts,tsx,css,scss}"]
})

// 3. Check system health
track_design_system_health({
  healthChecks: ["token-drift", "unused-tokens"],
  reportFormat: "actionable"
})
```

### Change Management
```javascript
// 1. Simulate the change
simulate_token_change({
  tokenId: "spacing-md",
  newValue: "20px",
  scope: "components"
})

// 2. Analyze impact
analyze_token_change_impact({
  tokenId: "spacing-md",
  newValue: "20px",
  changeReason: "Better visual hierarchy",
  generateMigration: true
})

// 3. Generate migration code
generate_migration_code({
  changeAnalysisId: "analysis-123",
  migrationStrategy: "gradual",
  includeTests: true
})
```

### Ongoing Monitoring
```javascript
// Regular health checks
track_design_system_health({
  healthChecks: [
    "token-drift",
    "unused-tokens", 
    "inconsistent-usage",
    "accessibility-compliance"
  ],
  reportFormat: "detailed"
})
```

## Token Types Supported

### Color Tokens
- Hex values (#3b82f6)
- RGB/RGBA values
- HSL/HSLA values
- CSS custom properties

### Spacing Tokens
- Pixel values (16px, 24px)
- Rem values (1rem, 1.5rem)
- Custom spacing scales

### Typography Tokens
- Font families
- Font sizes
- Font weights
- Line heights

### Shadow Tokens
- Box shadows
- Drop shadows
- Text shadows

### Effect Tokens
- Border radius
- Opacity values
- Blur effects

## Best Practices

### Token Naming
- Use semantic names (primary, secondary) over descriptive (blue, red)
- Follow consistent naming conventions
- Include context in token names

### Change Management
- Always simulate changes before applying
- Use gradual migration strategies for large changes
- Include comprehensive testing in migrations
- Document all token changes

### System Health
- Run regular health checks
- Monitor for token drift
- Remove unused tokens promptly
- Maintain accessibility compliance

## Next Steps

- [Code Generation Tools](../code-generation/README.md) - Generate components with tokens
- [Examples](../examples/design-system-examples.md) - See complete workflows
- [API Reference](../api/design-system-api.md) - Technical specifications
- [Best Practices](../examples/best-practices.md) - Recommended patterns

# Testing Guide

Comprehensive testing scenarios and validation workflows for the Sunnyside Figma MCP tools.

## Test Scenarios

### 1. Token Registration Extraction

**Test Case:** Extract design tokens from Figma selection
```javascript
extract_design_tokens({
  includeVariables: true,
  includeStyles: true,
  scanDepth: 3
})
```

**Expected Output:**
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
```

### 2. Dependency Graph Building

**Test Case:** Scan codebase for token usage
```javascript
build_dependency_graph({
  codebasePath: "./src",
  filePatterns: ["**/*.{ts,tsx,js,jsx,css,scss}"],
  tokenFormats: ["css-variables", "tailwind-classes", "js-tokens"],
  updateExisting: false
})
```

**Expected Output:**
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

### 3. Change Impact Analysis

**Test Case:** Analyze token change impact with conflict detection
```javascript
analyze_token_change_impact({
  tokenId: "color-fill-0",
  newValue: "#000000",
  changeReason: "Testing major conflict - changing white to black",
  includeEdgeCases: true,
  generateMigration: true
})
```

**Expected Output:**
```
🔍 Token "color-fill-0" Analysis

⚠️ No direct usages found, but potential semantic conflicts detected:

• accessibility: Changing white to black will cause severe accessibility issues with text contrast
• branding: Significant color change (distance: 442) may impact brand consistency

💡 Recommendation: Review all text elements that use this background color and ensure proper contrast ratios
```

### 4. Design System Health Monitoring

**Test Case:** Track design system health with multiple formats
```javascript
track_design_system_health({
  healthChecks: ["token-drift", "unused-tokens", "inconsistent-usage"],
  reportFormat: "actionable"
})
```

**Expected Output:**
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

## Conflict Detection Test Cases

### Test Components with Conflicts

The testing suite can be extended with realistic components that demonstrate intentional conflicts:

1. **Button Components** - Mixed token usage and hardcoded values
2. **CSS Stylesheets** - CSS with token conflicts and inconsistencies
3. **Card Components** - Inline styles mixing tokens and hardcoded values
4. **Theme Files** - Comprehensive themes with multiple conflict types

### Conflict Types Detected

- **Token Naming Conflicts** - Multiple tokens with same semantic meaning
- **Hardcoded Value Conflicts** - Values that should be tokens
- **Semantic Conflicts** - Tokens used for wrong purposes
- **Accessibility Conflicts** - Color contrast and usability issues
- **Responsive Conflicts** - Inconsistent responsive token usage

## Validation Workflows

### 1. Complete System Test
```bash
# 1. Extract tokens from Figma
# 2. Build dependency graph
# 3. Analyze change impact
# 4. Check system health
# 5. Simulate token changes
```

### 2. Conflict Resolution Workflow
```bash
# 1. Identify conflicts through health monitoring
# 2. Analyze impact of proposed fixes
# 3. Generate migration code
# 4. Test changes in simulation
# 5. Apply changes with rollback capability
```

### 3. Performance Validation
- File scanning performance (5+ files scanned)
- Token extraction speed
- Dependency graph building efficiency
- Health report generation time

## Debugging and Troubleshooting

### Common Issues

1. **No Files Scanned (0 files)**
   - Check path resolution
   - Verify file patterns
   - Ensure proper permissions

2. **TokenId Display Inconsistency**
   - ✅ Fixed: Now shows correct token IDs in all outputs

3. **Empty Health Reports**
   - ✅ Fixed: Added support for all report formats

### Debug Tools

- `debug_token_registry` - Check token registry contents
- Console logging for file scanning progress
- Path resolution debugging
- Token matching validation

## Test Results Summary

### ✅ Working Features
- Token registration extraction (9 tokens)
- File scanning (5+ files discovered)
- Dependency graph building (19 usages detected)
- Change impact analysis with conflict detection
- Health monitoring with multiple report formats
- TokenId display consistency

### 🔧 Recent Fixes
- Fixed file scanning path resolution
- Enhanced recursive directory discovery
- Improved token ID consistency
- Added multi-format health reports
- Enhanced conflict detection capabilities

## Next Steps

- [Design System Tools](../design-system/README.md) - Full tool documentation
- [Examples](../examples/README.md) - Practical usage examples
- [Troubleshooting](../troubleshooting.md) - Common issues and solutions

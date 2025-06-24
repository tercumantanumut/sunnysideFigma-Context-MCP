# Examples and Tutorials

This section provides practical examples and tutorials for using the Sunnyside Figma MCP server in real-world scenarios.

## 🆕 New Examples

- **Conflict Detection Scenarios** - Real-world token conflict examples and resolution
- **Enhanced Health Monitoring** - Multi-format health reports with actionable insights
- **Production Testing** - Comprehensive test cases with realistic components
- **Advanced File Scanning** - Examples of improved dependency tracking

## Example Categories

### [Basic Workflows](basic-workflows.md)
Common use cases and simple workflows to get you started.

- **Component Extraction** - Extract and generate React components
- **CSS Generation** - Get pixel-perfect CSS from designs
- **Asset Downloads** - Download icons and images
- **Simple Integrations** - Basic AI agent workflows

### [Advanced Examples](advanced-examples.md)
Complex scenarios and advanced use cases.

- **Design System Management** - Complete token management workflows
- **Multi-Framework Generation** - Generate for React, Vue, Angular
- **Custom Plugin Development** - Build specialized Figma plugins
- **Automated Workflows** - Batch processing and automation

### [Design System Examples](design-system-examples.md)
Comprehensive design system management examples.

- **Token Evolution Tracking** - Monitor design token changes
- **Impact Analysis** - Analyze change impacts across codebases
- **Migration Generation** - Automated code migrations
- **Health Monitoring** - System health and drift detection

### [Integration Examples](integration-examples.md)
Examples of integrating with various tools and platforms.

- **AI Agent Integration** - Augment, Claude, and other AI tools
- **CI/CD Integration** - Automated design-to-code pipelines
- **Development Workflows** - Integration with development tools
- **Team Collaboration** - Multi-team workflows

## Quick Start Examples

### Extract a Button Component
```javascript
// 1. Select button in Figma and run plugin
// 2. Use AI agent with natural language:
"Extract the selected button and generate a React component with Tailwind styling"

// 3. AI agent executes:
get_figma_dev_code({ format: "both" })
get_tailwind_component({
  componentName: "PrimaryButton",
  responsiveBreakpoints: true
})
```

### Download Icon Set
```javascript
// Extract multiple icons at once
download_figma_images({
  fileKey: "design-file-key",
  nodes: [
    { nodeId: "100:1", fileName: "icons/home.svg" },
    { nodeId: "100:2", fileName: "icons/search.svg" },
    { nodeId: "100:3", fileName: "icons/user.svg" },
    { nodeId: "100:4", fileName: "icons/settings.svg" }
  ],
  localPath: "./src/assets/icons",
  svgOptions: {
    outlineText: true,
    simplifyStroke: true
  }
})
```

### Analyze Design Token Change *(Enhanced)*
```javascript
// Check impact of changing primary color with conflict detection
analyze_token_change_impact({
  tokenId: "color-fill-0",
  newValue: "#000000",
  changeReason: "Testing major conflict - changing white to black",
  generateMigration: true,
  includeEdgeCases: true
})

// Output includes semantic conflict detection:
// 🔍 Token "color-fill-0" Analysis
// ⚠️ No direct usages found, but potential semantic conflicts detected:
// • accessibility: Changing white to black will cause severe accessibility issues
// • branding: Significant color change (distance: 442) may impact brand consistency
```

### Track Design System Health *(New)*
```javascript
// Monitor design system health with detailed reporting
track_design_system_health({
  healthChecks: ["token-drift", "unused-tokens", "inconsistent-usage"],
  reportFormat: "detailed"
})

// Output provides comprehensive health analysis:
// 🏥 Design System Health Report
// 📊 Overall Health: 🟡 GOOD
// ⚠️ Issues Found (1): 9 Unused Design Tokens
```

## Common Patterns

### Design-to-Code Workflow
1. **Design Phase** - Create components in Figma
2. **Extraction Phase** - Use plugin to extract design data
3. **Generation Phase** - Generate code using MCP tools
4. **Integration Phase** - Integrate generated code into project
5. **Maintenance Phase** - Track changes and update code

### Component Library Workflow
1. **Token Extraction** - Extract design tokens from Figma
2. **Dependency Mapping** - Build codebase dependency graph
3. **Component Generation** - Generate base components
4. **System Health** - Monitor for inconsistencies
5. **Evolution Management** - Handle token changes over time

### Asset Management Workflow
1. **Asset Identification** - Identify assets in Figma
2. **Batch Download** - Download assets with proper organization
3. **Optimization** - Optimize assets for production
4. **Integration** - Integrate assets into build process
5. **Maintenance** - Keep assets synchronized with designs

## Best Practices

### Code Generation
- Use semantic component names
- Follow consistent naming conventions
- Include proper TypeScript types
- Organize generated code logically

### Design System Management
- Extract tokens regularly
- Monitor system health continuously
- Use gradual migration strategies
- Document all changes

### Asset Management
- Organize assets in logical folder structures
- Use consistent naming conventions
- Optimize assets for target platforms
- Maintain asset synchronization

### Team Collaboration
- Establish clear workflows
- Document processes and conventions
- Use version control for generated code
- Communicate changes effectively


## Code Examples Repository

All examples include:
- Complete source code
- Step-by-step instructions
- Expected outputs
- Troubleshooting tips
- Best practices

### Example Structure
```
examples/
├── basic/
│   ├── button-component/
│   ├── css-extraction/
│   └── asset-download/
├── advanced/
│   ├── design-system/
│   ├── multi-framework/
│   └── custom-plugin/
├── integration/
│   ├── ai-agents/
│   ├── cicd/
│   └── development-tools/
└── tutorials/
    ├── getting-started/
    ├── advanced/
    └── team-workflows/
```

## Interactive Examples

### Try It Yourself
Each example includes:
- Figma file templates
- Sample configurations
- Expected results
- Troubleshooting guides

### Live Demos
- Online playground for testing tools
- Interactive tutorials
- Real-time code generation
- Community examples

## Community Examples

### Contributed Examples
- Community-submitted workflows
- Real-world use cases
- Industry-specific examples
- Open-source projects

### Example Requests
Have a specific use case? Request an example:
- Submit use case description
- Provide Figma file if possible
- Specify target framework/tools
- Community collaboration welcome

## Next Steps

- [Basic Workflows](basic-workflows.md) - Start with simple examples
- [Advanced Examples](advanced-examples.md) - Explore complex scenarios
- [Tool Reference](../tools/README.md) - Detailed tool documentation
- [API Reference](../api/README.md) - Technical specifications

## Contributing Examples

Want to contribute an example?
1. Follow the example template
2. Include complete documentation
3. Test thoroughly
4. Submit via pull request
5. Help others learn!

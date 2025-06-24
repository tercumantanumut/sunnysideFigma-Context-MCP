# Sunnyside Figma MCP

> Transform Figma designs into production code with AI-powered MCP integration and advanced design system management

## 🎯 FINAL AIM: FULLY AUTONOMOUS FIGMA TO CODE PROJECT BUILDER

**Our ultimate vision is to create a completely autonomous system that can take any Figma design and generate a full, production-ready project with zero human intervention.**

### Current Active Focus: Project Planning & Structuring Tools

We are currently developing **advanced planner tools** that will:

- **🏗️ Full Project Frame Structuring** - Automatically analyze Figma designs and create complete project architectures
- **📋 Intelligent Project Planning** - Generate comprehensive development roadmaps, file structures, and component hierarchies
- **🤖 Autonomous Decision Making** - AI-driven choices for tech stack, patterns, and implementation strategies

## And Finally:
- **🔄 End-to-End Automation** - From Figma selection to deployed application with minimal human oversight

**Next Milestones:**
1. ✅ Design System Management (Current - Advanced token tracking & conflict detection)
2. 🚧 **Project Planning Tools** (Active Development - Smart project structuring)
3. 🔜 Autonomous Code Architecture (Coming Soon - Full project generation)
4. 🔜 Deployment Automation (Future - One-click deployment)

**Current Issues:**
1. SVG/IMG previews on the plugin is not working, will freeze your figma client if you click it, I am working on it, there is no issue agents downloading and seeings assets though. 

---

## Overview

A comprehensive **Model Context Protocol (MCP) server** that bridges Figma designs with AI development workflows. It provides **30+ specialized tools** for extracting pixel-perfect code, assets, component structures, and advanced design system management with conflict detection and automated migration capabilities directly from Figma designs.

## 🆕 Latest Updates

This tool is actively being built, things can break and go south. 

- **✅ Multi-Editor Compatibility** - Plugin now supports all Figma editor types (figma, dev, figjam, slides)
- **✅ Fixed TokenId Display Consistency** - Resolved naming conflicts in change impact analysis
- **✅ Enhanced File Scanning** - Improved dependency graph with recursive file discovery
- **✅ Advanced Conflict Detection** - Real-time detection of design token conflicts and inconsistencies
- **✅ Comprehensive Health Monitoring** - Multi-format design system health reports
- **✅ Production-Ready Testing** - Complete test suite with realistic conflict scenarios
- **✅ Fixed All Layers CSS** - Restored comprehensive CSS generation for all design layers

Size limits for large frames: max 20 children, max depth 3, array limit 100 items, object limit 50 keys


## Features

- **Code Generation**: React, Vue, CSS, Tailwind, styled-components with TypeScript support
- **Advanced Design System Management**: Token extraction, dependency tracking, conflict detection, automated migration
- **Asset Management**: SVG/PNG downloads, image optimization, batch processing
- **Plugin Development**: Custom Figma plugin generation with dev mode integration
- **AI Integration**: Natural language to code workflows with semantic analysis
- **Real-time Sync**: Live design-to-code updates with change observation
- **🆕 Conflict Detection**: Automatic detection of design token conflicts and inconsistencies
- **🆕 Health Monitoring**: Comprehensive design system health tracking with actionable insights
- **🆕 Change Simulation**: Safe preview and rollback of design token changes

## Quick Links

- [Installation Guide](docs/installation.md)
- [Tool Reference](docs/tools/README.md)
- [Design System Tools](docs/design-system/README.md)
- [Code Generation](docs/code-generation/README.md)
- [API Reference](docs/api/README.md)
- [Examples](docs/examples/README.md)
- [Troubleshooting](docs/troubleshooting.md)

## System Architecture

```
Figma Design Canvas
        ↓
Custom Figma Plugin → HTTP Server (:3333) → MCP STDIO Server → AI Agents
        ↓                    ↓
Figma Dev Mode → Dev Mode Server (:3845) ↗
        ↓
Direct Figma API ↗
```

**Three Integration Methods:**
1. **Custom Figma Plugin** - Real-time extraction with comprehensive CSS/React generation
2. **Figma Dev Mode Bridge** - Integration with official Figma development features
3. **Direct Figma API** - Programmatic access to design files

## Quick Start

### Prerequisites
- Node.js 18+
- Figma Desktop App
- Figma API Key ([Get one here](https://www.figma.com/developers/api#access-tokens))

### Installation
```bash
git clone https://github.com/tercumantanumut/sunnysideFigma-Context-MCP
cd figma-context-mcp
npm install
npm run build
```

### Configuration
Create `.env` file:
```env
FIGMA_API_KEY=your_figma_api_key_here
PORT=3333
OUTPUT_FORMAT=json
```

### Start the Server
```bash
# Development Server (HTTP + Plugin Integration)
npm run dev

# MCP CLI Server (AI Agent Integration)
npm run start:cli
```

### Install Figma Plugin
1. Open Figma Desktop
2. Plugins → Development → Import plugin from manifest
3. Select `figma-dev-plugin/manifest.json`
4. Plugin ready to use

**New Plugin Features:**
- **🎨 Extract Assets**: On-demand PNG/SVG extraction with download [ONLY AGENTS CAN DOWNLOAD ASSETS FOR NOW. WILL FIX SOON.] 
- **💻 Generate Code**: React, CSS, Tailwind, Styled Components
- **🚀 MCP Integration**: Send assets and code to AI workflows
- **⚡ Performance**: Fast selection, no freezing

For detailed setup instructions, see the [Installation Guide](docs/installation.md).

## Available Tools

### Code Generation Tools
- **React Components**: TypeScript, functional, class-based
- **CSS Extraction**: Native Figma CSS, comprehensive layer CSS
- **Tailwind Components**: Smart class conversion with design tokens
- **Styled Components**: Modern CSS-in-JS with theme support
- **Vue Components**: Vue 3 composition API support
- **Custom Plugin Generation**: Complete Figma codegen plugins

### Design System Tools *(Enhanced)*
- **Token Extraction**: Colors, spacing, typography, shadows with semantic analysis
- **Dependency Tracking**: Cross-codebase token usage analysis with recursive file scanning
- **Impact Analysis**: AI-powered change impact assessment with conflict detection
- **Migration Generation**: Automated code migration for token changes with rollback support
- **Health Monitoring**: Design system drift detection with detailed reporting
- **Change Simulation**: Safe preview of design changes with visual diff support
- **🆕 Conflict Detection**: Real-time detection of token naming conflicts and inconsistencies
- **🆕 Advanced Analytics**: Token usage patterns, semantic conflicts, accessibility impact
- **🆕 Multi-format Reports**: Actionable, detailed, and summary health report formats

### Asset Management Tools
- **Plugin Asset Extraction**: Direct PNG/SVG export with downloads *(NEW)*
- **URL-Based Access**: Use "Copy link to selection" for reliable images *(RECOMMENDED)*
- **API Downloads**: Batch SVG/PNG extraction with node IDs
- **Asset Optimization**: Configurable export settings
- **File Structure Access**: Complete Figma file data

### Integration Tools
- **Dev Mode Bridge**: Official Figma Dev Mode integration
- **Plugin Integration**: Real-time design extraction
- **API Access**: Direct Figma REST API integration

For complete tool documentation, see [Tool Reference](docs/tools/README.md).

## Usage Workflow

### Basic Workflow
1. **Design in Figma** - Create or select components
2. **Extract with Plugin** - Run the Figma plugin to extract design data
3. **Generate Code** - Use AI agent with MCP tools to generate code
4. **Integrate** - Use generated code in your project

## Notes: 

1. You can send links to the agent. (Copy Link to selection.)
        -In some projects, like community projects, if plugins are disabled, try to send links.
        -If dev mode is disabled on the project, plugin won't work either. 

### Example Commands
```javascript
// Natural language to AI agent:
"Extract the selected button and generate a React component with Tailwind styling"

// AI agent executes:
get_figma_dev_code({ format: "both" })
get_tailwind_component({ componentName: "PrimaryButton" })
```

## Project Structure

```
figma-context-mcp/
├── src/                    # MCP Server source
│   ├── tools/              # MCP tools implementation
│   ├── services/           # Core services
│   └── transformers/       # Code transformers
├── figma-dev-plugin/       # Custom Figma plugin
├── docs/                   # Documentation
├── dist/                   # Compiled server
└── .env                    # Configuration
```

## Documentation

- **[Installation Guide](docs/installation.md)** - Complete setup instructions with MCP configuration
- **[Tool Reference](docs/tools/README.md)** - All 30+ available tools with examples and outputs
- **[Code Generation](docs/code-generation/README.md)** - React, CSS, Tailwind generation with TypeScript support
- **[Design System Tools](docs/design-system/README.md)** - Advanced token management, conflict detection, and automated migration
- **[Asset Management](docs/asset-management/README.md)** - Image and file handling with batch processing
- **[Examples](docs/examples/README.md)** - Practical tutorials, workflows, and conflict resolution scenarios
- **[API Reference](docs/api/README.md)** - Technical specifications and integration patterns
- **[Troubleshooting](docs/troubleshooting.md)** - Common issues, solutions, and debugging guides
- **🆕 [Change Log](CHANGELOG.md)** - Recent updates, fixes, and new features
- **🆕 [Testing Guide](docs/testing/README.md)** - Test scenarios and validation workflows

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the Sunnyside Proprietary Software License - see the [LICENSE](LICENSE) file for details.

**Important:** This software is proprietary to Sunnyside Software. While it incorporates architectural concepts from the open-source Framelink MCP project, it represents a substantially different implementation with proprietary workflows and enhanced features. 

- ✅ **Research & Development Use**: Permitted under license terms
- ❌ **Commercial Use**: Requires explicit written permission
- 📋 **Attribution Required**: Must acknowledge Sunnyside Software and disclose license
- 🔄 **Fork Disclosure**: Derivative works must clearly state relationship to original

For commercial licensing inquiries, please contact Umut TAN (tercumantanumut@gmail.com) at Sunnyside Software.

## Support

- **Documentation** - Comprehensive guides and examples
- **GitHub Issues** - Bug reports and feature requests
- **Community** - Join our community discussions

---

Transform your Figma designs into production code with AI-powered precision!

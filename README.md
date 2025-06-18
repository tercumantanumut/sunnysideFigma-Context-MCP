# 🎨 Figma Context MCP - Complete Guide

> **Transform Figma designs into production code with AI-powered MCP integration**

## 🌟 **What This Is**

A comprehensive **Model Context Protocol (MCP) server** that bridges Figma designs with AI development workflows. It provides **14 specialized tools** for extracting pixel-perfect code, assets, and component structures directly from Figma designs.

### **🏗️ System Architecture**

```
Figma Design Canvas
        ↓
Custom Figma Plugin → HTTP Server (:3333) → MCP STDIO Server → AI Agents
        ↓                    ↓
Figma Dev Mode → Dev Mode Server (:3845) ↗
        ↓
Direct Figma API ↗
```

**Three Integration Alltogether:**
1. **Custom Figma Plugin** - Real-time extraction with comprehensive CSS/React generation
2. **Figma Dev Mode Bridge** - Integration with official Figma development features  
3. **Direct Figma API** - Programmatic access to design files

## 🚀 **Quick Start**

### **1. Prerequisites**
- Node.js 18+
- Figma Desktop App
- Figma API Key ([Get one here](https://www.figma.com/developers/api#access-tokens))

### **2. Installation**
```bash
git clone https://github.com/your-org/figma-context-mcp.git
cd figma-context-mcp
npm install
npm run build
```

### **3. Configuration**
Create `.env` file:
```env
FIGMA_API_KEY=your_figma_api_key_here
PORT=3333
OUTPUT_FORMAT=json
```

### **4. Start Servers**

**HTTP Server (Plugin Integration):**
```bash
npm run start:http
# ✅ Server: http://localhost:3333
# ✅ Plugin endpoints ready
# ⚠️  Dev Mode: EventSource error (expected in Node.js)
```

**MCP STDIO Server (AI Agent Integration):**
```bash
node .\dist\cli.js --figma-api-key=YOUR_KEY --stdio
# ✅ MCP protocol ready
# ⚠️  Dev Mode: EventSource error (expected in Node.js)
```

### **5. Install Figma Plugin**
1. Open Figma Desktop
2. Plugins → Development → Import plugin from manifest
3. Select `figma-plugin/manifest.json`
4. Plugin "Figma Context MCP" ready! 🎉

### **6. Configure AI Agent (Augment)**
```json
{
  "mcpServers": {
    "Framelink Figma MCP": {
      "command": "powershell",
      "args": [
        "-Command",
        "cd",
        "'C:\\Users\\username\\path\\to\\Figma-Context-MCP';",
        "node",
        ".\\dist\\cli.js",
        "--figma-api-key=YOUR_FIGMA_API_KEY",
        "--stdio"
      ]
    }
  }
}
```

## 🎯 **14 MCP Tools**

### **🎨 Plugin Integration (3 tools)**
| Tool | Purpose | Example |
|------|---------|---------|
| `get_figma_dev_code` | Latest extracted code | CSS, React, JSON, or both |
| `get_figma_dev_history` | Track design changes | Timeline of extractions |
| `generate_component_from_figma` | Custom components | Tailwind, styled-components, etc. |

### **💻 Code Generation (2 tools)**
| Tool | Purpose | Example |
|------|---------|---------|
| `get_All_Layers_CSS` | Comprehensive CSS | Pixel-perfect styling for all elements |
| `get_Basic_CSS` | Simple CSS | Clean container styles |

### **⚛️ React Development (1 tool)**
| Tool | Purpose | Example |
|------|---------|---------|
| `get_React` | React components | Full component hierarchy with JSX |

### **📊 Data & Analysis (2 tools)**
| Tool | Purpose | Example |
|------|---------|---------|
| `get_JSON` | Raw design data | Complete layout and styling info |
| `get_UI_Screenshots` | Structure analysis | Component metadata and dimensions |

### **🖼️ Asset Management (1 tool)**
| Tool | Purpose | Example |
|------|---------|---------|
| `download_figma_images` | Asset extraction | Batch PNG/SVG downloads |

### **🔗 Advanced Integration (3 tools)**
| Tool | Purpose | Example |
|------|---------|---------|
| `get_figma_dev_mode_code` | Official Dev Mode | React + Tailwind from Figma |
| `check_figma_dev_connection` | Health monitoring | Connection status |
| `get_figma_data` | Direct API access | Complete file structure |

### **🎨 Advanced Development (2 tools)**
| Tool | Purpose | Example |
|------|---------|---------|
| `generate_typescript_component` | Production TypeScript components | Components with tests, types, Storybook |
| `generate_project_structure` | Complete project scaffolding | Full project with config, tests, tooling |

## 🎮 **Usage Workflow**

### **Step 1: Extract with Plugin**
1. Open Figma, select any element
2. Run "Figma Context MCP" plugin
3. Click "Extract Dev Code"
4. ✅ Data instantly available via MCP tools

### **Step 2: Access via AI Agent**
```javascript
// Natural language to AI agent:
"Extract the button component and generate React code with Tailwind styling"

// AI agent uses MCP tools:
get_figma_dev_code({ format: "react" })
generate_component_from_figma({ styleType: "tailwind" })
```

### **Step 3: Get Production Code**
```css
/* Example CSS Output */
.button-primary {
  position: relative;
  width: 343px;
  height: 51px;
  background: #5db075;
  border-radius: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

```jsx
/* Example React Output */
const ButtonPrimary = () => {
  return (
    <div className="relative w-[343px] h-[51px] bg-green-500 rounded-full flex items-center justify-center">
      <span className="text-white font-inter">Get Started</span>
    </div>
  );
};
```

## 🔧 **Plugin Interface**

```
┌─────────────────────────────────┐
│     Figma Context MCP           │
├─────────────────────────────────┤
│  📊 Selection: Button/Primary   │
│  📐 Size: 343×51               │
│  🎨 Type: INSTANCE             │
├─────────────────────────────────┤
│  ☑ Include All Layers CSS       │
│  ☑ Generate React Component     │
│  ☑ Include Child Elements       │
├─────────────────────────────────┤
│  [🚀 Extract Dev Code]          │
├─────────────────────────────────┤
│  📡 Status: ✅ Connected        │
│  🔗 http://localhost:3333       │
└─────────────────────────────────┘
```

## 🔌 **API Endpoints**

### **Health Check**
```bash
curl http://localhost:3333/health
# {"status": "healthy", "uptime": 3600}
```

### **Plugin Data**
```bash
# Get latest extraction
curl http://localhost:3333/plugin/latest-dev-data

# Get extraction history
curl http://localhost:3333/plugin/dev-data-history?limit=5
```

### **Code Generation**
```bash
# Get comprehensive CSS
curl http://localhost:3333/plugin/all-layers-css?formatted=true

# Get React component
curl http://localhost:3333/plugin/react?includeCSS=true
```

## 🚨 **Troubleshooting**

### **"EventSource is not defined" Error**
```
✅ This is EXPECTED in Node.js environment
✅ Server still works perfectly
✅ Plugin integration works
✅ MCP tools work
❌ Only affects Figma Dev Mode bridge (browser-only feature)
```

### **Common Issues & Solutions**

#### **Plugin Not Loading**
```bash
# Check Figma Desktop is updated
# Restart Figma after plugin installation
# Verify manifest.json path is correct
```

#### **Server Connection Failed**
```bash
# Verify server is running
curl http://localhost:3333/health

# Check firewall settings
# Confirm port 3333 is available
```

#### **MCP Tools Not Working**
```bash
# Test STDIO mode
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node .\dist\cli.js --figma-api-key=YOUR_KEY --stdio

# Check Augment configuration
# Verify API key is correct
```

#### **No Data Extracted**
```bash
# Ensure element is selected in Figma
# Run plugin extraction first
# Check plugin shows "Connected" status
```

## 📊 **Server Status Indicators**

### **✅ Working Correctly**
```
[INFO] HTTP server listening on port 3333
[INFO] Plugin integration endpoints configured
[INFO] SSE endpoint available
[INFO] StreamableHTTP endpoint available
```

### **⚠️ Expected Warnings**
```
[INFO] Figma Dev Mode MCP Server not available: ReferenceError: EventSource is not defined
# This is normal in Node.js - server still works!
```

## 🎯 **Real-World Examples**

### **Extract Button Component**
```javascript
// 1. Select button in Figma
// 2. Run plugin
// 3. AI agent command:
"Get the button CSS and create a Tailwind version"

// Result:
get_All_Layers_CSS_Framelink_Figma_MCP({ formatted: true })
generate_component_from_figma_Framelink_Figma_MCP({ 
  styleType: "tailwind",
  componentName: "PrimaryButton" 
})
```

### **Download Assets**
```javascript
// Extract icons and images
download_figma_images_Framelink_Figma_MCP({
  fileKey: "W8A0ZKTPi04qt97CGuYIwA",
  nodes: [
    { nodeId: "197:259", fileName: "button-bg.png" },
    { nodeId: "197:260", fileName: "icon.svg" }
  ],
  localPath: "C:\\project\\assets"
})
```

### **Complete Component Analysis**
```javascript
// Get full component data
get_JSON_Framelink_Figma_MCP({ includeChildren: true, pretty: true })
get_UI_Screenshots_Framelink_Figma_MCP({ includeImageData: true })
get_React_Framelink_Figma_MCP({ includeCSS: true })
```

## 📁 **Project Structure**

```
figma-context-mcp/
├── 📂 src/                    # MCP Server source
│   ├── 📂 tools/              # 12 MCP tools
│   ├── 📂 figma-api/          # Figma API integration
│   └── 📂 plugin-integration/ # Plugin data handling
├── 📂 figma-plugin/           # Custom Figma plugin
├── 📂 dist/                   # Compiled server
├── 📂 documentation/          # This guide
├── 📄 .env                    # Configuration
└── 📄 package.json            # Dependencies
```

## ✅ **Verification Checklist**

- [ ] Node.js 18+ installed
- [ ] Figma API key obtained
- [ ] Repository cloned and built
- [ ] `.env` file configured
- [ ] HTTP server starts on port 3333
- [ ] STDIO server responds to MCP commands
- [ ] Figma plugin installed and shows "Connected"
- [ ] Augment MCP configuration added
- [ ] Test extraction works from plugin
- [ ] AI agent can access MCP tools

## 🚀 **Next Steps**

1. **Test the workflow** - Extract a simple component
2. **Try different tools** - Explore all 12 MCP tools
3. **Integrate with AI** - Use with Augment or other AI agents
4. **Build components** - Create your design system
5. **Automate workflows** - Set up batch processing

---

**🎯 Transform your Figma designs into production code with AI-powered precision!**

**Need help?** Check the individual documentation files for detailed guides on specific features.
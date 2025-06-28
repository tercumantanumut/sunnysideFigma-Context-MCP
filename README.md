# Sunnyside Figma MCP

What if you could talk to your Figma designs and turn them into production code? That's what we built.

## What This Does

This tool connects your Figma designs to AI agents, making it possible to extract real code, assets, and design systems just by describing what you want. Think of it as a bridge between design and development that actually works.

We're not trying to replace designers or developers. We're trying to make the handoff between them seamless.

## The Vision

Our dream is simple: select any Figma design, describe what you want, and get a complete, production-ready project. No more manual pixel-pushing, no more "this doesn't match the design" conversations.

We're getting close.

## Getting Started

You'll need Node.js 18+ and a Figma API key. That's it.

```bash
git clone https://github.com/tercumantanumut/sunnysideFigma-Context-MCP
cd sunnysideFigma-Context-MCP
npm install
```

Create a `.env` file:
```env
FIGMA_API_KEY=your_figma_api_key_here
```

Start everything:
```bash
npm run start
```

This starts both the plugin server and MCP integration. 

### Install the Figma Plugin

1. Open Figma Desktop
2. Plugins → Development → Import plugin from manifest
3. Select `figma-dev-plugin/manifest.json`
4. You're ready

## How It Works

1. **Design in Figma** - Just like you always do
2. **Select and describe** - Tell an AI agent what you want: "Turn this button into a React component"
3. **Get code** - Production-ready React, CSS, Tailwind, or Vue components
4. **Ship it** - The code actually works

You can also send Figma links directly to AI agents (use "Copy link to selection" in Figma).

## See It In Action

**"Build me a login form from this design"**
→ Gets complete React component with form validation, styled-components, and TypeScript types

**"Extract all design tokens from this page"**
→ Finds 47 color tokens, 12 spacing values, catches 3 conflicts, suggests naming fixes

**"Turn this card into a reusable component"**
→ Generates Vue component with props, variants, and proper responsive breakpoints

**"Download all icons as optimized SVGs"**
→ Batch downloads 15 icons, removes unnecessary code, saves 60% file size

**"Check if my button styles are consistent"**
→ Scans design system, finds 4 inconsistent button styles, shows exact pixel differences

**"Create a complete component library from this design system"**
→ Builds 20+ components with documentation, proper naming, and design token integration

## What Makes This Different

- **Real code extraction** - Not guesswork, actual CSS values from Figma
- **Design system aware** - Understands your tokens, catches conflicts, suggests fixes
- **Asset handling** - Downloads SVGs, PNGs, optimizes everything
- **Multiple formats** - React, Vue, CSS, Tailwind, styled-components
- **AI-first** - Built for natural language interaction

## Current Status

This is actively developed software. Things can break. We're pushing updates frequently because we're excited about where this is going.

**What's working great:**
- Code generation for React/CSS/Tailwind
- Design token extraction and conflict detection
- Asset downloading and optimization
- Plugin integration with all Figma editor types

**What we're fixing:**
- SVG/IMG previews in the plugin (they'll freeze Figma if you click them - agents can still download assets fine)

## Three Ways to Connect

1. **Figma Plugin** - Real-time extraction while you design
2. **Dev Mode Bridge** - Works with Figma's official dev features
3. **Direct API** - Programmatic access to everything

Pick what works for your workflow.

## Documentation

Everything you need is in the [docs folder](docs/). Start with [installation](docs/installation.md) if you want the full setup guide, or [examples](docs/examples/) to see what's possible.

## Contributing

We're building this in the open. If you see something that could be better, tell us or submit a PR.

## License & Attribution

This builds on concepts from the Framelink MCP project but is substantially different. It's proprietary software by Sunnyside Software with specific licensing terms - see [LICENSE](LICENSE) for details.

For commercial use, reach out to Umut TAN at tercumantanumut@gmail.com.

---

*Turning Figma designs into real code, one conversation at a time.*
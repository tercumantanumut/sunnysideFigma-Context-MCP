# Contributing to Figma Context MCP

We welcome contributions to the Figma Context MCP project! This guide will help you get started.

## Ways to Contribute

- **Bug Reports** - Report issues and bugs
- **Feature Requests** - Suggest new features and improvements
- **Code Contributions** - Submit pull requests with fixes and features
- **Documentation** - Improve documentation and examples
- **Testing** - Help test new features and report issues
- **Community Support** - Help other users in discussions

## Getting Started

### Prerequisites

- Node.js 18+
- Git
- Figma Desktop App
- Figma API Key

### Development Setup

1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/your-username/figma-context-mcp.git
   cd figma-context-mcp
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment**
   ```bash
   # Copy example environment file
   cp .env.example .env
   
   # Add your Figma API key
   echo "FIGMA_API_KEY=your_api_key_here" >> .env
   ```

4. **Build and Test**
   ```bash
   # Build the project
   npm run build
   
   # Run tests
   npm test
   
   # Start development server
   npm run dev
   ```

## Development Workflow

### Branch Naming

Use descriptive branch names:
- `feature/add-vue-component-generation`
- `fix/plugin-connection-timeout`
- `docs/update-installation-guide`
- `refactor/improve-token-extraction`

### Commit Messages

Follow conventional commit format:
```
type(scope): description

feat(tools): add Vue component generation
fix(plugin): resolve connection timeout issue
docs(readme): update installation instructions
refactor(tokens): improve extraction performance
```

Types:
- `feat` - New features
- `fix` - Bug fixes
- `docs` - Documentation changes
- `refactor` - Code refactoring
- `test` - Test additions/changes
- `chore` - Maintenance tasks

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Check code style
npm run lint

# Fix formatting issues
npm run lint:fix

# Format code
npm run format
```

### Testing

Write tests for new features:

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tools/code-generation.test.ts

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Contributing Guidelines

### Code Contributions

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write clean, well-documented code
   - Follow existing code patterns
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**
   ```bash
   npm run build
   npm test
   npm run lint
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat(scope): description of changes"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create pull request on GitHub
   ```

### Pull Request Process

1. **PR Title and Description**
   - Use clear, descriptive titles
   - Explain what changes were made and why
   - Reference related issues

2. **PR Checklist**
   - [ ] Code builds successfully
   - [ ] All tests pass
   - [ ] Code follows style guidelines
   - [ ] Documentation updated
   - [ ] Breaking changes documented

3. **Review Process**
   - Maintainers will review your PR
   - Address feedback and requested changes
   - PR will be merged once approved

### Documentation Contributions

Documentation improvements are always welcome:

1. **Types of Documentation**
   - API documentation
   - Usage examples
   - Tutorials and guides
   - Code comments

2. **Documentation Standards**
   - Use clear, concise language
   - Include practical examples
   - Keep formatting consistent
   - Test all code examples

### Bug Reports

When reporting bugs, please include:

1. **Bug Description**
   - Clear description of the issue
   - Expected vs actual behavior

2. **Reproduction Steps**
   - Step-by-step instructions
   - Minimal reproduction case
   - Sample code if applicable

3. **Environment Information**
   - Operating system and version
   - Node.js version
   - Figma version
   - Server configuration

4. **Additional Context**
   - Error messages and logs
   - Screenshots if relevant
   - Related issues or PRs

### Feature Requests

For feature requests, please provide:

1. **Feature Description**
   - Clear description of the feature
   - Use cases and benefits
   - Proposed implementation approach

2. **Examples**
   - Mock-ups or wireframes
   - Code examples
   - Similar features in other tools

3. **Priority and Impact**
   - How important is this feature?
   - Who would benefit from it?
   - Any workarounds currently used?

## Project Structure

Understanding the project structure helps with contributions:

```
figma-context-mcp/
├── src/
│   ├── tools/              # MCP tools implementation
│   ├── services/           # Core services
│   ├── transformers/       # Code transformers
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript types
├── figma-dev-plugin/       # Figma plugin source
├── docs/                   # Documentation
├── tests/                  # Test files
└── examples/               # Usage examples
```

### Key Areas for Contributions

1. **MCP Tools** (`src/tools/`)
   - Add new code generation tools
   - Improve existing tool functionality
   - Add support for new frameworks

2. **Design System Tools** (`src/tools/design-system-tracker.ts`)
   - Enhance token extraction
   - Improve impact analysis
   - Add new health checks

3. **Transformers** (`src/transformers/`)
   - Add new output formats
   - Improve code quality
   - Optimize performance

4. **Plugin** (`figma-dev-plugin/`)
   - Enhance UI/UX
   - Add new extraction features
   - Improve error handling

5. **Documentation** (`docs/`)
   - Add tutorials and examples
   - Improve existing guides
   - Fix typos and errors

## Code Review Guidelines

### For Contributors

- Keep PRs focused and small
- Write clear commit messages
- Add tests for new functionality
- Update documentation
- Respond to feedback promptly

### For Reviewers

- Be constructive and helpful
- Focus on code quality and maintainability
- Check for test coverage
- Verify documentation updates
- Test changes locally when possible

## Release Process

1. **Version Bumping**
   - Follow semantic versioning
   - Update CHANGELOG.md
   - Tag releases appropriately

2. **Release Notes**
   - Highlight new features
   - Document breaking changes
   - Include migration guides

## Community Guidelines

- Be respectful and inclusive
- Help others learn and grow
- Share knowledge and experiences
- Follow the code of conduct
- Participate in discussions constructively

## Getting Help

- **Documentation** - Check existing docs first
- **GitHub Issues** - Search existing issues
- **Discussions** - Ask questions in GitHub Discussions
- **Discord/Slack** - Join community channels (if available)

## Recognition

Contributors are recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation
- Community highlights

Thank you for contributing to Figma Context MCP!

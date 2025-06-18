/**
 * 🎨 PICASSO-LEVEL COMPONENT GENERATOR
 * Advanced component generation with multiple output formats
 */

import { TypeScriptGenerator, type FigmaNode, type ComponentGenerationOptions } from './typescript-generator.js';

export interface GeneratedComponent {
  name: string;
  files: {
    component: string;
    styles: string;
    types: string;
    index: string;
    test?: string;
    stories?: string;
  };
  metadata: {
    originalName: string;
    type: string;
    hasChildren: boolean;
    isInteractive: boolean;
    styleType: string;
  };
}

export interface ProjectStructure {
  components: GeneratedComponent[];
  structure: {
    [path: string]: string;
  };
  packageJson?: any;
  tsConfig?: any;
}

export class ComponentGenerator {
  private tsGenerator: TypeScriptGenerator;

  constructor(options: Partial<ComponentGenerationOptions> = {}) {
    this.tsGenerator = new TypeScriptGenerator(options);
  }

  /**
   * 🚀 MASTER GENERATOR: Generate complete component with all files
   */
  generateComponent(node: FigmaNode, options: Partial<ComponentGenerationOptions> = {}): GeneratedComponent {
    // Update generator options if provided
    if (Object.keys(options).length > 0) {
      this.tsGenerator = new TypeScriptGenerator(options);
    }

    const generated = this.tsGenerator.generateComponent(node);
    const componentName = this.sanitizeComponentName(node.name);

    return {
      name: componentName,
      files: {
        component: generated.component,
        styles: generated.styles,
        types: generated.types,
        index: generated.index,
        test: this.generateTestFile(node, componentName),
        stories: this.generateStorybookFile(node, componentName)
      },
      metadata: {
        originalName: node.name,
        type: node.type,
        hasChildren: Boolean(node.children && node.children.length > 0),
        isInteractive: this.isInteractiveElement(node),
        styleType: options.styleType || 'css-modules'
      }
    };
  }

  /**
   * 🏗️ PROJECT GENERATOR: Generate complete project structure
   */
  generateProject(nodes: FigmaNode[], options: Partial<ComponentGenerationOptions> = {}): ProjectStructure {
    const components = nodes.map(node => this.generateComponent(node, options));
    const structure = this.generateProjectStructure(components, options);

    return {
      components,
      structure,
      packageJson: this.generatePackageJson(options),
      tsConfig: this.generateTsConfig()
    };
  }

  /**
   * 🧹 SANITIZE: Component name sanitization
   */
  private sanitizeComponentName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
      .replace(/^[a-z]/, char => char.toUpperCase())
      .replace(/[^a-zA-Z0-9]/g, '')
      || 'Component';
  }

  /**
   * 🎯 INTERACTIVE CHECK: Determine if element is interactive
   */
  private isInteractiveElement(node: FigmaNode): boolean {
    const interactiveTypes = ['BUTTON', 'INSTANCE'];
    const interactiveNames = ['button', 'btn', 'link', 'clickable', 'input', 'form'];
    
    return interactiveTypes.includes(node.type) || 
           interactiveNames.some(name => node.name.toLowerCase().includes(name));
  }

  /**
   * 🧪 TEST FILE: Generate Jest test file
   */
  private generateTestFile(node: FigmaNode, componentName: string): string {
    return `import React from 'react';
import { render, screen } from '@testing-library/react';
import ${componentName} from './${componentName}';

describe('${componentName}', () => {
  it('renders without crashing', () => {
    render(<${componentName} />);
  });

  ${node.type === 'TEXT' ? `
  it('displays the correct text content', () => {
    const testText = 'Test content';
    render(<${componentName}>{testText}</${componentName}>);
    expect(screen.getByText(testText)).toBeInTheDocument();
  });` : ''}

  ${this.isInteractiveElement(node) ? `
  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<${componentName} onClick={handleClick} />);
    
    const element = screen.getByRole('${this.getAriaRole(node)}');
    element.click();
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });` : ''}

  it('applies custom className', () => {
    const customClass = 'custom-class';
    render(<${componentName} className={customClass} />);
    
    const element = screen.getByTestId('${componentName.toLowerCase()}');
    expect(element).toHaveClass(customClass);
  });

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'red' };
    render(<${componentName} style={customStyle} />);
    
    const element = screen.getByTestId('${componentName.toLowerCase()}');
    expect(element).toHaveStyle('background-color: red');
  });
});`;
  }

  /**
   * 📚 STORYBOOK: Generate Storybook stories
   */
  private generateStorybookFile(node: FigmaNode, componentName: string): string {
    const args = this.generateStorybookArgs(node);
    
    return `import type { Meta, StoryObj } from '@storybook/react';
import ${componentName} from './${componentName}';

const meta: Meta<typeof ${componentName}> = {
  title: 'Components/${componentName}',
  component: ${componentName},
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Generated from Figma design: ${node.name}'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    ${this.generateStorybookArgTypes(node)}
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    ${args}
  },
};

${node.type === 'TEXT' ? `
export const WithCustomText: Story = {
  args: {
    ...Default.args,
    children: 'Custom text content',
  },
};` : ''}

${this.isInteractiveElement(node) ? `
export const Interactive: Story = {
  args: {
    ...Default.args,
    onClick: () => alert('Clicked!'),
  },
};` : ''}

export const CustomStyling: Story = {
  args: {
    ...Default.args,
    style: {
      border: '2px solid #007bff',
      borderRadius: '8px',
      padding: '16px',
    },
  },
};`;
  }

  /**
   * 📝 STORYBOOK ARGS: Generate default args for Storybook
   */
  private generateStorybookArgs(node: FigmaNode): string {
    const args = [];

    if (node.type === 'TEXT' && node.characters) {
      args.push(`children: '${node.characters}'`);
    }

    return args.join(',\n    ');
  }

  /**
   * 🎛️ STORYBOOK ARG TYPES: Generate argTypes for Storybook controls
   */
  private generateStorybookArgTypes(node: FigmaNode): string {
    const argTypes = [];

    if (node.type === 'TEXT') {
      argTypes.push(`children: {
      control: 'text',
      description: 'Text content to display',
    }`);
    }

    if (this.isInteractiveElement(node)) {
      argTypes.push(`onClick: {
      action: 'clicked',
      description: 'Click event handler',
    }`);
    }

    argTypes.push(`className: {
      control: 'text',
      description: 'Additional CSS classes',
    }`);

    argTypes.push(`style: {
      control: 'object',
      description: 'Inline styles',
    }`);

    return argTypes.join(',\n    ');
  }

  /**
   * 🎭 ARIA ROLE: Get appropriate ARIA role for element
   */
  private getAriaRole(node: FigmaNode): string {
    if (node.type === 'TEXT') return 'text';
    if (this.isInteractiveElement(node)) return 'button';
    return 'generic';
  }

  /**
   * 🏗️ PROJECT STRUCTURE: Generate complete project file structure
   */
  private generateProjectStructure(components: GeneratedComponent[], options: Partial<ComponentGenerationOptions>): { [path: string]: string } {
    const structure: { [path: string]: string } = {};

    // Generate component files
    components.forEach(component => {
      const basePath = `src/components/${component.name}`;
      
      structure[`${basePath}/${component.name}.tsx`] = component.files.component;
      structure[`${basePath}/index.ts`] = component.files.index;

      if (component.files.types) {
        structure[`${basePath}/${component.name}.types.ts`] = component.files.types;
      }

      if (component.files.styles) {
        const styleExt = options.styleType === 'css-modules' ? 'module.css' : 'ts';
        structure[`${basePath}/${component.name}.${styleExt}`] = component.files.styles;
      }

      if (component.files.test) {
        structure[`${basePath}/${component.name}.test.tsx`] = component.files.test;
      }

      if (component.files.stories) {
        structure[`${basePath}/${component.name}.stories.tsx`] = component.files.stories;
      }
    });

    // Generate barrel exports
    structure['src/components/index.ts'] = this.generateBarrelExports(components);

    // Generate global types
    structure['src/types/index.ts'] = this.generateGlobalTypes();

    // Generate utility files
    structure['src/utils/index.ts'] = this.generateUtilities();

    return structure;
  }

  /**
   * 📦 BARREL EXPORTS: Generate index file with all component exports
   */
  private generateBarrelExports(components: GeneratedComponent[]): string {
    return components
      .map(component => `export { default as ${component.name} } from './${component.name}';`)
      .join('\n');
  }

  /**
   * 🏷️ GLOBAL TYPES: Generate global TypeScript types
   */
  private generateGlobalTypes(): string {
    return `// Global types for Figma-generated components

export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
}

export interface InteractiveProps {
  onClick?: () => void;
  onHover?: () => void;
  disabled?: boolean;
}

export interface TextProps {
  children?: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
}

export type ComponentVariant = 'primary' | 'secondary' | 'tertiary';
export type ComponentSize = 'small' | 'medium' | 'large';`;
  }

  /**
   * 🛠️ UTILITIES: Generate utility functions
   */
  private generateUtilities(): string {
    return `// Utility functions for Figma-generated components

export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const mergeStyles = (
  baseStyles: React.CSSProperties,
  customStyles?: React.CSSProperties
): React.CSSProperties => {
  return { ...baseStyles, ...customStyles };
};

export const generateTestId = (componentName: string, suffix?: string): string => {
  return suffix ? \`\${componentName.toLowerCase()}-\${suffix}\` : componentName.toLowerCase();
};`;
  }

  /**
   * 📦 PACKAGE.JSON: Generate package.json for the project
   */
  private generatePackageJson(options: Partial<ComponentGenerationOptions>): any {
    const dependencies: Record<string, string> = {
      'react': '^18.0.0',
      'react-dom': '^18.0.0'
    };

    const devDependencies: Record<string, string> = {
      '@types/react': '^18.0.0',
      '@types/react-dom': '^18.0.0',
      'typescript': '^5.0.0',
      '@testing-library/react': '^13.0.0',
      '@testing-library/jest-dom': '^5.0.0',
      'jest': '^29.0.0'
    };

    if (options.styleType === 'styled-components') {
      dependencies['styled-components'] = '^5.3.0';
      devDependencies['@types/styled-components'] = '^5.1.0';
    }

    return {
      name: 'figma-generated-components',
      version: '1.0.0',
      description: 'Components generated from Figma designs',
      main: 'dist/index.js',
      types: 'dist/index.d.ts',
      scripts: {
        build: 'tsc',
        test: 'jest',
        'test:watch': 'jest --watch',
        storybook: 'storybook dev -p 6006',
        'build-storybook': 'storybook build'
      },
      dependencies,
      devDependencies,
      peerDependencies: {
        react: '>=16.8.0',
        'react-dom': '>=16.8.0'
      }
    };
  }

  /**
   * ⚙️ TSCONFIG: Generate TypeScript configuration
   */
  private generateTsConfig(): any {
    return {
      compilerOptions: {
        target: 'ES2020',
        lib: ['DOM', 'DOM.Iterable', 'ES6'],
        allowJs: true,
        skipLibCheck: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
        forceConsistentCasingInFileNames: true,
        moduleResolution: 'node',
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: false,
        declaration: true,
        outDir: 'dist',
        jsx: 'react-jsx'
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist', '**/*.test.*', '**/*.stories.*']
    };
  }
}

/**
 * Simple TypeScript Generator - Clean, focused component generation
 * No Jest/Storybook bloat, just clean TypeScript React components
 */

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  css?: string;
  allLayersCSS?: string;
  characters?: string;
  children?: FigmaNode[];
}

export interface ComponentGenerationOptions {
  styleType: 'css-modules' | 'styled-components' | 'tailwind' | 'inline';
  componentFormat: 'functional' | 'arrow';
  includeTypes: boolean;
  includeChildren: boolean;
}

export class TypeScriptGenerator {
  private options: ComponentGenerationOptions;

  constructor(options: Partial<ComponentGenerationOptions> = {}) {
    this.options = {
      styleType: 'css-modules',
      componentFormat: 'functional',
      includeTypes: true,
      includeChildren: true,
      ...options
    };
  }

  generateComponent(node: FigmaNode): { component: string; styles?: string; types?: string } {
    const componentName = this.sanitizeComponentName(node.name);
    
    const component = this.generateComponentFile(node, componentName);
    const styles = this.generateStylesFile(node, componentName);
    const types = this.options.includeTypes ? this.generateTypesFile(componentName) : undefined;

    return { component, styles, types };
  }

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

  private generateComponentFile(node: FigmaNode, componentName: string): string {
    const imports = this.generateImports(componentName);
    const propsInterface = this.generatePropsInterface(componentName);
    const componentBody = this.generateComponentBody(node, componentName);

    return `${imports}

${propsInterface}

${componentBody}

export default ${componentName};`;
  }

  private generateImports(componentName: string): string {
    const imports = ["import React from 'react';"];
    
    if (this.options.styleType === 'css-modules') {
      imports.push(`import styles from './${componentName}.module.css';`);
    } else if (this.options.styleType === 'styled-components') {
      imports.push("import styled from 'styled-components';");
    }

    return imports.join('\n');
  }

  private generatePropsInterface(componentName: string): string {
    if (!this.options.includeTypes) return '';

    return `interface ${componentName}Props {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}`;
  }

  private generateComponentBody(node: FigmaNode, componentName: string): string {
    const propsParam = this.options.includeTypes ? `{ className, style, children }: ${componentName}Props` : 'props';
    const jsx = this.generateJSX(node, componentName);

    if (this.options.componentFormat === 'arrow') {
      return `const ${componentName} = (${propsParam}) => {
  return (
${jsx}
  );
};`;
    } else {
      return `const ${componentName}: React.FC<${this.options.includeTypes ? `${componentName}Props` : 'any'}> = (${propsParam}) => {
  return (
${jsx}
  );
};`;
    }
  }

  private generateJSX(node: FigmaNode, componentName: string): string {
    const className = this.generateClassName(componentName);
    const content = this.generateContent(node);

    return `    <div${className}${this.options.includeTypes ? ' style={style}' : ''}>
${content}
    </div>`;
  }

  private generateClassName(componentName: string): string {
    if (this.options.styleType === 'css-modules') {
      return ` className={\`\${styles.${componentName.toLowerCase()}} \${className || ''}\`}`;
    } else if (this.options.styleType === 'tailwind') {
      return ' className={className}';
    } else {
      return ' className={className}';
    }
  }

  private generateContent(node: FigmaNode): string {
    if (node.type === 'TEXT' && node.characters) {
      return `      {children || '${node.characters}'}`;
    }
    
    if (this.options.includeChildren && node.children && node.children.length > 0) {
      return '      {children}';
    }
    
    return '      {children}';
  }

  private generateStylesFile(node: FigmaNode, componentName: string): string | undefined {
    if (this.options.styleType === 'css-modules') {
      return `.${componentName.toLowerCase()} {
  ${node.css || '/* Add styles here */'}
}`;
    } else if (this.options.styleType === 'styled-components') {
      return `import styled from 'styled-components';

export const Styled${componentName} = styled.div\`
  ${node.css || '/* Add styles here */'}
\`;`;
    }
    
    return undefined;
  }

  private generateTypesFile(componentName: string): string {
    return `export interface ${componentName}Props {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}`;
  }
}
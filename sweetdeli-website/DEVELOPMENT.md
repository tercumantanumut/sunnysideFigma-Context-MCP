# Development Guide

## 🚀 Quick Start

### Automated Setup
Run the setup script for your platform:

**macOS/Linux:**
```bash
./scripts/setup.sh
```

**Windows:**
```cmd
scripts\setup.bat
```

### Manual Setup
1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env.local
```

3. Start development server:
```bash
npm run dev
```

## 📁 Project Structure

```
sweetdeli-website/
├── public/
│   └── images/              # Downloaded Figma assets
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── globals.css      # Global styles & design system
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Home page
│   │   └── demo/
│   │       └── page.tsx     # Demo page
│   └── components/
│       ├── ProfileSettings/ # Main profile components
│       ├── Button/          # Reusable button component
│       └── Icons/           # SVG icon components
├── scripts/                 # Setup and utility scripts
└── docs/                    # Additional documentation
```

## 🎨 Design System

### Colors
```css
--color-primary: #23262F;      /* Dark text/UI */
--color-secondary: #777E90;    /* Muted text */
--color-background: #FCFCFD;   /* Main background */
--color-border: #E6E8EC;       /* Dividers */
--color-border-light: #F4F5F6; /* Subtle borders */
```

### Typography
- **Headings**: DM Sans (700 weight)
- **Body**: Poppins (400, 600 weights)
- **UI Elements**: DM Sans (700 weight)

### Spacing Scale
```css
--spacing-xs: 4px;    --spacing-lg: 32px;
--spacing-sm: 8px;    --spacing-xl: 48px;
--spacing-md: 16px;   --spacing-2xl: 64px;
```

## 🧩 Component Architecture

### ProfileSettings
Main container component that orchestrates the layout.

### Sidebar
Navigation component with menu items and active states.

### LoginSecurity
Content area with login, social accounts, and device history sections.

### Button
Reusable button component with variants (primary, outline) and sizes.

### Icons
SVG icon components using actual Figma assets.

## 📱 Responsive Design

### Breakpoints
- **Desktop**: 1200px+
- **Tablet**: 768px - 1199px  
- **Mobile**: < 768px

### Responsive Strategy
- CSS Grid and Flexbox for layouts
- CSS custom properties for consistent spacing
- Mobile-first approach with progressive enhancement

## 🔧 Development Workflow

### Adding New Components
1. Create component directory in `src/components/`
2. Add TypeScript interface for props
3. Create CSS module for styles
4. Export from index file
5. Add to Storybook (if applicable)

### Styling Guidelines
- Use CSS Modules for component styles
- Follow BEM naming convention
- Use design system variables
- Ensure responsive design
- Test across browsers

### Code Quality
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Semantic HTML for accessibility

## 🧪 Testing

### Manual Testing Checklist
- [ ] Responsive design on all breakpoints
- [ ] Interactive elements (buttons, hover states)
- [ ] Typography and spacing consistency
- [ ] Cross-browser compatibility
- [ ] Accessibility (keyboard navigation, screen readers)

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🚀 Deployment

### Build Process
```bash
npm run build    # Creates optimized production build
npm run start    # Serves production build locally
```

### Deployment Platforms
- **Vercel**: Automatic deployment from Git
- **Netlify**: Static site hosting
- **AWS S3**: Static website hosting
- **GitHub Pages**: Free hosting for public repos

### Environment Variables
Copy `.env.example` to `.env.local` and configure:
- `NEXT_PUBLIC_APP_URL`: Your domain URL
- Add API keys and other secrets as needed

## 📊 Performance

### Optimization Features
- Next.js Image optimization
- CSS Modules for efficient styling
- Tree shaking for smaller bundles
- Static generation where possible

### Performance Metrics
- Lighthouse score: 95+ (aim)
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1

## 🐛 Troubleshooting

### Common Issues

**Build Errors:**
- Check TypeScript errors: `npm run type-check`
- Verify all imports are correct
- Ensure all required dependencies are installed

**Styling Issues:**
- Check CSS Module imports
- Verify design system variables
- Test responsive breakpoints

**Performance Issues:**
- Optimize images and assets
- Check bundle size: `npm run analyze`
- Review component re-renders

### Getting Help
1. Check the console for errors
2. Review the component documentation
3. Test in different browsers
4. Check responsive design
5. Validate HTML and accessibility

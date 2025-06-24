# Sweetdeli Website - Profile Settings

A modern, responsive profile settings page built from Figma design using Next.js, React, and TypeScript.

## 🎨 Design Source

This website was created from the Figma design: [Sweetdeli - 40+ screens Website Wireframe Kit](https://www.figma.com/design/rEOjYEdgIt4fZMulSMgybi/Sweetdeli---40--screens-Website-Wireframe-Kit--Mobile---Desktop---Free---Community-)

## ✨ Features

- **Responsive Design**: Fully responsive layout that works on desktop, tablet, and mobile
- **Modern UI**: Clean, professional interface following the original Figma design
- **TypeScript**: Full type safety throughout the application
- **CSS Modules**: Scoped styling with CSS modules for better maintainability
- **Accessibility**: Built with accessibility best practices
- **Performance**: Optimized for fast loading and smooth interactions

## 🏗️ Architecture

### Components Structure

```
src/
├── app/
│   ├── globals.css          # Global styles and design system
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Main page component
├── components/
│   ├── ProfileSettings/     # Main profile settings components
│   │   ├── ProfileSettings.tsx
│   │   ├── ProfileSettings.module.css
│   │   ├── Sidebar.tsx
│   │   ├── Sidebar.module.css
│   │   ├── LoginSecurity.tsx
│   │   ├── LoginSecurity.module.css
│   │   └── index.tsx
│   ├── Button/              # Reusable button component
│   │   ├── index.tsx
│   │   └── Button.module.css
│   └── Icons/               # SVG icon components
│       └── index.tsx
```

### Key Features Implemented

1. **Profile Settings Sidebar**
   - Personal info
   - Login and security (active)
   - My payments
   - My voucher
   - My points
   - My orders

2. **Login & Security Section**
   - Password management
   - Social account connections (Facebook, Apple)
   - Device history tracking
   - Interactive buttons for all actions

3. **Design System**
   - Consistent color palette
   - Typography scale (DM Sans, Poppins)
   - Spacing system
   - Component variants

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sweetdeli-website
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## 🎯 Design System

### Colors
- **Primary**: #23262F (Dark text/UI elements)
- **Secondary**: #777E90 (Muted text)
- **Background**: #FCFCFD (Main background)
- **Border**: #E6E8EC (Dividers and borders)
- **Border Light**: #F4F5F6 (Subtle borders)

### Typography
- **Headings**: DM Sans (700 weight)
- **Body Text**: Poppins (400, 600 weights)
- **UI Elements**: DM Sans (700 weight)

### Spacing Scale
- XS: 4px
- SM: 8px  
- MD: 16px
- LG: 32px
- XL: 48px
- 2XL: 64px
- 3XL: 80px
- 4XL: 128px
- 5XL: 160px

## 📱 Responsive Breakpoints

- **Desktop**: 1200px+
- **Tablet**: 768px - 1199px
- **Mobile**: < 768px

## 🔧 Customization

### Adding New Sections

1. Create a new component in `src/components/ProfileSettings/`
2. Add the component to the main `ProfileSettings.tsx`
3. Update the sidebar navigation if needed

### Styling

The project uses CSS Modules for component-scoped styling. Global styles and design system variables are defined in `src/app/globals.css`.

### Icons

Custom SVG icons are defined in `src/components/Icons/index.tsx`. Add new icons following the same pattern.

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For questions or support, please open an issue in the repository.

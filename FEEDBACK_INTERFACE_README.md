# Accessible AI Feedback Interface

## Overview
An accessible AI feedback interface demonstrating inclusive design principles with a toggle between default and accessible modes.

## Features

### 🎨 Two Display Modes

#### **Default Mode**
- Modern, clean design with comfortable reading experience
- Standard text sizes and spacing
- Subtle color gradients and shadows
- Optimized for general use

#### **Accessible Mode**
- **High Contrast**: Black background with yellow text for maximum readability
- **Larger Text**: 33% larger font sizes throughout
- **Dyslexia-Friendly Font**: OpenDyslexic font with unique letter shapes
- **Enhanced Spacing**: Increased line height and padding
- **Bold Borders**: Thick yellow borders for clear visual boundaries

### 📊 Colorblind-Safe Visualization
- Bar chart using **blue and orange** color scheme
- Accessible for all types of color vision deficiency (protanopia, deuteranopia, tritanopia)
- Avoids problematic red/green combinations
- Clear labels and percentage values

### ♿ Accessibility Features
- ARIA labels and roles for screen readers
- Keyboard-navigable toggle button
- Smooth transitions between modes
- Semantic HTML structure
- Progress bars with proper ARIA attributes

## Usage

### Running the Interface
```bash
npm run dev
```

Then navigate to: **http://localhost:3000/feedback-demo**

### Toggle Between Modes
Click the button in the top-right corner to switch between:
- 👁️ **Accessible Mode** (when in default)
- 👁️‍🗨️ **Default Mode** (when in accessible)

## Technical Implementation

### Component Location
- **Component**: `/src/components/AccessibleFeedback.tsx`
- **Page Route**: `/src/app/feedback-demo/page.tsx`

### Key Technologies
- **Next.js 15** with React 19
- **Tailwind CSS** for responsive styling
- **Lucide React** for icons
- **OpenDyslexic Font** via CDN

### Accessibility Standards
- WCAG 2.1 Level AA compliant
- High contrast ratios (21:1 in accessible mode)
- Colorblind-safe color palette
- Screen reader compatible

## Design Decisions

### Color Choices
- **Blue (#0066CC)** and **Orange (#FF8800)** in accessible mode
- Safe for all color vision types
- High contrast against backgrounds

### Font Selection
- **OpenDyslexic**: Specially designed for dyslexia with:
  - Weighted bottoms on letters
  - Unique letter shapes to prevent confusion
  - Increased spacing between characters

### Layout
- Centered card design for focus
- Maximum width of 3xl (48rem) for comfortable reading
- Responsive padding and spacing
- Clear visual hierarchy

## Use Cases

1. **Educational Platforms**: Providing feedback on assignments
2. **Accessibility Testing**: Demonstrating inclusive design
3. **User Preference Settings**: Showing mode comparison
4. **Training Material**: Teaching accessibility best practices

## Future Enhancements

- [ ] Save user preference to localStorage
- [ ] Add more font options (Comic Sans, Arial)
- [ ] Implement text-to-speech
- [ ] Add keyboard shortcuts
- [ ] Support for reduced motion preferences
- [ ] Additional language support

## Resources

- [OpenDyslexic Font](https://opendyslexic.org/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Colorblind-Safe Palettes](https://davidmathlogic.com/colorblind/)
- [Web Accessibility Initiative](https://www.w3.org/WAI/)

---

**Built with accessibility in mind** ♿💙

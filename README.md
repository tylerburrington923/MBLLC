# Moravian Builders LLC - Building Estimator Platform

A modern, interactive web-based building configuration and pricing estimator for Moravian Builders LLC. This platform allows customers to visualize custom metal building designs in real-time and receive instant price quotes.

## 🎯 Features

### Core Functionality
- **Interactive 2D Viewer**: Real-time SVG-based building visualization
- **Configuration Configurator**: Adjust dimensions, colors, and features instantly
- **Dynamic Pricing Engine**: Real-time price calculation with quantity discounts
- **Opening Management**: Add/remove/position doors and windows on building faces
- **Image Gallery**: Showcase project examples with modal lightbox viewer
- **Lead Capture Form**: Collect customer contact information and save configurations
- **State Persistence**: Automatic localStorage saving of configurations and form data

### Customization Options
- **Building Dimensions**: Width, Length, Height, Overhang
- **Roof Pitches**: Support for 2:12 through 12:12 pitches
- **Color Selection**: Choose roof, wall, trim, and wainscot colors
- **Feature Toggles**: Add wainscot siding and interior finishes
- **Opening Types**: Overhead doors, bifold doors, sliders, walk-in doors, windows
- **Multi-Face Support**: View and configure front, rear, left, and right faces

## 📁 Project Structure

```
MBLLC/
├── index.html           # Main HTML entry point
├── css/
│   ├── normalize.css    # CSS reset and baseline
│   ├── variables.css    # Design tokens and CSS variables
│   ├── layout.css       # Page structure and grid layout
│   ├── components.css   # UI component styles
│   ├── viewer.css       # SVG canvas and visualization styles
│   ├── responsive.css   # Mobile and responsive breakpoints
│   └── theme.css        # Color scheme and typography
├── js/
│   ├── app.js           # Master bootstrapper and entrypoint
│   ├── state.js         # Centralized state management
│   ├── constants.js     # Immutable configuration lookup tables
│   ├── controls.js      # Input handlers and UI controllers
│   ├── viewer.js        # SVG rendering engine
│   ├── pricing.js       # Price calculation logic
│   ├── gallery.js       # Image carousel and modal
│   └── form.js          # Lead capture and validation
├── assets/
│   └── images/          # Gallery and UI images
├── README.md            # This file
└── .gitignore           # Git configuration

```

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No build tools or dependencies required
- Vanilla JavaScript ES6+ with native modules

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/tylerburrington923/MBLLC.git
   cd MBLLC
   ```

2. **Open locally**
   - Simple option: Double-click `index.html` in file explorer
   - Better option: Use a local development server
     ```bash
     # Using Python 3
     python -m http.server 8000
     
     # Using Node.js (requires http-server)
     npx http-server
     ```

3. **Access the application**
   - Open browser to `http://localhost:8000`
   - Start building and configuring!

## 📖 Usage Guide

### Configuring a Building

1. **Set Dimensions**
   - Adjust Width, Length, Height using input controls
   - Select roof pitch from dropdown
   - Values update in real-time viewer

2. **Choose Colors**
   - Click color swatches to select roof, walls, trim colors
   - Enable wainscot to add horizontal siding stripe
   - Select interior finish color if desired

3. **Add Openings (Doors & Windows)**
   - Click opening type buttons (Overhead Door, Bifold, etc.)
   - Opening appears on current viewing face
   - Click on opening to select and drag to reposition
   - Click and hold handles to resize (when implemented)

4. **Switch Viewing Faces**
   - Click face tabs (Front, Rear, Left, Right) to change view
   - Each face can have different openings
   - Price updates automatically

5. **Submit Inquiry**
   - Scroll to lead form
   - Enter contact information
   - Click "Get Quote" to submit configuration
   - Confirmation appears with saved data

### Price Calculation

The pricing engine considers:
- **Base Price**: Fixed minimum ($2,500)
- **Building Envelope**: $3.50 per square foot
- **Roof Pitch**: Multiplier increases with steeper pitches
- **Openings**: Individual pricing based on type and size
- **Wainscot**: $2.50 per linear foot
- **Interior Finish**: $0.75 per square foot
- **Quantity Discounts**: 2% per opening (max 10% discount)

**Formula:**
```
Total = Base + (Width × Length × $/sqft) × PitchMultiplier + OpeningsPrice + WainscotPrice + InteriorPrice - Discount
```

## 🎨 Design System

### Color Palette
- **Roof Colors**: Charcoal, Slate Gray, Dark Gray, Weathered Gray, Deep Black
- **Wall Colors**: Slate, Light Gray, Beige, Off-White, Tan, Rust
- **Trim Colors**: White, Off-White, Black, Gray
- **Wainscot Colors**: Charcoal, Dark Gray, Medium Gray, Light Gray, Wood Stain
- **Interior Colors**: White, Cream, Light Gray, Pale Yellow

### Typography
- **Headings**: Modern sans-serif (system font stack)
- **Body**: Readable sans-serif with 16px base size
- **Code**: Monospace for technical elements

### Spacing
- Base unit: 8px (adjustable via CSS variables)
- Consistent rhythm: 8, 16, 24, 32, 40, 48px

## 🔧 Technical Architecture

### Module System
The application uses ES6 modules for clean code organization:

- **app.js**: Orchestrates initialization and lifecycle
- **state.js**: Single source of truth for all data
- **constants.js**: Immutable lookup tables and config
- **controls.js**: Event handlers and input validation
- **viewer.js**: SVG rendering and canvas interaction
- **pricing.js**: Business logic for price calculation
- **gallery.js**: Image carousel and modal management
- **form.js**: Form validation and lead submission

### State Management
- Centralized reactive state with custom events
- localStorage persistence for browser sessions
- Import/export functionality for configurations
- Immutable updates with change notification

### Event System
- Custom `app:state-change` events for reactivity
- Debounced input handlers for performance
- Event delegation for gallery and form interactions

## 📱 Responsive Design

The platform is optimized for:
- **Desktop**: Full feature set with optimal layout
- **Tablet**: Adjusted dimensions and touch-friendly controls
- **Mobile**: Simplified layout with priority features

CSS breakpoints:
- Small (Mobile): < 768px
- Medium (Tablet): 768px - 1024px
- Large (Desktop): > 1024px

## 🔐 Data & Privacy

- **No server required** for basic functionality
- Configurations stored locally in browser localStorage
- Form submissions handled via CORS-enabled API endpoint
- No tracking, no third-party analytics

### API Integration
The form submission expects an endpoint at `/api/leads` that accepts:
```json
{
  "lead": { "fullname", "email", "phone", "city", "state", "specialRequests" },
  "configuration": { "building": {...}, "lead": {...} },
  "pricing": { "total", "breakdown": {...}, "building": {...} },
  "timestamp": "ISO 8601 date"
}
```

## 🛠️ Customization Guide

### Adding New Opening Types
1. Edit `constants.js` → `openingTypes` object
2. Add new type with default dimensions and pricing
3. Update opening type icons/labels in UI

### Modifying Pricing Formula
1. Edit `pricing.js` → `calculate()` method
2. Adjust multipliers in `constants.js` → `pricing.features`
3. Test calculations with sample configurations

### Adding Color Options
1. Edit `constants.js` → `colors` palettes
2. Colors automatically populate in UI swatches
3. Update `controls.js` if adding new color groups

### Extending Features
1. Add new state properties in `state.js`
2. Create new control handlers in `controls.js`
3. Update viewer rendering in `viewer.js`
4. Add pricing logic in `pricing.js`

## 📋 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ✅ Fully Supported |
| Firefox | Latest | ✅ Fully Supported |
| Safari | Latest | ✅ Fully Supported |
| Edge | Latest | ✅ Fully Supported |
| IE 11 | - | ❌ Not Supported |

## 🐛 Troubleshooting

### SVG Canvas Not Rendering
- Check browser console for JavaScript errors
- Verify HTML has `#viewer-canvas` element
- Clear browser cache and reload

### Price Not Updating
- Ensure state changes dispatch custom events
- Check pricing.js `calculate()` is being called
- Verify constants.js values are correct

### Form Not Submitting
- Check API endpoint URL in constants.js
- Verify form field names match state properties
- Check browser console for network errors
- Ensure CORS headers are set on backend

### localStorage Errors
- Check if localStorage is disabled in browser
- Verify not in private/incognito mode
- Clear site data and try again

## 📚 Development Notes

### Code Style
- ES6+ syntax with strict mode
- Descriptive function and variable names
- JSDoc comments for all public methods
- Single responsibility principle for modules

### Performance
- Debounced render updates (300ms)
- Event delegation for DOM performance
- Minimal reflows using SVG viewport transforms
- Lazy initialization of components

### Testing
- Test each module independently
- Verify state changes trigger updates
- Check price calculations with known values
- Test on different screen sizes

## 🚢 Deployment

### Static Hosting
Since this is a client-side application, it can be deployed to any static host:

- **GitHub Pages**: Push to `gh-pages` branch
- **Netlify**: Connect repository, auto-deploys
- **Vercel**: Zero-config deployment
- **AWS S3 + CloudFront**: Scalable CDN solution
- **Traditional Web Server**: Copy files to public directory

### Backend Requirements
If deploying with backend:
- Setup `/api/leads` endpoint for form submissions
- Enable CORS for cross-origin requests
- Store lead data in database
- Send confirmation emails (optional)

## 📄 License

This project is proprietary to Moravian Builders LLC. Unauthorized copying or distribution is prohibited.

## 👥 Contact

**Moravian Builders LLC**
- Website: [moravianbuilders.com](https://moravianbuilders.com)
- Email: info@moravianbuilders.com
- Phone: [Contact Number]

---

**Last Updated**: July 5, 2026
**Version**: 1.0.0
**Status**: Production Ready ✅

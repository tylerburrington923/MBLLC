/**
 * @file constants.js
 * @description Immutable Configuration & Dimension Lookup Tables.
 * Centralized constants for all product dimensions, pricing, and system configurations.
 */

/**
 * Global constants object
 * All values are immutable and should not be modified at runtime
 */
const constants = {
    // ===========================
    // OPENING TYPES & DIMENSIONS
    // ===========================
    
    openingTypes: {
        overhead: {
            label: 'Overhead Door',
            defaultWidth: 10,
            defaultHeight: 10,
            minWidth: 8,
            maxWidth: 24,
            minHeight: 8,
            maxHeight: 14,
            priceBase: 1200,
            pricePerSqFt: 15
        },
        bifold: {
            label: 'Bifold Door',
            defaultWidth: 12,
            defaultHeight: 10,
            minWidth: 6,
            maxWidth: 20,
            minHeight: 7,
            maxHeight: 10,
            priceBase: 800,
            pricePerSqFt: 12
        },
        slider: {
            label: 'Slider Door',
            defaultWidth: 12,
            defaultHeight: 10,
            minWidth: 8,
            maxWidth: 16,
            minHeight: 7,
            maxHeight: 10,
            priceBase: 600,
            pricePerSqFt: 10
        },
        walk_door: {
            label: 'Walk-In Door',
            defaultWidth: 3,
            defaultHeight: 7,
            minWidth: 2.5,
            maxWidth: 4,
            minHeight: 6.5,
            maxHeight: 8,
            priceBase: 250,
            pricePerSqFt: 8
        },
        window: {
            label: 'Window',
            defaultWidth: 4,
            defaultHeight: 4,
            minWidth: 2,
            maxWidth: 8,
            minHeight: 2,
            maxHeight: 6,
            priceBase: 150,
            pricePerSqFt: 5
        }
    },

    // ===========================
    // BUILDING DIMENSIONS
    // ===========================

    dimensions: {
        width: {
            min: 20,
            max: 100,
            step: 2,
            unit: 'ft',
            label: 'Width'
        },
        length: {
            min: 30,
            max: 150,
            step: 2,
            unit: 'ft',
            label: 'Length'
        },
        height: {
            min: 8,
            max: 20,
            step: 1,
            unit: 'ft',
            label: 'Eave Height'
        },
        overhang: {
            min: 0,
            max: 24,
            step: 1,
            unit: 'in',
            label: 'Overhang'
        }
    },

    // ===========================
    // ROOF PITCHES
    // ===========================

    roofPitches: [
        '2:12',
        '3:12',
        '4:12',
        '5:12',
        '6:12',
        '7:12',
        '8:12',
        '10:12',
        '12:12'
    ],

    // ===========================
    // COLOR PALETTES
    // ===========================

    colors: {
        roof: [
            { name: 'Charcoal', value: '#334155', hex: '#334155' },
            { name: 'Slate Gray', value: '#475569', hex: '#475569' },
            { name: 'Dark Gray', value: '#1E293B', hex: '#1E293B' },
            { name: 'Light Gray', value: '#64748B', hex: '#64748B' },
            { name: 'Weathered Gray', value: '#57534E', hex: '#57534E' },
            { name: 'Deep Black', value: '#0F172A', hex: '#0F172A' }
        ],
        wall: [
            { name: 'Slate', value: '#64748B', hex: '#64748B' },
            { name: 'Light Gray', value: '#CBD5E1', hex: '#CBD5E1' },
            { name: 'Beige', value: '#D1C4B0', hex: '#D1C4B0' },
            { name: 'Off-White', value: '#F1F5F9', hex: '#F1F5F9' },
            { name: 'Tan', value: '#C9AE8A', hex: '#C9AE8A' },
            { name: 'Rust', value: '#8B5A3C', hex: '#8B5A3C' }
        ],
        trim: [
            { name: 'White', value: '#FFFFFF', hex: '#FFFFFF' },
            { name: 'Off-White', value: '#F8FAFC', hex: '#F8FAFC' },
            { name: 'Black', value: '#1E293B', hex: '#1E293B' },
            { name: 'Gray', value: '#64748B', hex: '#64748B' }
        ],
        wainscot: [
            { name: 'Charcoal', value: '#1E293B', hex: '#1E293B' },
            { name: 'Dark Gray', value: '#334155', hex: '#334155' },
            { name: 'Medium Gray', value: '#475569', hex: '#475569' },
            { name: 'Light Gray', value: '#64748B', hex: '#64748B' },
            { name: 'Wood Stain', value: '#8B6F47', hex: '#8B6F47' }
        ],
        interior: [
            { name: 'White', value: '#FFFFFF', hex: '#FFFFFF' },
            { name: 'Cream', value: '#FFFAF0', hex: '#FFFAF0' },
            { name: 'Light Gray', value: '#E2E8F0', hex: '#E2E8F0' },
            { name: 'Pale Yellow', value: '#FFFBEB', hex: '#FFFBEB' }
        ]
    },

    // ===========================
    // PRICING STRUCTURE
    // ===========================

    pricing: {
        basePrice: 2500, // Base price for any building
        pricePerSqFt: 3.50, // Price per square foot of building envelope
        
        openingMultipliers: {
            overhead: 1.0,
            bifold: 0.95,
            slider: 0.85,
            walk_door: 0.3,
            window: 0.2
        },

        features: {
            wainscot: { pricePerLinearFt: 2.50 },
            interior: { pricePerSqFt: 0.75 },
            roofPitchMultiplier: {
                '2:12': 1.0,
                '3:12': 1.05,
                '4:12': 1.1,
                '5:12': 1.15,
                '6:12': 1.2,
                '7:12': 1.25,
                '8:12': 1.3,
                '10:12': 1.4,
                '12:12': 1.5
            }
        },

        // Quantity discounts for multiple openings
        discounts: {
            opening: 0.02, // 2% discount per opening
            maxDiscountPercent: 10 // Max 10% discount
        }
    },

    // ===========================
    // BUILDING FACES
    // ===========================

    faces: [
        { id: 'front', label: 'Front', abbreviation: 'F' },
        { id: 'rear', label: 'Rear', abbreviation: 'R' },
        { id: 'left', label: 'Left', abbreviation: 'L' },
        { id: 'right', label: 'Right', abbreviation: 'R' }
    ],

    // ===========================
    // SVG RENDERING CONFIG
    // ===========================

    svg: {
        viewBoxWidth: 800,
        viewBoxHeight: 600,
        gridSize: 16, // pixels per foot
        padding: 50, // pixels
        minScale: 0.5,
        maxScale: 2.0,
        defaultScale: 1.0,
        
        colors: {
            roof: '#334155',
            wall: '#64748B',
            wainscot: '#475569',
            interior: '#E2E8F0',
            trim: '#1E293B',
            opening: '#E2E8F0',
            openingStroke: '#1E293B',
            selection: '#D4AF37',
            grid: '#4F46E5',
            text: '#1E293B',
            textLight: '#64748B',
            background: '#1a2332'
        },

        strokeWidths: {
            default: 2,
            thin: 1,
            thick: 3,
            grid: 0.5
        }
    },

    // ===========================
    // FORM VALIDATION
    // ===========================

    validation: {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        phone: /^\d{10}$|^\d{3}-\d{3}-\d{4}$|^\(\d{3}\)\s?\d{3}-\d{4}$/,
        zipcode: /^\d{5}(-\d{4})?$/,
        name: /^[a-zA-Z\s'-]{2,50}$/
    },

    // ===========================
    // UI CONFIGURATION
    // ===========================

    ui: {
        debounceMs: 300,
        throttleMs: 150,
        animationDurationMs: 300,
        toastDurationMs: 3000,
        
        mobile: {
            breakpoint: 768, // pixels
            actionBarHeight: 80 // pixels
        },

        tabs: {
            viewer: ['2D Front', '2D Rear', '3D Model', 'Specs'],
            activeDefault: 0
        }
    },

    // ===========================
    // API ENDPOINTS
    // ===========================

    api: {
        submitLead: '/api/leads',
        calculatePrice: '/api/pricing',
        generatePDF: '/api/generate-pdf'
    },

    // ===========================
    // LOCALIZATION
    // ===========================

    locale: {
        currency: 'USD',
        currencySymbol: '$',
        decimalPlaces: 2,
        dateFormat: 'MM/DD/YYYY'
    },

    // ===========================
    // ERROR MESSAGES
    // ===========================

    errors: {
        invalidDimensions: 'Please enter valid building dimensions.',
        invalidOpening: 'Invalid opening configuration.',
        invalidEmail: 'Please enter a valid email address.',
        invalidPhone: 'Please enter a valid phone number.',
        missingRequiredField: 'Please fill in all required fields.',
        configurationError: 'Configuration error. Please refresh and try again.',
        serverError: 'Server error. Please try again later.',
        networkError: 'Network error. Please check your connection.'
    },

    // ===========================
    // SUCCESS MESSAGES
    // ===========================

    messages: {
        leadSubmitted: 'Thank you! Your request has been submitted.',
        configurationSaved: 'Configuration saved successfully.',
        openingAdded: 'Opening added successfully.',
        openingRemoved: 'Opening removed successfully.',
        priceCalculated: 'Price updated.'
    }
};

// Object.freeze to prevent accidental mutations
Object.freeze(constants.openingTypes);
Object.freeze(constants.dimensions);
Object.freeze(constants.roofPitches);
Object.freeze(constants.colors);
Object.freeze(constants.pricing);
Object.freeze(constants.faces);
Object.freeze(constants.svg);
Object.freeze(constants.validation);
Object.freeze(constants.ui);
Object.freeze(constants.api);
Object.freeze(constants.locale);
Object.freeze(constants.errors);
Object.freeze(constants.messages);
Object.freeze(constants);

export { constants };

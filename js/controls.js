/**
 * @file controls.js
 * @description Input Handlers & Configuration Controllers.
 * Manages all user interactions with configurator controls and dimension inputs.
 * PATCH 3: Fixed opening injection - uses normalized coordinates system
 */

import { state } from './state.js';
import { constants } from './constants.js';
import { pricing } from './pricing.js';
import { viewer } from './viewer.js';

/**
 * Controls module
 * Orchestrates all user input handling and configuration updates
 */
const controls = {
    /**
     * Initialize all control event listeners
     */
    init() {
        this.initDimensionControls();
        this.initColorControls();
        this.initFeatureToggles();
        this.initOpeningInjectors();
        this.initWallSwitching();
        this.initStateListeners();
        console.log('✓ Controls initialized');
    },

    /**
     * Initialize dimension input controls (width, length, height, etc.)
     */
    initDimensionControls() {
        const dimensionMap = {
            'param-width': 'width',
            'param-length': 'length',
            'param-height': 'height',
            'param-overhang': 'overhang'
        };

        Object.entries(dimensionMap).forEach(([elemId, dimKey]) => {
            const input = document.getElementById(elemId);
            if (input) {
                input.addEventListener('change', (e) => {
                    this.handleDimensionChange(dimKey, e.target.value);
                });
                input.addEventListener('input', (e) => {
                    this.handleDimensionChange(dimKey, e.target.value);
                });
            }
        });

        // Set initial values
        this.syncDimensionsToUI();
    },

    /**
     * Sync dimension values from state to UI
     */
    syncDimensionsToUI() {
        const { width, length, height } = state.building.dimensions || state.getDefaults().dimensions;
        const overhang = state.building.overhang;

        const inputs = {
            'param-width': width,
            'param-length': length,
            'param-height': height,
            'param-overhang': overhang
        };

        Object.entries(inputs).forEach(([elemId, value]) => {
            const input = document.getElementById(elemId);
            if (input) input.value = value;
        });
    },

    /**
     * Handle dimension input changes
     * CRITICAL: Updates nested dimensions object
     * @param {string} dimension - Dimension name (width, length, height, overhang)
     * @param {*} value - New value
     */
    handleDimensionChange(dimension, value) {
        const numValue = parseFloat(value);
        
        if (isNaN(numValue)) return;

        if (['width', 'length', 'height'].includes(dimension)) {
            // Update nested dimensions object
            const currentDims = state.building.dimensions || {};
            state.setBuilding('dimensions', {
                ...currentDims,
                [dimension]: numValue
            });
        } else if (dimension === 'overhang') {
            state.setBuilding('overhang', numValue);
        }

        pricing.calculate();
        viewer.renderPipeline();
    },

    /**
     * Initialize color swatch controls
     */
    initColorControls() {
        const colorGroups = [
            { id: 'swatches-roof', stateKey: 'roofColor', palette: 'roof' },
            { id: 'swatches-wall', stateKey: 'wallColor', palette: 'wall' },
            { id: 'swatches-trim', stateKey: 'trimColor', palette: 'trim' },
            { id: 'swatches-wainscot', stateKey: 'wainscotColor', palette: 'wainscot' },
            { id: 'swatches-interior', stateKey: 'interiorColor', palette: 'interior' }
        ];

        colorGroups.forEach(group => {
            const container = document.getElementById(group.id);
            if (container) {
                const palette = constants.colors[group.palette];
                if (palette) {
                    palette.forEach(color => {
                        const btn = document.createElement('button');
                        btn.className = 'swatch-btn';
                        btn.style.backgroundColor = color.value;
                        btn.title = color.name;
                        btn.setAttribute('data-color', color.value);
                        
                        if (state.getBuilding(group.stateKey) === color.value) {
                            btn.classList.add('active');
                        }

                        btn.addEventListener('click', (e) => {
                            e.preventDefault();
                            this.handleColorChange(group.stateKey, color.value, container);
                            pricing.calculate();
                            viewer.renderPipeline();
                        });

                        container.appendChild(btn);
                    });
                }
            }
        });
    },

    /**
     * Handle color swatch selection
     * @param {string} stateKey - State property to update
     * @param {string} colorValue - Color hex value
     * @param {HTMLElement} container - Swatch container element
     */
    handleColorChange(stateKey, colorValue, container) {
        container.querySelectorAll('.swatch-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeBtn = container.querySelector(`[data-color="${colorValue}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        state.setBuilding(stateKey, colorValue);
    },

    /**
     * Initialize feature toggle buttons (wainscot, interior)
     */
    initFeatureToggles() {
        // Wainscot toggle
        const wainscotToggle = document.getElementById('toggle-wainscot');
        if (wainscotToggle) {
            const buttons = wainscotToggle.querySelectorAll('.btn-toggle');
            buttons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const enabled = btn.dataset.value === 'true';
                    this.setToggleActive(wainscotToggle, enabled);
                    state.setBuilding('wainscotEnabled', enabled);
                    
                    const colorContainer = document.getElementById('wainscot-color-container');
                    if (colorContainer) {
                        colorContainer.classList.toggle('hidden', !enabled);
                    }
                    
                    pricing.calculate();
                    viewer.renderPipeline();
                });
            });

            const enabled = state.getBuilding('wainscotEnabled');
            const initialBtn = wainscotToggle.querySelector(`[data-value="${enabled}"]`);
            if (initialBtn) {
                this.setToggleActive(wainscotToggle, enabled);
            }
        }

        // Interior toggle
        const interiorToggle = document.getElementById('toggle-interior');
        if (interiorToggle) {
            const buttons = interiorToggle.querySelectorAll('.btn-toggle');
            buttons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const enabled = btn.dataset.value === 'true';
                    this.setToggleActive(interiorToggle, enabled);
                    state.setBuilding('interiorEnabled', enabled);
                    
                    const colorContainer = document.getElementById('interior-color-container');
                    if (colorContainer) {
                        colorContainer.classList.toggle('hidden', !enabled);
                    }
                    
                    pricing.calculate();
                    viewer.renderPipeline();
                });
            });

            const enabled = state.getBuilding('interiorEnabled');
            const initialBtn = interiorToggle.querySelector(`[data-value="${enabled}"]`);
            if (initialBtn) {
                this.setToggleActive(interiorToggle, enabled);
            }
        }
    },

    /**
     * Set toggle button active state
     * @param {HTMLElement} container - Toggle container
     * @param {boolean} enabled - Whether to enable
     */
    setToggleActive(container, enabled) {
        container.querySelectorAll('.btn-toggle').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = container.querySelector(`[data-value="${enabled}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    },

    /**
     * Initialize opening injection buttons (add doors/windows)
     * CRITICAL FIX: Now properly binds to btn-inject buttons in HTML
     */
    initOpeningInjectors() {
        const injectorButtons = document.querySelectorAll('.btn-inject');
        injectorButtons.forEach(btn => {
            const openingType = btn.dataset.type;
            if (openingType) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.injectNewOpening(openingType);
                });
            }
        });
    },

    /**
     * Inject new opening on current wall
     * CRITICAL FIX: Uses normalized 0-1 coordinate system
     * @param {string} openingType - Type of opening ('overhead', 'bifold', 'slider', 'walk_door', 'window')
     */
    injectNewOpening(openingType) {
        // CRITICAL: Opening created with normalized coordinates
        const newOpening = {
            type: openingType,
            face: state.currentFace,
            
            // Normalized coordinates (0-1 scale)
            x: 0.35,      // 35% from left edge
            y: 0.25,      // 25% from top edge
            width: 0.20,  // 20% of wall width
            height: 0.30  // 30% of wall height
        };

        const openingId = state.addOpening(newOpening);
        state.selectOpening(openingId);
        
        pricing.calculate();
        viewer.renderPipeline();
        
        console.log(`✓ Added ${openingType} to ${state.currentFace} face at normalized coords (${newOpening.x}, ${newOpening.y})`);
    },

    /**
     * Initialize wall/face tab switching
     * CRITICAL: Connects tab buttons to wall projection engine
     */
    initWallSwitching() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const face = btn.dataset.face;
                if (face) {
                    // Update active tab UI
                    tabButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    // Update state and trigger render
                    state.setCurrentFace(face);
                    viewer.renderPipeline();
                    
                    // Update viewer title
                    const titleMap = {
                        'front': 'Front Wall Elevation View',
                        'rear': 'Rear Wall Elevation View',
                        'left': 'Left Side Elevation View',
                        'right': 'Right Side Elevation View'
                    };
                    const titleEl = document.getElementById('viewer-title');
                    if (titleEl) titleEl.textContent = titleMap[face] || 'Elevation View';
                }
            });
        });

        // Set initial active tab
        const frontTab = document.querySelector('[data-face="front"]');
        if (frontTab) frontTab.classList.add('active');
    },

    /**
     * Initialize global state change listener
     */
    initStateListeners() {
        document.addEventListener('app:state-change', (e) => {
            const { category, path } = e.detail;

            if (category === 'building') {
                this.syncDimensionsToUI();
            } else if (category === 'ui') {
                if (path === 'selectedOpening') {
                    viewer.renderPipeline();
                } else if (path === 'currentFace') {
                    viewer.renderPipeline();
                }
            }
        });
    },

    /**
     * Sync all UI inputs to current state
     * Called after state is restored or changed externally
     */
    syncUIToState() {
        this.syncDimensionsToUI();

        const colorGroups = [
            { id: 'swatches-roof', stateKey: 'roofColor' },
            { id: 'swatches-wall', stateKey: 'wallColor' },
            { id: 'swatches-trim', stateKey: 'trimColor' },
            { id: 'swatches-wainscot', stateKey: 'wainscotColor' },
            { id: 'swatches-interior', stateKey: 'interiorColor' }
        ];

        colorGroups.forEach(group => {
            const container = document.getElementById(group.id);
            if (container) {
                const currentColor = state.getBuilding(group.stateKey);
                container.querySelectorAll('.swatch-btn').forEach(btn => {
                    if (btn.getAttribute('data-color') === currentColor) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
            }
        });
    }
};

export { controls };

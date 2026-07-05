/**
 * @file controls.js
 * @description Input Handlers & Configuration Controllers.
 * Manages all user interactions with configurator controls and dimension inputs.
 * PHASE 1-2: Wall unification + opening injection with unified schema
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

        this.syncDimensionsToUI();
    },

    /**
     * Sync dimension values from state to UI
     */
    syncDimensionsToUI() {
        const dims = state.building.dimensions || state.getDefaults().dimensions;
        const overhang = state.building.overhang;

        const inputs = {
            'param-width': dims.width,
            'param-length': dims.length,
            'param-height': dims.height,
            'param-overhang': overhang
        };

        Object.entries(inputs).forEach(([elemId, value]) => {
            const input = document.getElementById(elemId);
            if (input) input.value = value;
        });
    },

    /**
     * Handle dimension input changes
     * @param {string} dimension - Dimension name (width, length, height, overhang)
     * @param {*} value - New value
     */
    handleDimensionChange(dimension, value) {
        const numValue = parseFloat(value);
        
        if (isNaN(numValue)) return;

        if (['width', 'length', 'height'].includes(dimension)) {
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
     * PHASE 2: Bind to existing btn-inject buttons in HTML
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
     * PHASE 2: Unified schema with activeWall
     * @param {string} openingType - Type of opening ('overhead', 'bifold', 'slider', 'walk_door', 'window')
     */
    injectNewOpening(openingType) {
        const activeWall = state.getActiveWall();

        const newOpening = {
            type: openingType,
            face: activeWall,
            
            // Normalized coordinates (0-1 scale)
            x: 0.35,
            y: 0.25,
            width: openingType === 'window' ? 0.12 : 0.20,
            height: openingType === 'walk_door' ? 0.35 : 0.25
        };

        const openingId = state.addOpening(newOpening);
        state.selectOpening(openingId);
        
        pricing.calculate();
        viewer.renderPipeline();
        
        console.log(`✓ Injected ${openingType} to ${activeWall} at (${newOpening.x}, ${newOpening.y})`);
    },

    /**
     * Initialize wall/face tab switching
     * PHASE 1: Unified wall system using state.activeWall
     */
    initWallSwitching() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const face = btn.dataset.face;
                
                if (face) {
                    // Update UI
                    tabButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    // Update state (deselect opening when switching walls)
                    state.setActiveWall(face);
                    
                    // Update title
                    const titleMap = {
                        'front': 'Front Wall Elevation View',
                        'rear': 'Rear Wall Elevation View',
                        'left': 'Left Side Elevation View',
                        'right': 'Right Side Elevation View'
                    };
                    
                    const titleEl = document.getElementById('viewer-title');
                    if (titleEl) titleEl.textContent = titleMap[face];
                    
                    // Render
                    viewer.renderPipeline();
                }
            });
        });

        // Set initial active tab to match state
        const activeWall = state.getActiveWall();
        const activeTab = document.querySelector(`[data-face="${activeWall}"]`);
        if (activeTab) activeTab.classList.add('active');
    },

    /**
     * Initialize global state change listener
     */
    initStateListeners() {
        document.addEventListener('app:state-change', (e) => {
            const { category, action } = e.detail;

            if (category === 'building') {
                this.syncDimensionsToUI();
            } else if (category === 'ui') {
                if (action === 'selectedOpening') {
                    viewer.renderPipeline();
                } else if (action === 'activeWall') {
                    viewer.renderPipeline();
                }
            } else if (category === 'openings') {
                // Re-render on any opening change
                viewer.renderPipeline();
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

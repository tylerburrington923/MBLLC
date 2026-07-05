/**
 * @file controls.js
 * @description Input Handlers & Configuration Controllers.
 * Manages all user interactions with configurator controls and dimension inputs.
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
        this.initStateListeners();
        console.log('Controls initialized');
    },

    /**
     * Initialize dimension input controls (width, length, height, etc.)
     */
    initDimensionControls() {
        const dimensions = ['width', 'length', 'height', 'overhang', 'roofPitch'];
        
        dimensions.forEach(dim => {
            const input = document.getElementById(`building-${dim}`);
            if (input) {
                input.addEventListener('change', (e) => {
                    this.handleDimensionChange(dim, e.target.value);
                });
                input.addEventListener('input', (e) => {
                    this.handleDimensionChange(dim, e.target.value);
                });
            }
        });
    },

    /**
     * Handle dimension input changes
     * @param {string} dimension - Dimension name
     * @param {*} value - New value
     */
    handleDimensionChange(dimension, value) {
        // Validate dimension value
        if (dimension === 'roofPitch') {
            if (constants.roofPitches.includes(value)) {
                state.setBuilding(dimension, value);
                pricing.calculate();
                viewer.renderPipeline();
            }
        } else {
            const config = constants.dimensions[dimension];
            if (config) {
                const numValue = parseFloat(value);
                if (!isNaN(numValue) && numValue >= config.min && numValue <= config.max) {
                    state.setBuilding(dimension, numValue);
                    pricing.calculate();
                    viewer.renderPipeline();
                }
            }
        }
    },

    /**
     * Initialize color swatch controls
     */
    initColorControls() {
        const colorGroups = [
            { id: 'roof-color', stateKey: 'roofColor', palette: 'roof' },
            { id: 'wall-color', stateKey: 'wallColor', palette: 'wall' },
            { id: 'trim-color', stateKey: 'trimColor', palette: 'trim' },
            { id: 'wainscot-color', stateKey: 'wainscotColor', palette: 'wainscot' },
            { id: 'interior-color', stateKey: 'interiorColor', palette: 'interior' }
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
        // Remove active class from all swatches
        container.querySelectorAll('.swatch-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to clicked swatch
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
        const wainscotToggle = document.getElementById('wainscot-enable-toggle');
        if (wainscotToggle) {
            const buttons = wainscotToggle.querySelectorAll('.btn-toggle');
            buttons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const enabled = btn.dataset.value === 'true';
                    this.setToggleActive(wainscotToggle, enabled);
                    state.setBuilding('wainscotEnabled', enabled);
                    
                    // Show/hide wainscot color container
                    const colorContainer = document.getElementById('wainscot-color-container');
                    if (colorContainer) {
                        if (enabled) {
                            colorContainer.classList.remove('hidden');
                        } else {
                            colorContainer.classList.add('hidden');
                        }
                    }
                    
                    pricing.calculate();
                    viewer.renderPipeline();
                });
            });

            // Set initial state
            const enabled = state.getBuilding('wainscotEnabled');
            const initialBtn = wainscotToggle.querySelector(`[data-value="${enabled}"]`);
            if (initialBtn) {
                this.setToggleActive(wainscotToggle, enabled);
            }
        }

        // Interior toggle
        const interiorToggle = document.getElementById('interior-enable-toggle');
        if (interiorToggle) {
            const buttons = interiorToggle.querySelectorAll('.btn-toggle');
            buttons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const enabled = btn.dataset.value === 'true';
                    this.setToggleActive(interiorToggle, enabled);
                    state.setBuilding('interiorEnabled', enabled);
                    
                    // Show/hide interior color container
                    const colorContainer = document.getElementById('interior-color-container');
                    if (colorContainer) {
                        if (enabled) {
                            colorContainer.classList.remove('hidden');
                        } else {
                            colorContainer.classList.add('hidden');
                        }
                    }
                    
                    pricing.calculate();
                    viewer.renderPipeline();
                });
            });

            // Set initial state
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
     */
    initOpeningInjectors() {
        const injectorGrid = document.getElementById('injector-grid');
        if (injectorGrid) {
            Object.entries(constants.openingTypes).forEach(([typeKey, typeConfig]) => {
                const btn = document.createElement('button');
                btn.className = 'btn-inject';
                btn.innerHTML = `
                    <strong>${typeConfig.label}</strong>
                    <small>${typeConfig.defaultWidth}' × ${typeConfig.defaultHeight}'</small>
                `;
                
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.addOpening(typeKey);
                });

                injectorGrid.appendChild(btn);
            });
        }
    },

    /**
     * Add opening to current face
     * @param {string} openingType - Type of opening to add
     */
    addOpening(openingType) {
        const typeConfig = constants.openingTypes[openingType];
        if (typeConfig) {
            const newOpening = {
                type: openingType,
                face: state.currentFace,
                x: 100,
                y: 50,
                width: typeConfig.defaultWidth,
                height: typeConfig.defaultHeight
            };

            state.addOpening(newOpening);
            pricing.calculate();
            viewer.renderPipeline();
            
            console.log(`Added ${openingType} to ${state.currentFace} face`);
        }
    },

    /**
     * Initialize global state change listener
     */
    initStateListeners() {
        document.addEventListener('app:state-change', (e) => {
            const { category, path } = e.detail;

            // Update UI when state changes
            if (category === 'building') {
                this.syncUIToState();
            } else if (category === 'ui') {
                if (path === 'selectedOpening') {
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
        // Update dimension inputs
        const dimensions = ['width', 'length', 'height', 'overhang', 'roofPitch'];
        dimensions.forEach(dim => {
            const input = document.getElementById(`building-${dim}`);
            if (input) {
                input.value = state.getBuilding(dim);
            }
        });

        // Update color swatches
        const colorGroups = [
            { id: 'roof-color', stateKey: 'roofColor' },
            { id: 'wall-color', stateKey: 'wallColor' },
            { id: 'trim-color', stateKey: 'trimColor' },
            { id: 'wainscot-color', stateKey: 'wainscotColor' },
            { id: 'interior-color', stateKey: 'interiorColor' }
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

/**
 * @file state.js
 * @description Single Source of Truth State Management Container Layer.
 * Centralized reactive state store for all application data mutations and queries.
 * GLOBAL FIX: Wall unification + opening position updates + proper storage
 */

import { constants } from './constants.js';

/**
 * Reactive State Manager
 * Maintains immutable state and dispatches change events
 */
const state = {
    // Default building configuration template
    building: {},
    
    // Lead form contact information
    lead: {},

    /**
     * Initialize state with default configuration parameters
     * Called once on application bootstrap
     */
    init() {
        this.building = this.getDefaults();
        this.lead = this.getLeadDefaults();
        this.loadFromStorage();
        console.log('✓ State initialized with defaults');
    },

    /**
     * Get default building configuration object
     * CRITICAL: Unified wall system + drag state
     * @returns {Object} Default configuration template
     */
    getDefaults() {
        return {
            // Dimensions
            dimensions: {
                width: 40,
                length: 60,
                height: 14
            },
            roofPitch: '4:12',
            overhang: 12,

            // Exterior finishes
            roofColor: '#334155',
            wallColor: '#64748B',
            trimColor: '#1E293B',
            wainscotEnabled: false,
            wainscotColor: '#475569',

            // Interior
            interiorEnabled: false,
            interiorColor: '#E2E8F0',

            // Openings array - normalized coordinates
            openings: [],

            // GLOBAL FIX: Unified wall tracking
            activeWall: 'front',

            // Drag system state
            selectedOpeningId: null
        };
    },

    /**
     * Get default lead contact information
     * @returns {Object} Default lead template
     */
    getLeadDefaults() {
        return {
            fullname: '',
            email: '',
            phone: '',
            city: '',
            state: '',
            specialRequests: ''
        };
    },

    /**
     * Set active wall for viewing
     * PHASE 1: Unified wall system
     * @param {string} wall - Wall name (front, rear, left, right)
     */
    setActiveWall(wall) {
        if (this.building.activeWall !== wall) {
            this.building.activeWall = wall;
            this.building.selectedOpeningId = null; // deselect when switching
            this.dispatchChange('ui', 'activeWall', wall);
            this.saveToStorage();
        }
    },

    /**
     * Get active wall
     * @returns {string} Current active wall
     */
    getActiveWall() {
        return this.building.activeWall || 'front';
    },

    /**
     * Select opening for editing
     * @param {string|null} openingId - ID of opening or null
     */
    selectOpening(openingId) {
        if (this.building.selectedOpeningId !== openingId) {
            this.building.selectedOpeningId = openingId;
            this.dispatchChange('ui', 'selectedOpening', openingId);
        }
    },

    /**
     * Update building state property
     * Triggers custom event for reactive UI updates
     * @param {string} key - State key to update
     * @param {*} value - New value
     */
    setBuilding(key, value) {
        if (this.building[key] !== value) {
            this.building[key] = value;
            this.dispatchChange('building', key, value);
            this.saveToStorage();
        }
    },

    /**
     * Batch update multiple building properties
     * Single storage write and change event
     * @param {Object} updates - Key-value pairs to update
     */
    setBuildingBatch(updates) {
        let hasChanges = false;
        for (const [key, value] of Object.entries(updates)) {
            if (this.building[key] !== value) {
                this.building[key] = value;
                hasChanges = true;
            }
        }
        if (hasChanges) {
            this.dispatchChange('building', 'batch', updates);
            this.saveToStorage();
        }
    },

    /**
     * Get building state property
     * @param {string} key - Property key
     * @returns {*} Property value
     */
    getBuilding(key) {
        return this.building[key];
    },

    /**
     * Update lead contact information
     * @param {string} key - Lead property key
     * @param {*} value - New value
     */
    setLead(key, value) {
        if (this.lead[key] !== value) {
            this.lead[key] = value;
            this.dispatchChange('lead', key, value);
        }
    },

    /**
     * Batch update lead properties
     * @param {Object} updates - Key-value pairs to update
     */
    setLeadBatch(updates) {
        let hasChanges = false;
        for (const [key, value] of Object.entries(updates)) {
            if (this.lead[key] !== value) {
                this.lead[key] = value;
                hasChanges = true;
            }
        }
        if (hasChanges) {
            this.dispatchChange('lead', 'batch', updates);
        }
    },

    /**
     * Get lead property
     * @param {string} key - Property key
     * @returns {*} Property value
     */
    getLead(key) {
        return this.lead[key];
    },

    /**
     * Add opening (door/window) to building
     * PHASE 2: Unified schema with activeWall
     * @param {Object} opening - Opening configuration object
     * @returns {string} Unique opening ID
     */
    addOpening(opening) {
        const id = `opening-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const fullOpening = {
            id,
            type: opening.type,
            face: opening.face || this.building.activeWall || 'front',
            
            // Normalized coordinates (0-1 scale)
            x: opening.x !== undefined ? opening.x : 0.4,
            y: opening.y !== undefined ? opening.y : 0.3,
            width: opening.width !== undefined ? opening.width : 0.20,
            height: opening.height !== undefined ? opening.height : 0.25,
            
            createdAt: Date.now(),
            ...opening
        };
        
        if (!Array.isArray(this.building.openings)) {
            this.building.openings = [];
        }
        
        this.building.openings.push(fullOpening);
        this.dispatchChange('openings', 'add', fullOpening);
        this.saveToStorage();
        return id;
    },

    /**
     * Remove opening by ID
     * @param {string} openingId - ID of opening to remove
     */
    removeOpening(openingId) {
        const index = this.building.openings.findIndex(o => o.id === openingId);
        if (index !== -1) {
            const removed = this.building.openings.splice(index, 1)[0];
            this.dispatchChange('openings', 'remove', removed);
            this.saveToStorage();
        }
    },

    /**
     * Update opening position
     * PHASE 5: Used by drag system
     * @param {string} openingId - ID of opening
     * @param {number} x - Normalized X (0-1)
     * @param {number} y - Normalized Y (0-1)
     */
    updateOpeningPosition(openingId, x, y) {
        const opening = this.building.openings.find(o => o.id === openingId);
        if (opening) {
            opening.x = Math.max(0, Math.min(1, x));
            opening.y = Math.max(0, Math.min(1, y));
            this.dispatchChange('openings', 'move', opening);
            this.saveToStorage();
        }
    },

    /**
     * Update opening dimensions
     * @param {string} openingId - ID of opening
     * @param {number} width - New width (0-1)
     * @param {number} height - New height (0-1)
     */
    updateOpeningDimensions(openingId, width, height) {
        const opening = this.building.openings.find(o => o.id === openingId);
        if (opening) {
            opening.width = Math.max(0.05, Math.min(1, width));
            opening.height = Math.max(0.05, Math.min(1, height));
            this.dispatchChange('openings', 'resize', opening);
            this.saveToStorage();
        }
    },

    /**
     * Get opening by ID
     * @param {string} openingId - ID of opening
     * @returns {Object|null} Opening object or null
     */
    getOpening(openingId) {
        return this.building.openings.find(o => o.id === openingId) || null;
    },

    /**
     * Get all openings on current face
     * PHASE 4: Safe filtering
     * @param {string} face - Face to filter by
     * @returns {Array} Openings array
     */
    getOpeningsByFace(face) {
        return (this.building.openings || []).filter(o => o.face === face);
    },

    /**
     * Dispatch custom change event for reactivity
     * @param {string} category - Category of change
     * @param {string} action - Action performed
     * @param {*} payload - Change payload
     */
    dispatchChange(category, action, payload) {
        const event = new CustomEvent('app:state-change', {
            detail: { category, action, payload, timestamp: Date.now() }
        });
        document.dispatchEvent(event);
    },

    /**
     * Save state to browser localStorage for persistence
     */
    saveToStorage() {
        try {
            const stateSnapshot = {
                building: this.building,
                lead: this.lead,
                timestamp: Date.now()
            };
            localStorage.setItem('moravian_estimator_state', JSON.stringify(stateSnapshot));
        } catch (error) {
            console.warn('Failed to save state to localStorage:', error);
        }
    },

    /**
     * Load state from browser localStorage
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('moravian_estimator_state');
            if (stored) {
                const stateSnapshot = JSON.parse(stored);
                const ageMs = Date.now() - stateSnapshot.timestamp;
                const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
                
                if (ageMs < sevenDaysMs) {
                    this.building = { ...this.getDefaults(), ...stateSnapshot.building };
                    this.lead = { ...this.getLeadDefaults(), ...stateSnapshot.lead };
                    console.log('✓ State restored from localStorage');
                } else {
                    this.clearStorage();
                }
            }
        } catch (error) {
            console.warn('Failed to load state from localStorage:', error);
            this.clearStorage();
        }
    },

    /**
     * Clear all saved state from localStorage
     */
    clearStorage() {
        try {
            localStorage.removeItem('moravian_estimator_state');
        } catch (error) {
            console.warn('Failed to clear localStorage:', error);
        }
    },

    /**
     * Reset all state to defaults
     */
    reset() {
        this.building = this.getDefaults();
        this.lead = this.getLeadDefaults();
        this.clearStorage();
        this.dispatchChange('app', 'reset', null);
    },

    /**
     * Export current configuration as JSON
     * @returns {Object} Configuration object
     */
    export() {
        return {
            version: '1.0',
            timestamp: Date.now(),
            building: JSON.parse(JSON.stringify(this.building)),
            lead: JSON.parse(JSON.stringify(this.lead))
        };
    },

    /**
     * Import configuration from JSON
     * @param {Object} config - Configuration object
     */
    import(config) {
        if (config && config.building) {
            this.building = { ...this.getDefaults(), ...config.building };
            this.lead = { ...this.getLeadDefaults(), ...(config.lead || {}) };
            this.saveToStorage();
            this.dispatchChange('app', 'import', config);
        }
    }
};

export { state };

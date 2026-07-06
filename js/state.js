/**
 * @file state.js
 * @description Single Source of Truth State Management Container Layer.
 * Centralized reactive state store for all application data mutations and queries.
 */

import { constants } from './constants.js';

const ALLOWED_WIDTHS = [40, 50, 60, 70, 80, 90];
const LENGTH_MIN = 40;
const LENGTH_MAX = 256;
const LENGTH_STEP = 8;
const ALLOWED_OVERHANGS = [12, 18, 24];

/**
 * Reactive State Manager
 * Maintains immutable state and dispatches change events
 */
const state = {
    // Default building configuration template
    building: {},
    
    // Lead form contact information
    lead: {},
    
    // Currently selected opening node in viewer
    selectedOpening: null,
    
    // Current viewing face (front, rear, left, right)
    currentFace: 'front',

    /**
     * Initialize state with default configuration parameters
     * Called once on application bootstrap
     */
    init() {
        this.building = this.getDefaults();
        this.lead = this.getLeadDefaults();
        this.loadFromStorage();
        console.log('State initialized with defaults:', this.building);
    },

    /**
     * Get default building configuration object
     * @returns {Object} Default configuration template
     */
    getDefaults() {
        return {
            // Dimensions
            width: 40,
            length: 40,
            height: 14,
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

            // Openings array
            openings: []
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
     * Update building state property
     * Triggers custom event for reactive UI updates
     * @param {string} key - State key to update
     * @param {*} value - New value
     */
    setBuilding(key, value) {
        const { normalizedKey, normalizedValue } = this.normalizeBuildingValue(key, value);

        if (this.building[normalizedKey] !== normalizedValue) {
            this.building[normalizedKey] = normalizedValue;
            this.dispatchChange('building', normalizedKey, normalizedValue);
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
        for (const [key, value] of Object.entries(updates || {})) {
            const { normalizedKey, normalizedValue } = this.normalizeBuildingValue(key, value);
            if (this.building[normalizedKey] !== normalizedValue) {
                this.building[normalizedKey] = normalizedValue;
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
        if (key === 'eave') {
            return this.building.overhang;
        }
        return this.building[key];
    },

    normalizeWidth(value) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
            return 40;
        }

        let nearest = ALLOWED_WIDTHS[0];
        let minDistance = Math.abs(parsed - nearest);

        for (let i = 1; i < ALLOWED_WIDTHS.length; i++) {
            const candidate = ALLOWED_WIDTHS[i];
            const distance = Math.abs(parsed - candidate);
            if (distance < minDistance) {
                nearest = candidate;
                minDistance = distance;
            }
        }

        return nearest;
    },

    normalizeLength(value) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
            return 40;
        }

        const clamped = Math.min(LENGTH_MAX, Math.max(LENGTH_MIN, parsed));
        const snapped = LENGTH_MIN + (Math.round((clamped - LENGTH_MIN) / LENGTH_STEP) * LENGTH_STEP);
        return Math.min(LENGTH_MAX, Math.max(LENGTH_MIN, snapped));
    },

    normalizeOverhang(value) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
            return 12;
        }
        if (parsed === 0) {
            return 12;
        }
        return ALLOWED_OVERHANGS.includes(parsed) ? parsed : 12;
    },

    normalizeBuildingValue(key, value) {
        let normalizedKey = key;
        let normalizedValue = value;

        if (normalizedKey === 'eave') {
            normalizedKey = 'overhang';
        }

        if (normalizedKey === 'width') {
            normalizedValue = this.normalizeWidth(value);
        } else if (normalizedKey === 'length') {
            normalizedValue = this.normalizeLength(value);
        } else if (normalizedKey === 'overhang') {
            normalizedValue = this.normalizeOverhang(value);
        }

        return { normalizedKey, normalizedValue };
    },

    normalizeBuildingConfig(building = {}) {
        const normalized = { ...building };
        if (normalized.overhang == null && normalized.eave != null) {
            normalized.overhang = normalized.eave;
        }
        delete normalized.eave;

        normalized.width = this.normalizeWidth(normalized.width);
        normalized.length = this.normalizeLength(normalized.length);
        normalized.overhang = this.normalizeOverhang(normalized.overhang);

        if (!Array.isArray(normalized.openings)) {
            normalized.openings = [];
        }

        return normalized;
    },

    updateDimensions(updates = {}) {
        const normalizedUpdates = {};
        if (updates.width !== undefined) {
            normalizedUpdates.width = this.normalizeWidth(updates.width);
        }
        if (updates.length !== undefined) {
            normalizedUpdates.length = this.normalizeLength(updates.length);
        }
        if (updates.overhang !== undefined || updates.eave !== undefined) {
            normalizedUpdates.overhang = this.normalizeOverhang(
                updates.overhang !== undefined ? updates.overhang : updates.eave
            );
        }

        if (Object.keys(normalizedUpdates).length > 0) {
            this.setBuildingBatch(normalizedUpdates);
        }
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
     * @param {Object} opening - Opening configuration object
     * @returns {string} Unique opening ID
     */
    addOpening(opening) {
        const id = `opening-${Date.now()}`;
        const fullOpening = {
            id,
            type: opening.type, // 'overhead', 'bifold', 'slider', 'walk_door', 'window'
            x: opening.x || 100,
            y: opening.y || 100,
            width: opening.width || 10,
            height: opening.height || 8,
            face: opening.face || 'front',
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
     * Update opening properties
     * @param {string} openingId - ID of opening to update
     * @param {Object} updates - Properties to update
     */
    updateOpening(openingId, updates) {
        const opening = this.building.openings.find(o => o.id === openingId);
        if (opening) {
            Object.assign(opening, updates);
            this.dispatchChange('openings', 'update', opening);
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
     * @returns {Array} Openings array
     */
    getOpeningsByFace(face) {
        return this.building.openings.filter(o => o.face === face);
    },

    /**
     * Set selected opening node
     * @param {string|null} openingId - ID of selected opening or null
     */
    selectOpening(openingId) {
        if (this.selectedOpening !== openingId) {
            this.selectedOpening = openingId;
            this.dispatchChange('ui', 'selectedOpening', openingId);
        }
    },

    /**
     * Set current viewing face
     * @param {string} face - Face to view ('front', 'rear', 'left', 'right')
     */
    setCurrentFace(face) {
        if (this.currentFace !== face) {
            this.currentFace = face;
            this.dispatchChange('ui', 'currentFace', face);
        }
    },

    /**
     * Dispatch custom change event for reactivity
     * @param {string} category - Category of change
     * @param {string} path - Property path changed
     * @param {*} value - New value
     */
    dispatchChange(category, path, value) {
        const event = new CustomEvent('app:state-change', {
            detail: { category, path, value, timestamp: Date.now() }
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
                // Only load if data is recent (less than 7 days old)
                const ageMs = Date.now() - stateSnapshot.timestamp;
                const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
                
                if (ageMs < sevenDaysMs) {
                    const mergedBuilding = { ...this.getDefaults(), ...stateSnapshot.building };
                    this.building = this.normalizeBuildingConfig(mergedBuilding);
                    this.lead = { ...this.getLeadDefaults(), ...stateSnapshot.lead };
                    console.log('State restored from localStorage');
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
        this.selectedOpening = null;
        this.currentFace = 'front';
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
            const mergedBuilding = { ...this.getDefaults(), ...config.building };
            this.building = this.normalizeBuildingConfig(mergedBuilding);
            this.lead = { ...this.getLeadDefaults(), ...(config.lead || {}) };
            this.saveToStorage();
            this.dispatchChange('app', 'import', config);
        }
    }
};

export { state };

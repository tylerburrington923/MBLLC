/**
 * @file app.js
 * @description Master Bootstrapper Execution Entrypoint Router Layer Module.
 * Initializes all subsystems in correct sequence and orchestrates application lifecycle.
 */

import { state } from './state.js';
import { constants } from './constants.js';
import { controls } from './controls.js';
import { viewer } from './viewer.js';
import { pricing } from './pricing.js';
import { gallery } from './gallery.js';
import { form } from './form.js';
import { configurator } from './configurator.js';

/**
 * Initialize application when DOM is ready
 * Follows dependency order to ensure all systems boot correctly
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 Moravian Builders Estimator Platform - Initializing...');
    
    try {
        // Pipeline Sequence Step 1: Initialize System State parameters from local configuration definitions baseline arrays
        // This creates the single source of truth for all application data
        state.init();
        console.log('✓ State initialized');
        
        // Pipeline Sequence Step 2: Initialize UI Interactive Component Controllers
        // These bind DOM elements to state changes and handle user interactions
        controls.init();
        console.log('✓ Controls initialized');
        
        viewer.init();
        console.log('✓ Viewer initialized');
        
        gallery.init();
        console.log('✓ Gallery initialized');
        
        form.init();
        console.log('✓ Form initialized');

        bindEnvelopeSelectors();
        syncFormToState();

        // Pipeline Sequence Step 3: Trigger global lifecycle first pass data drawing loop orchestration matrices
        // Initial render of all visual elements based on default state
        pricing.calculate();
        viewer.renderPipeline();
        
        console.log('✅ Moravian Builders Estimator Platform - Ready');
        
        // Global error handler for unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
        });
        
    } catch (error) {
        console.error('❌ Fatal initialization error:', error);
        displayErrorMessage('Application failed to initialize. Please refresh the page.');
    }
});

function bindEnvelopeSelectors() {
    const widthSelect = document.getElementById('param-width');
    const lengthSelect = document.getElementById('param-length');
    const overhangSelect = document.getElementById('param-overhang');

    if (widthSelect) {
        widthSelect.addEventListener('change', (event) => {
            configurator.updateEnvelopeProperties({ width: event.target.value });
            syncFormToState();
            pricing.calculate();
            viewer.renderPipeline();
        });
    }

    if (lengthSelect) {
        lengthSelect.addEventListener('change', (event) => {
            configurator.updateEnvelopeProperties({ length: event.target.value });
            syncFormToState();
            pricing.calculate();
            viewer.renderPipeline();
        });
    }

    if (overhangSelect) {
        overhangSelect.addEventListener('change', (event) => {
            configurator.updateEnvelopeProperties({ overhang: event.target.value });
            syncFormToState();
            pricing.calculate();
            viewer.renderPipeline();
        });
    }
}

function setSelectWithFallback(selectElement, preferredValue, fallbackValue) {
    if (!selectElement) {
        return;
    }

    const preferred = String(preferredValue);
    const fallback = String(fallbackValue);
    const hasPreferred = Array.from(selectElement.options).some((option) => option.value === preferred);
    const hasFallback = Array.from(selectElement.options).some((option) => option.value === fallback);

    if (hasPreferred) {
        selectElement.value = preferred;
    } else if (hasFallback) {
        selectElement.value = fallback;
    } else if (selectElement.options.length > 0) {
        selectElement.selectedIndex = 0;
    }
}

function syncFormToState() {
    const widthSelect = document.getElementById('param-width');
    const lengthSelect = document.getElementById('param-length');
    const overhangSelect = document.getElementById('param-overhang');

    setSelectWithFallback(widthSelect, state.getBuilding('width'), '40');
    setSelectWithFallback(lengthSelect, state.getBuilding('length'), '40');
    setSelectWithFallback(overhangSelect, state.getBuilding('overhang'), '12');

    configurator.updateEnvelopeProperties({
        width: widthSelect?.value ?? '40',
        length: lengthSelect?.value ?? '40',
        overhang: overhangSelect?.value ?? '12'
    });
}

/**
 * Display error message to user
 * @param {string} message - Error message to display
 */
function displayErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'viewer-error';
    errorDiv.innerHTML = `
        <strong>⚠️ Error</strong>
        <p>${message}</p>
    `;
    document.body.appendChild(errorDiv);
}

/**
 * Global state change listener for debugging
 * Logs significant state mutations to console in development
 */
document.addEventListener('app:state-change', (e) => {
    if (e.detail.category === 'building') {
        syncFormToState();
    }

    if (process.env.NODE_ENV === 'development') {
        console.log('📊 State updated:', e.detail.path, '=', e.detail.value);
    }
});

/**
 * Handle window resize to recompute viewer dimensions
 * Debounced to prevent excessive recalculation
 */
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        viewer.renderPipeline();
    }, 250);
});

/**
 * Prevent accidental page navigation with unsaved changes
 * Only warn if user has made configuration changes
 */
window.addEventListener('beforeunload', (e) => {
    // Check if configuration has been modified from defaults
    const hasChanges = JSON.stringify(state.building) !== JSON.stringify(state.getDefaults());
    
    if (hasChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved configuration. Are you sure you want to leave?';
    }
});

export { displayErrorMessage };

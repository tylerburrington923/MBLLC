/**
 * @file configurator.js
 * @description Envelope-level state update helpers for width/length/overhang compatibility.
 */

import { state } from './state.js';

const ALLOWED_OVERHANGS = [12, 18, 24];

function normalizeOverhangValue(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return 12;
    }
    if (parsed === 0) {
        return 12;
    }
    return ALLOWED_OVERHANGS.includes(parsed) ? parsed : 12;
}

const configurator = {
    /**
     * Update envelope properties with compatibility-safe normalization.
     * Preserves existing behavior while sanitizing legacy overhang/eave values.
     * @param {Object} updates
     */
    updateEnvelopeProperties(updates = {}) {
        const next = { ...updates };

        if (next.overhang === undefined && next.eave !== undefined) {
            next.overhang = next.eave;
        }
        delete next.eave;

        if (next.overhang !== undefined) {
            next.overhang = normalizeOverhangValue(next.overhang);
        }

        state.setBuildingBatch(next);
    }
};

export { configurator };

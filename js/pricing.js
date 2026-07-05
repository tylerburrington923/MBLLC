/**
 * @file pricing.js
 * @description Price Calculation Engine & Dynamic Quote Generator.
 * Computes building cost based on dimensions, features, and openings.
 */

import { state } from './state.js';
import { constants } from './constants.js';

/**
 * Pricing module
 * Calculates all pricing components and updates summary display
 */
const pricing = {
    /**
     * Calculate total price based on current configuration
     * Updates UI summary with breakdown
     */
    calculate() {
        const building = state.building;
        
        // Step 1: Base price
        let totalPrice = constants.pricing.basePrice;

        // Step 2: Building envelope (square footage)
        const envelopeArea = building.width * building.length;
        const envelopePrice = envelopeArea * constants.pricing.pricePerSqFt;
        totalPrice += envelopePrice;

        // Step 3: Roof pitch multiplier
        const pitchMultiplier = constants.pricing.features.roofPitchMultiplier[building.roofPitch] || 1.0;
        totalPrice *= pitchMultiplier;

        // Step 4: Openings pricing
        const openingsPrice = this.calculateOpeningsPrice(building.openings);
        totalPrice += openingsPrice;

        // Step 5: Wainscot pricing (if enabled)
        let wainscotPrice = 0;
        if (building.wainscotEnabled) {
            const perimeter = (building.width + building.length) * 2;
            wainscotPrice = perimeter * constants.pricing.features.wainscot.pricePerLinearFt;
            totalPrice += wainscotPrice;
        }

        // Step 6: Interior finish pricing (if enabled)
        let interiorPrice = 0;
        if (building.interiorEnabled) {
            const interiorArea = building.width * building.length;
            interiorPrice = interiorArea * constants.pricing.features.interior.pricePerSqFt;
            totalPrice += interiorPrice;
        }

        // Step 7: Apply quantity discounts
        const discountAmount = this.calculateDiscount(totalPrice, building.openings.length);
        totalPrice -= discountAmount;

        // Update state with price (not persisted in localStorage)
        state.building._pricing = {
            total: totalPrice,
            breakdown: {
                base: constants.pricing.basePrice,
                envelope: envelopePrice,
                openings: openingsPrice,
                wainscot: wainscotPrice,
                interior: interiorPrice,
                discount: discountAmount
            }
        };

        // Update UI
        this.updateSummaryDisplay(totalPrice, state.building._pricing.breakdown);

        return totalPrice;
    },

    /**
     * Calculate total pricing for all openings
     * @param {Array} openings - Array of opening objects
     * @returns {number} Total openings price
     */
    calculateOpeningsPrice(openings) {
        if (!Array.isArray(openings) || openings.length === 0) {
            return 0;
        }

        let totalPrice = 0;

        openings.forEach(opening => {
            const typeConfig = constants.openingTypes[opening.type];
            if (typeConfig) {
                // Base price for opening type
                let price = typeConfig.priceBase;

                // Add price based on square footage
                const sqFt = opening.width * opening.height;
                price += sqFt * typeConfig.pricePerSqFt;

                // Apply opening type multiplier
                const multiplier = constants.pricing.openingMultipliers[opening.type] || 1.0;
                price *= multiplier;

                totalPrice += price;
            }
        });

        return totalPrice;
    },

    /**
     * Calculate quantity discount based on number of openings
     * @param {number} basePrice - Price before discount
     * @param {number} openingCount - Number of openings
     * @returns {number} Discount amount
     */
    calculateDiscount(basePrice, openingCount) {
        if (openingCount === 0) return 0;

        const discountPercent = Math.min(
            openingCount * constants.pricing.discounts.opening,
            constants.pricing.discounts.maxDiscountPercent / 100
        );

        return basePrice * discountPercent;
    },

    /**
     * Update summary display with calculated price
     * @param {number} totalPrice - Total calculated price
     * @param {Object} breakdown - Price breakdown details
     */
    updateSummaryDisplay(totalPrice, breakdown) {
        // Update total price badge
        const priceBadge = document.getElementById('price-badge');
        if (priceBadge) {
            priceBadge.textContent = this.formatPrice(totalPrice);
        }

        // Update specification list
        const specList = document.getElementById('summary-spec-list');
        if (specList) {
            specList.innerHTML = this.generateSpecsList();
        }

        // Log breakdown for debugging
        if (process.env.NODE_ENV === 'development') {
            console.log('Price breakdown:', breakdown);
        }
    },

    /**
     * Generate specification list HTML
     * @returns {string} HTML list items
     */
    generateSpecsList() {
        const building = state.building;
        let specs = [];

        // Dimensions
        specs.push(`<li><strong>Dimensions:</strong> ${building.width}' W × ${building.length}' L × ${building.height}' H</li>`);
        specs.push(`<li><strong>Roof Pitch:</strong> ${building.roofPitch}</li>`);
        specs.push(`<li><strong>Envelope Area:</strong> ${(building.width * building.length).toLocaleString()} sq ft</li>`);

        // Colors
        specs.push(`<li><strong>Roof Color:</strong> ${this.getColorName(building.roofColor, 'roof')}</li>`);
        specs.push(`<li><strong>Wall Color:</strong> ${this.getColorName(building.wallColor, 'wall')}</li>`);

        // Features
        if (building.wainscotEnabled) {
            specs.push(`<li><strong>Wainscot:</strong> Enabled - ${this.getColorName(building.wainscotColor, 'wainscot')}</li>`);
        }

        if (building.interiorEnabled) {
            specs.push(`<li><strong>Interior Finish:</strong> ${this.getColorName(building.interiorColor, 'interior')}</li>`);
        }

        // Openings summary
        if (Array.isArray(building.openings) && building.openings.length > 0) {
            specs.push(`<li><strong>Openings:</strong> ${building.openings.length} door(s)/window(s)</li>`);
            
            // Count by type
            const typeCounts = {};
            building.openings.forEach(opening => {
                typeCounts[opening.type] = (typeCounts[opening.type] || 0) + 1;
            });

            Object.entries(typeCounts).forEach(([type, count]) => {
                const typeConfig = constants.openingTypes[type];
                if (typeConfig) {
                    specs.push(`<li style="padding-left: var(--space-8);">• ${count}× ${typeConfig.label}</li>`);
                }
            });
        } else {
            specs.push(`<li><strong>Openings:</strong> None</li>`);
        }

        return specs.join('');
    },

    /**
     * Get color name from palette
     * @param {string} colorValue - Hex color value
     * @param {string} palette - Color palette name
     * @returns {string} Color name
     */
    getColorName(colorValue, palette) {
        const paletteColors = constants.colors[palette];
        if (paletteColors) {
            const found = paletteColors.find(c => c.value === colorValue);
            return found ? found.name : 'Custom';
        }
        return 'Unknown';
    },

    /**
     * Format price as currency string
     * @param {number} price - Price amount
     * @returns {string} Formatted price string
     */
    formatPrice(price) {
        return `${constants.locale.currencySymbol}${price.toLocaleString('en-US', {
            minimumFractionDigits: constants.locale.decimalPlaces,
            maximumFractionDigits: constants.locale.decimalPlaces
        })}`;
    },

    /**
     * Get price breakdown for display
     * @returns {Object} Breakdown object
     */
    getBreakdown() {
        return state.building._pricing?.breakdown || {};
    },

    /**
     * Get total price
     * @returns {number} Total price
     */
    getTotal() {
        return state.building._pricing?.total || 0;
    },

    /**
     * Export pricing data as object
     * @returns {Object} Pricing data for API submission
     */
    exportPricingData() {
        const pricing = this.getBreakdown();
        return {
            total: this.getTotal(),
            basePrice: pricing.base || constants.pricing.basePrice,
            envelopePrice: pricing.envelope || 0,
            openingsPrice: pricing.openings || 0,
            wainscotPrice: pricing.wainscot || 0,
            interiorPrice: pricing.interior || 0,
            discountAmount: pricing.discount || 0,
            building: {
                width: state.building.width,
                length: state.building.length,
                height: state.building.height,
                roofPitch: state.building.roofPitch,
                openingCount: (state.building.openings || []).length,
                wainscotEnabled: state.building.wainscotEnabled,
                interiorEnabled: state.building.interiorEnabled
            }
        };
    }
};

export { pricing };

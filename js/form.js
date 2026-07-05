/**
 * @file form.js
 * @description Lead Capture Form Handler & Validation Engine.
 * Manages form submission, validation, and lead data processing.
 */

import { state } from './state.js';
import { constants } from './constants.js';
import { pricing } from './pricing.js';

/**
 * Form module
 * Handles lead capture form interactions and validation
 */
const form = {
    formElement: null,
    isSubmitting: false,

    /**
     * Initialize form handlers
     */
    init() {
        this.formElement = document.getElementById('lead-form');
        if (this.formElement) {
            this.setupFormListeners();
            this.setupFieldValidation();
            this.restoreFormData();
        }
        console.log('Form initialized');
    },

    /**
     * Setup form event listeners
     */
    setupFormListeners() {
        this.formElement.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmission();
        });

        // Auto-save form data as user types
        const inputs = this.formElement.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                this.saveFormData();
            });

            input.addEventListener('blur', () => {
                this.validateField(input);
            });
        });
    },

    /**
     * Setup real-time field validation
     */
    setupFieldValidation() {
        const inputs = this.formElement.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                // Clear previous error state
                this.clearFieldError(input);
            });
        });
    },

    /**
     * Validate single field
     * @param {HTMLElement} field - Form field to validate
     * @returns {boolean} Whether field is valid
     */
    validateField(field) {
        const value = field.value.trim();
        const type = field.name;
        let isValid = true;
        let errorMessage = '';

        if (!value && field.hasAttribute('required')) {
            isValid = false;
            errorMessage = constants.errors.missingRequiredField;
        } else if (value) {
            switch (type) {
                case 'fullname':
                    if (!constants.validation.name.test(value)) {
                        isValid = false;
                        errorMessage = 'Please enter a valid full name (2-50 characters, letters and spaces only)';
                    }
                    break;

                case 'email':
                    if (!constants.validation.email.test(value)) {
                        isValid = false;
                        errorMessage = constants.errors.invalidEmail;
                    }
                    break;

                case 'phone':
                    const cleanPhone = value.replace(/\D/g, '');
                    if (cleanPhone.length !== 10) {
                        isValid = false;
                        errorMessage = 'Please enter a valid 10-digit phone number';
                    }
                    break;

                case 'city':
                    if (value.length < 2 || value.length > 50) {
                        isValid = false;
                        errorMessage = 'City must be 2-50 characters';
                    }
                    break;
            }
        }

        if (!isValid) {
            this.showFieldError(field, errorMessage);
        } else {
            this.clearFieldError(field);
        }

        return isValid;
    },

    /**
     * Show field error message
     * @param {HTMLElement} field - Form field
     * @param {string} message - Error message
     */
    showFieldError(field, message) {
        field.classList.add('error');
        
        // Remove existing error message
        const existingError = field.nextElementSibling;
        if (existingError && existingError.classList.contains('error-message')) {
            existingError.remove();
        }

        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        field.parentNode.insertBefore(errorDiv, field.nextSibling);
    },

    /**
     * Clear field error state
     * @param {HTMLElement} field - Form field
     */
    clearFieldError(field) {
        field.classList.remove('error');
        
        const errorMsg = field.nextElementSibling;
        if (errorMsg && errorMsg.classList.contains('error-message')) {
            errorMsg.remove();
        }
    },

    /**
     * Validate entire form
     * @returns {boolean} Whether form is valid
     */
    validateForm() {
        const fields = this.formElement.querySelectorAll('[required]');
        let isValid = true;

        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    },

    /**
     * Handle form submission
     */
    async handleFormSubmission() {
        if (this.isSubmitting) return;

        // Validate form
        if (!this.validateForm()) {
            this.showError('Please fix the errors above and try again.');
            return;
        }

        this.isSubmitting = true;
        const submitBtn = this.formElement.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
            // Collect form data
            const formData = this.collectFormData();

            // Combine with configuration data
            const submitData = {
                lead: formData,
                configuration: state.export(),
                pricing: pricing.exportPricingData(),
                timestamp: new Date().toISOString()
            };

            // Log for development
            if (process.env.NODE_ENV === 'development') {
                console.log('Form submission data:', submitData);
            }

            // Submit to server
            const response = await this.submitToServer(submitData);

            if (response.ok) {
                this.showSuccess(constants.messages.leadSubmitted);
                this.resetForm();
                
                // Clear saved form data
                localStorage.removeItem('moravian_lead_form');
            } else {
                throw new Error('Server responded with status: ' + response.status);
            }
        } catch (error) {
            console.error('Form submission error:', error);
            this.showError(constants.errors.serverError);
        } finally {
            this.isSubmitting = false;
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    },

    /**
     * Collect form data from fields
     * @returns {Object} Form data
     */
    collectFormData() {
        const fields = {
            fullname: 'fullname',
            email: 'email',
            phone: 'phone',
            city: 'city',
            state: 'state',
            specialRequests: 'specialRequests'
        };

        const data = {};
        Object.entries(fields).forEach(([key, fieldName]) => {
            const input = this.formElement.querySelector(`[name="${fieldName}"]`);
            if (input) {
                data[key] = input.value.trim();
            }
        });

        return data;
    },

    /**
     * Submit form data to server
     * @param {Object} data - Data to submit
     * @returns {Promise} Fetch response promise
     */
    submitToServer(data) {
        return fetch(constants.api.submitLead, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
    },

    /**
     * Save form data to localStorage
     */
    saveFormData() {
        const formData = this.collectFormData();
        try {
            localStorage.setItem('moravian_lead_form', JSON.stringify(formData));
        } catch (error) {
            console.warn('Failed to save form data:', error);
        }
    },

    /**
     * Restore form data from localStorage
     */
    restoreFormData() {
        try {
            const saved = localStorage.getItem('moravian_lead_form');
            if (saved) {
                const formData = JSON.parse(saved);
                Object.entries(formData).forEach(([key, value]) => {
                    const input = this.formElement.querySelector(`[name="${key}"]`);
                    if (input) {
                        input.value = value;
                    }
                });
            }
        } catch (error) {
            console.warn('Failed to restore form data:', error);
        }
    },

    /**
     * Reset form to defaults
     */
    resetForm() {
        this.formElement.reset();
        localStorage.removeItem('moravian_lead_form');
    },

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    },

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.showNotification(message, 'error');
    },

    /**
     * Show notification message
     * @param {string} message - Message text
     * @param {string} type - Message type ('success' or 'error')
     */
    showNotification(message, type) {
        // Remove existing notifications
        document.querySelectorAll('.form-notification').forEach(n => n.remove());

        // Create notification
        const notification = document.createElement('div');
        notification.className = `form-notification notification-${type}`;
        notification.innerHTML = `
            <strong>${type === 'success' ? '✓' : '⚠'}</strong>
            <p>${message}</p>
            <button class="notification-close" aria-label="Close">&times;</button>
        `;

        // Insert after form
        this.formElement.parentNode.insertBefore(notification, this.formElement.nextSibling);

        // Setup close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });

        // Auto-dismiss after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, constants.ui.toastDurationMs);
    },

    /**
     * Pre-fill form with state lead data
     * Used when user has already entered some information
     */
    prefillWithState() {
        const lead = state.lead;
        Object.entries(lead).forEach(([key, value]) => {
            const input = this.formElement.querySelector(`[name="${key}"]`);
            if (input && value) {
                input.value = value;
            }
        });
    }
};

export { form };

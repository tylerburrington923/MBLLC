/**
 * @file gallery.js
 * @description Image Gallery Carousel & Modal Viewer.
 * Manages image gallery display, carousel navigation, and lightbox modal.
 */

/**
 * Gallery module
 * Handles gallery carousel and modal image viewing
 */
const gallery = {
    currentIndex: 0,
    images: [],
    modal: null,
    carousel: null,

    /**
     * Initialize gallery
     */
    init() {
        this.loadGalleryImages();
        this.initCarousel();
        this.initModal();
        this.initKeyboardNavigation();
        console.log('Gallery initialized');
    },

    /**
     * Load gallery images from data attributes
     */
    loadGalleryImages() {
        const galleryContainer = document.querySelector('.gallery-scroller');
        if (galleryContainer) {
            const cards = galleryContainer.querySelectorAll('.gallery-card');
            this.images = Array.from(cards).map((card, idx) => ({
                id: idx,
                src: card.querySelector('img')?.src || '',
                title: card.querySelector('h3')?.textContent || 'Image',
                description: card.querySelector('p')?.textContent || ''
            }));
        }
    },

    /**
     * Initialize carousel navigation
     */
    initCarousel() {
        const prevBtn = document.querySelector('.gallery-nav-prev');
        const nextBtn = document.querySelector('.gallery-nav-next');

        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.previousImage();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.nextImage();
            });
        }

        // Initialize gallery cards with click handlers
        const cards = document.querySelectorAll('.gallery-card');
        cards.forEach((card, idx) => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                this.openModal(idx);
            });
        });
    },

    /**
     * Initialize modal for image viewing
     */
    initModal() {
        // Create modal if it doesn't exist
        const existingModal = document.getElementById('gallery-modal');
        if (existingModal) {
            this.modal = existingModal;
            this.setupModalListeners();
            return;
        }

        // Create modal structure
        const modal = document.createElement('div');
        modal.id = 'gallery-modal';
        modal.className = 'gallery-modal hidden';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close" title="Close">&times;</button>
                <div class="modal-body">
                    <img id="modal-image" src="" alt="Gallery image" />
                    <div class="modal-info">
                        <h2 id="modal-title"></h2>
                        <p id="modal-description"></p>
                    </div>
                </div>
                <div class="modal-nav">
                    <button class="modal-prev" title="Previous image">‹ Previous</button>
                    <span class="modal-counter"><span id="modal-current">1</span> / <span id="modal-total">${this.images.length}</span></span>
                    <button class="modal-next" title="Next image">Next ›</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.modal = modal;
        this.setupModalListeners();
    },

    /**
     * Setup modal event listeners
     */
    setupModalListeners() {
        const closeBtn = this.modal.querySelector('.modal-close');
        const prevBtn = this.modal.querySelector('.modal-prev');
        const nextBtn = this.modal.querySelector('.modal-next');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousImage());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextImage());
        }

        // Close modal on background click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });

        // Prevent closing when clicking content
        const content = this.modal.querySelector('.modal-content');
        if (content) {
            content.addEventListener('click', (e) => e.stopPropagation());
        }
    },

    /**
     * Initialize keyboard navigation
     */
    initKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (!this.modal || this.modal.classList.contains('hidden')) {
                return;
            }

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousImage();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextImage();
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.closeModal();
                    break;
            }
        });
    },

    /**
     * Open modal at specific image index
     * @param {number} index - Image index to display
     */
    openModal(index) {
        if (index < 0 || index >= this.images.length) {
            return;
        }

        this.currentIndex = index;
        const image = this.images[index];

        // Update modal content
        const imgElement = this.modal.querySelector('#modal-image');
        const titleElement = this.modal.querySelector('#modal-title');
        const descElement = this.modal.querySelector('#modal-description');
        const currentElement = this.modal.querySelector('#modal-current');

        if (imgElement) imgElement.src = image.src;
        if (titleElement) titleElement.textContent = image.title;
        if (descElement) descElement.textContent = image.description;
        if (currentElement) currentElement.textContent = index + 1;

        // Show modal
        this.modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    },

    /**
     * Close modal
     */
    closeModal() {
        if (this.modal) {
            this.modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    },

    /**
     * Show next image in modal
     */
    nextImage() {
        if (this.images.length === 0) return;
        this.openModal((this.currentIndex + 1) % this.images.length);
    },

    /**
     * Show previous image in modal
     */
    previousImage() {
        if (this.images.length === 0) return;
        this.openModal((this.currentIndex - 1 + this.images.length) % this.images.length);
    },

    /**
     * Get current image
     * @returns {Object} Current image object
     */
    getCurrentImage() {
        return this.images[this.currentIndex] || null;
    },

    /**
     * Get total number of images
     * @returns {number} Total images count
     */
    getTotalImages() {
        return this.images.length;
    }
};

export { gallery };

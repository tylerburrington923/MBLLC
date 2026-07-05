/**
 * @file gallery.js
 * @description Project Gallery Management
 * Carousel, lightbox modal, image loading, and navigation
 */

/**
 * Gallery module
 * Handles project showcase carousel and lightbox viewer
 */
const gallery = {
    currentIndex: 0,
    galleryContainer: null,
    lightboxModal: null,
    touchStartX: 0,
    touchEndX: 0,
    autoplayInterval: null,

    /**
     * Gallery image data - Project showcase images
     */
    images: [
        {
            id: 1,
            title: 'Modern Agricultural Building',
            description: 'State-of-the-art post-frame agricultural structure with custom configuration',
            url: 'https://github.com/user-attachments/assets/5b231e35-9d1e-4f00-8a27-f33e7dd21f84',
            alt: 'Agricultural building exterior'
        },
        {
            id: 2,
            title: 'Commercial Storage Facility',
            description: 'Large-span commercial post-frame building for storage and logistics',
            url: 'https://github.com/user-attachments/assets/b7b2d160-508f-4095-9e06-5b1b4c1f6d90',
            alt: 'Commercial storage building'
        },
        {
            id: 3,
            title: 'Industrial Warehouse',
            description: 'Heavy-duty industrial post-frame warehouse with high-capacity design',
            url: 'https://github.com/user-attachments/assets/d7e1f002-0716-4896-82df-22223a1429bb',
            alt: 'Industrial warehouse building'
        },
        {
            id: 4,
            title: 'Agricultural Facility',
            description: 'Custom post-frame agricultural building with specialized features',
            url: 'https://github.com/user-attachments/assets/1dc3b779-5032-40ff-b5f2-775801f8874a',
            alt: 'Agricultural facility'
        }
    ],

    /**
     * Initialize gallery
     */
    init() {
        this.galleryContainer = document.getElementById('gallery-carousel');
        this.lightboxModal = document.getElementById('lightbox-modal');
        
        if (this.galleryContainer) {
            this.setupCarousel();
            this.setupLightbox();
            this.setupKeyboard();
            this.startAutoplay();
            console.log('✓ Gallery initialized with ' + this.images.length + ' images');
        }
    },

    /**
     * Setup carousel controls and navigation
     */
    setupCarousel() {
        const prevBtn = document.getElementById('carousel-prev');
        const nextBtn = document.getElementById('carousel-next');
        const dotsContainer = document.getElementById('carousel-dots');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousSlide());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextSlide());
        }

        if (dotsContainer) {
            this.images.forEach((_, index) => {
                const dot = document.createElement('button');
                dot.className = 'carousel-dot' + (index === 0 ? ' active' : '');
                dot.setAttribute('aria-label', 'Go to slide ' + (index + 1));
                dot.addEventListener('click', () => this.goToSlide(index));
                dotsContainer.appendChild(dot);
            });
        }

        this.galleryContainer.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
            this.stopAutoplay();
        });

        this.galleryContainer.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
            this.startAutoplay();
        });

        this.render();
    },

    /**
     * Setup lightbox modal
     */
    setupLightbox() {
        if (!this.lightboxModal) return;

        const closeBtn = this.lightboxModal.querySelector('.lightbox-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeLightbox());
        }

        const prevBtn = this.lightboxModal.querySelector('.lightbox-prev');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousSlide());
        }

        const nextBtn = this.lightboxModal.querySelector('.lightbox-next');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextSlide());
        }

        this.lightboxModal.addEventListener('click', (e) => {
            if (e.target === this.lightboxModal) {
                this.closeLightbox();
            }
        });
    },

    /**
     * Setup keyboard navigation
     */
    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (this.lightboxModal && this.lightboxModal.style.display === 'flex') {
                if (e.key === 'ArrowLeft') this.previousSlide();
                if (e.key === 'ArrowRight') this.nextSlide();
                if (e.key === 'Escape') this.closeLightbox();
            }
        });
    },

    /**
     * Handle touch swipe gesture
     */
    handleSwipe() {
        const threshold = 50;
        const diff = this.touchStartX - this.touchEndX;

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                this.nextSlide();
            } else {
                this.previousSlide();
            }
        }
    },

    /**
     * Go to specific slide
     * @param {number} index - Slide index
     */
    goToSlide(index) {
        this.currentIndex = (index + this.images.length) % this.images.length;
        this.render();
        this.stopAutoplay();
        this.startAutoplay();
    },

    /**
     * Next slide
     */
    nextSlide() {
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        this.render();
    },

    /**
     * Previous slide
     */
    previousSlide() {
        this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        this.render();
    },

    /**
     * Render carousel
     */
    render() {
        if (!this.galleryContainer) return;

        const image = this.images[this.currentIndex];
        
        const carouselImage = this.galleryContainer.querySelector('.carousel-image');
        if (carouselImage) {
            carouselImage.src = image.url;
            carouselImage.alt = image.alt;
        }

        const titleEl = this.galleryContainer.querySelector('#carousel-title');
        const descEl = this.galleryContainer.querySelector('#carousel-description');
        if (titleEl) titleEl.textContent = image.title;
        if (descEl) descEl.textContent = image.description;

        document.querySelectorAll('.carousel-dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
        });

        if (this.lightboxModal && this.lightboxModal.style.display === 'flex') {
            this.updateLightbox();
        }
    },

    /**
     * Open lightbox with current image
     */
    openLightbox() {
        if (!this.lightboxModal) return;
        
        this.lightboxModal.style.display = 'flex';
        this.updateLightbox();
        document.body.style.overflow = 'hidden';
        this.stopAutoplay();
    },

    /**
     * Update lightbox display
     */
    updateLightbox() {
        const image = this.images[this.currentIndex];
        const lightboxImage = this.lightboxModal.querySelector('.lightbox-image');
        
        if (lightboxImage) {
            lightboxImage.src = image.url;
            lightboxImage.alt = image.alt;
        }
    },

    /**
     * Close lightbox
     */
    closeLightbox() {
        if (!this.lightboxModal) return;
        
        this.lightboxModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        this.startAutoplay();
    },

    /**
     * Start autoplay carousel
     */
    startAutoplay() {
        this.autoplayInterval = setInterval(() => {
            this.nextSlide();
        }, 5000);
    },

    /**
     * Stop autoplay carousel
     */
    stopAutoplay() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
            this.autoplayInterval = null;
        }
    },

    /**
     * Get all images
     * @returns {Array} Gallery images
     */
    getImages() {
        return this.images;
    }
};

export { gallery };

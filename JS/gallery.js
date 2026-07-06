export class GalleryModule {
  constructor() {
    this.currentIndex = 0;
    this.slides = [
      {
        image: 'images/gallery/project1.jpg',
        title: 'Suburban Workshop Structural Framework',
        description: 'Continuous concrete embedded pier footprint foundation layout featuring clean 4:12 pitch framing trusses.'
      },
      {
        image: 'images/gallery/project2.jpg',
        title: 'Commercial Storage Clear-Span Facility',
        description: 'High-clearance eave configuration engineered for heavy equipment access and industrial structural load balancing.'
      },
      {
        image: 'images/gallery/project3.jpg',
        title: 'Custom Agricultural Equipment Barn',
        description: 'Premium protective shell siding featuring dual color-matched accent trim setups and full protective side eave overhangs.'
      }
    ];

    this.cacheDOM();
    this.initEvents();
    this.updateUI();
  }

  cacheDOM() {
    this.mainImage = document.getElementById('carousel-main-image');
    this.titleText = document.getElementById('carousel-title');
    this.descText = document.getElementById('carousel-description');
    this.prevBtn = document.getElementById('carousel-prev');
    this.nextBtn = document.getElementById('carousel-next');
    this.viewFullBtn = document.getElementById('btn-view-full');
    this.dotsContainer = document.getElementById('carousel-dots');

    // Lightbox Selectors
    this.lightbox = document.getElementById('lightbox-modal');
    this.lightboxImg = document.getElementById('lightbox-image');
    this.lightboxClose = document.getElementById('lightbox-close');
    this.lightboxPrev = document.getElementById('lightbox-prev');
    this.lightboxNext = document.getElementById('lightbox-next');
    
    // Hero Elements
    this.heroSlides = document.querySelectorAll('.hero-slide');
  }

  initEvents() {
    if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.navigate(-1));
    if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.navigate(1));
    
    if (this.viewFullBtn) {
      this.viewFullBtn.addEventListener('click', () => this.openLightbox());
    }

    if (this.lightboxClose) {
      this.lightboxClose.addEventListener('click', () => this.closeLightbox());
    }
    if (this.lightboxPrev) this.lightboxPrev.addEventListener('click', () => this.navigateLightbox(-1));
    if (this.lightboxNext) this.lightboxNext.addEventListener('click', () => this.navigateLightbox(1));

    // Close lightbox on backdrop clicks natively
    if (this.lightbox) {
      this.lightbox.addEventListener('click', (e) => {
        if (e.target === this.lightbox) this.closeLightbox();
      });
    }

    // Keyboard support for accessibility parameters
    window.addEventListener('keydown', (e) => {
      if (!this.lightbox || this.lightbox.getAttribute('aria-hidden') === 'true') return;
      if (e.key === 'Escape') this.closeLightbox();
      if (e.key === 'ArrowLeft') this.navigateLightbox(-1);
      if (e.key === 'ArrowRight') this.navigateLightbox(1);
    });

    this.initHeroInterval();
  }

  navigate(direction) {
    this.currentIndex = (this.currentIndex + direction + this.slides.length) % this.slides.length;
    this.updateUI();
  }

  updateUI() {
    const current = this.slides[this.currentIndex];
    if (!current) return;

    if (this.mainImage) {
      this.mainImage.setAttribute('src', current.image);
    }
    if (this.titleText) this.titleText.textContent = current.title;
    if (this.descText) this.descText.textContent = current.description;

    this.renderDots();
  }

  renderDots() {
    if (!this.dotsContainer) return;
    this.dotsContainer.innerHTML = '';
    
    this.slides.forEach((_, index) => {
      const button = document.createElement('button');
      button.setAttribute('type', 'button');
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-label', `Slide ${index + 1}`);
      button.setAttribute('aria-selected', index === this.currentIndex ? 'true' : 'false');
      button.className = `carousel-dot${index === this.currentIndex ? ' active' : ''}`;
      
      button.addEventListener('click', () => {
        this.currentIndex = index;
        this.updateUI();
      });
      
      this.dotsContainer.appendChild(button);
    });
  }

  openLightbox() {
    if (!this.lightbox || !this.lightboxImg) return;
    const current = this.slides[this.currentIndex];
    this.lightboxImg.setAttribute('src', current.image);
    this.lightbox.classList.add('active');
    this.lightbox.setAttribute('aria-hidden', 'false');
  }

  closeLightbox() {
    if (!this.lightbox) return;
    this.lightbox.classList.remove('active');
    this.lightbox.setAttribute('aria-hidden', 'true');
  }

  navigateLightbox(direction) {
    this.navigate(direction);
    if (this.lightboxImg) {
      this.lightboxImg.setAttribute('src', this.slides[this.currentIndex].image);
    }
  }

  initHeroInterval() {
    if (!this.heroSlides || this.heroSlides.length === 0) return;
    let heroIndex = 0;

    setInterval(() => {
      this.heroSlides[heroIndex].classList.remove('active');
      heroIndex = (heroIndex + 1) % this.heroSlides.length;
      this.heroSlides[heroIndex].classList.add('active');
    }, 5000);
  }
}



import { Configurator } from './configurator.js';
import { Renderer } from './renderer.js';
import { DragDropEngine } from './dragDrop.js';
import { calculateBuildingPricing } from './pricing.js';
import { calculateMaterialEstimates } from './materials.js';
import { GalleryModule } from './gallery.js';
import { ApiModule } from './api.js';

class App {
  constructor() {
    this.configurator = new Configurator();
    this.configurator.registerPricingEngine(calculateBuildingPricing);

    this.cacheDOM();
    this.initModules();
    this.initEvents();
    this.syncFormToState();

    // Trigger initial visual refresh rendering cycles
    this.handleStateUpdate();
  }

  cacheDOM() {
    // Structural Parameter Triggers
    this.paramWidth = document.getElementById('param-width');
    this.paramLength = document.getElementById('param-length');
    this.paramHeight = document.getElementById('param-height');
    this.paramOverhang = document.getElementById('param-overhang');
    this.paramSpecial = document.getElementById('param-special');

    // Color Swatch Matrix Targets
    this.swatchesRoof = document.getElementById('swatches-roof');
    this.swatchesWall = document.getElementById('swatches-wall');
    this.swatchesTrim = document.getElementById('swatches-trim');
    this.swatchesWainscot = document.getElementById('swatches-wainscot');
    this.swatchesInterior = document.getElementById('swatches-interior');

    // Wainscot & Interior Visibility Triggers
    this.toggleWainscot = document.getElementById('toggle-wainscot');
    this.wainscotColorContainer = document.getElementById('wainscot-color-container');
    this.toggleInterior = document.getElementById('toggle-interior');
    this.interiorColorContainer = document.getElementById('interior-color-container');

    // Dynamic Projection View Tabs
    this.viewTabs = document.getElementById('view-tabs');
    this.viewerTitle = document.getElementById('viewer-title');

    // Component Injection Controls
    this.injectorGrid = document.querySelector('.injector-grid');

    // Node Modifier Drawer Form Block
    this.modifierCard = document.getElementById('modifier-card');
    this.modWidth = document.getElementById('mod-width');
    this.modHeight = document.getElementById('mod-height');
    this.btnDuplicate = document.getElementById('btn-duplicate');
    this.btnDelete = document.getElementById('btn-delete');

    // Display Badges and Ledger Layout Panels
    this.priceBadge = document.getElementById('price-badge');
    this.mobilePriceBadge = document.getElementById('mobile-price-badge');
    this.summarySpecList = document.getElementById('summary-spec-list');

    // Lead Capture Form Terminal
    this.leadForm = document.getElementById('lead-form');
    this.btnSubmitLead = document.getElementById('btn-submit-lead');

    // Global SVG Architecture Elements
    this.svgElement = document.getElementById('building-svg');
  }

  initModules() {
    this.renderer = new Renderer(this.svgElement);
    this.dragDrop = new DragDropEngine(this.svgElement, this.configurator, this.renderer);
    this.gallery = new GalleryModule();

    // Establish direct state lifecycle monitoring pipelines
    this.configurator.subscribe(({ type, state }) => {
      if (type.startsWith('error:')) {
        alert(state.message || "An architectural layout error occurred.");
        return;
      }
      this.handleStateUpdate();
    });
  }

  initEvents() {
    // Core Geometry Structural Selectors Change Triggers
    const envelopeSelects = [this.paramWidth, this.paramLength, this.paramHeight, this.paramOverhang];
    envelopeSelects.forEach(select => {
      if (select) {
        select.addEventListener('change', () => this.updateEnvelopeFromUI());
      }
    });

    if (this.paramSpecial) {
      this.paramSpecial.addEventListener('input', () => {
        this.configurator.updateEnvelopeProperties({ specialNotes: this.paramSpecial.value });
      });
    }

    // Swatch Matrix Selector Delegators
    this.setupSwatchGroup(this.swatchesRoof, 'roofColor');
    this.setupSwatchGroup(this.swatchesWall, 'wallColor');
    this.setupSwatchGroup(this.swatchesTrim, 'trimColor');
    this.setupSwatchGroup(this.swatchesWainscot, 'wainscotColor');
    this.setupSwatchGroup(this.swatchesInterior, 'interiorColor');

    // Component Installation Status Button Toggle Triggers
    this.setupToggleGroup(this.toggleWainscot, (val) => {
      const isWainscot = val === 'true';
      if (isWainscot) this.wainscotColorContainer.classList.remove('hidden');
      else this.wainscotColorContainer.classList.add('hidden');
      this.configurator.updateEnvelopeProperties({ wainscot: isWainscot });
    });

    this.setupToggleGroup(this.toggleInterior, (val) => {
      const isInterior = val === 'true';
      if (isInterior) this.interiorColorContainer.classList.remove('hidden');
      else this.interiorColorContainer.classList.add('hidden');
      this.configurator.updateEnvelopeProperties({ interiorLiner: isInterior });
    });

    // Dynamic View Projection Angles Setup Links Tabs
    if (this.viewTabs) {
      this.viewTabs.addEventListener('click', (e) => {
        const tab = e.target.closest('.tab-btn');
        if (!tab) return;
        
        this.viewTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        tab.classList.add('active');
        
        const face = tab.getAttribute('data-face');
        this.configurator.clearSelection();
        this.configurator.setActiveFace(face);
        
        if (this.viewerTitle) {
          this.viewerTitle.textContent = `${tab.textContent} Projection View`;
        }
      });
    }

    // Apertures Assembly Injection Button Actions
    if (this.injectorGrid) {
      this.injectorGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-inject');
        if (!btn) return;
        
        const type = btn.getAttribute('data-type');
        let width = 3.0, height = 6.8;

        if (type === 'overhead' || type === 'bifold' || type === 'slider') {
          width = 10.0;
          height = 10.0;
        } else if (type === 'window') {
          width = 4.0;
          height = 3.0;
        }

        this.configurator.addOpeningToActiveWall({ type, width, height });
      });
    }

    // Modifier Drawer Input Node Changes
    if (this.modWidth) {
      this.modWidth.addEventListener('change', () => this.updateActiveOpeningProperties());
    }
    if (this.modHeight) {
      this.modHeight.addEventListener('change', () => this.updateActiveOpeningProperties());
    }

    if (this.btnDelete) {
      this.btnDelete.addEventListener('click', () => {
        const activeOp = this.getActiveSelectedOpening();
        if (activeOp) {
          this.configurator.removeOpeningFromActiveWall(activeOp.id);
        }
      });
    }

    if (this.btnDuplicate) {
      this.btnDuplicate.addEventListener('click', () => {
        const activeOp = this.getActiveSelectedOpening();
        if (activeOp) {
          // Offsets position slightly inside transaction boundaries natively
          this.configurator.addOpeningToActiveWall({
            type: activeOp.type,
            width: activeOp.width,
            height: activeOp.height,
            position: activeOp.position + 4.0 
          });
        }
      });
    }

    // Lead Capture Submission Terminal Pipeline Processing
    if (this.leadForm) {
      this.leadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!this.validateContactForm()) return;

        this.btnSubmitLead.disabled = true;
        this.btnSubmitLead.textContent = "Processing Proposal Engineering Metrics...";

        const formData = Object.fromEntries(new FormData(this.leadForm));
        
        try {
          const res = await ApiModule.submitLead(formData, this.configurator.state);
          if (res.success) {
            alert(`Proposal Request Submitted Successfully!\nTracking Reference ID: ${res.trackingId}\nOur design leads will contact you shortly.`);
            this.leadForm.reset();
          }
        } catch (err) {
          alert("Submission pipeline failure. Please retry shortly.");
        } finally {
          this.btnSubmitLead.disabled = false;
          this.btnSubmitLead.textContent = "Request Formal Estimate";
        }
      });
    }
  }

  setupSwatchGroup(container, stateProperty) {
    if (!container) return;
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.swatch-btn');
      if (!btn) return;

      container.querySelectorAll('.swatch-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const value = btn.getAttribute('data-value');
      this.configurator.updateEnvelopeProperties({ [stateProperty]: value });
    });
  }

  setupToggleGroup(container, callback) {
    if (!container) return;
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-toggle');
      if (!btn) return;

      container.querySelectorAll('.btn-toggle').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      callback(btn.getAttribute('data-value'));
    });
  }

  updateEnvelopeFromUI() {
    this.configurator.updateEnvelopeProperties({
      width: this.paramWidth.value,
      length: this.paramLength.value,
      height: this.paramHeight.value,
      overhang: this.paramOverhang.value
    });
  }

  updateActiveOpeningProperties() {
    const activeOp = this.getActiveSelectedOpening();
    if (!activeOp) return;

    this.configurator.updateOpeningProperties(activeOp.id, {
      width: this.modWidth.value,
      height: this.modHeight.value
    });
  }

  syncFormToState() {
    const state = this.configurator.state;
    if (this.paramWidth) this.paramWidth.value = state.width;
    if (this.paramLength) this.paramLength.value = state.length;
    if (this.paramHeight) this.paramHeight.value = state.height;
    if (this.paramOverhang) this.paramOverhang.value = state.overhang;
    if (this.paramSpecial) this.paramSpecial.value = state.specialNotes;
  }

  handleStateUpdate() {
    const state = this.configurator.state;

    // 1. Pass data model references directly over to structural viewport renderers
    this.renderer.render(state);

    // 2. Refresh dynamic totals display statement text nodes
    const formattedPrice = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(state.pricing.total);
    if (this.priceBadge) this.priceBadge.textContent = formattedPrice;
    if (this.mobilePriceBadge) this.mobilePriceBadge.textContent = formattedPrice;

    // 3. Sync and evaluate active selections updates
    const activeOp = this.getActiveSelectedOpening();
    if (activeOp) {
      this.modWidth.value = activeOp.width;
      this.modHeight.value = activeOp.height;
      this.modifierCard.classList.remove('hidden');
    } else {
      this.modifierCard.classList.add('hidden');
    }

    // 4. Update the real-time configuration summary spec checklist presentation ledger
    this.renderSummarySpecs(state);
  }

  getActiveSelectedOpening() {
    const activeFaceId = this.configurator.state.activeFace;
    return this.configurator.state.walls[activeFaceId].openings.find(op => op.selected);
  }

  renderSummarySpecs(state) {
    if (!this.summarySpecList) return;
    
    const faceLabels = { front: 'Front View', rear: 'Rear View', left: 'Left Side View', right: 'Right Side View' };
    const materialsList = calculateMaterialEstimates(state);
    
    // Count up distinct apertures globally across structural framing loops tracking
    const totalOpeningsCount = Object.values(state.walls).reduce((sum, w) => sum + w.openings.length, 0);

    let html = `
      <li><span>Main Envelope Footprint Footing Dimensions:</span><span>${state.width}ft Width &times; ${state.length}ft Length &times; ${state.height}ft Height</span></li>
      <li><span>Active Construction Plane Workspace Target Angle:</span><span>${faceLabels[state.activeFace]}</span></li>
      <li><span>Total Configured Framing Assemblies Nodes:</span><span>${totalOpeningsCount} Active Nodes Inserted</span></li>
    `;

    // Append standard component counts summaries directly into the specification overview logs panels
    materialsList.slice(0, 3).forEach(mat => {
      html += `<li><span>Estimated Takeoff (${mat.category}):</span><span>${mat.quantity} ${mat.unit} (${mat.spec})</span></li>`;
    });

    this.summarySpecList.innerHTML = html;
  }

  validateContactForm() {
    let isValid = true;
    const fields = ['name', 'email', 'phone', 'city', 'state'];
    
    fields.forEach(f => {
      const el = document.getElementById(`lead-${f}`);
      const err = document.getElementById(`err-${f}`);
      if (el && err) {
        if (!el.checkValidity()) {
          err.textContent = el.validationMessage || "Invalid form entry.";
          isValid = false;
        } else {
          err.textContent = "";
        }
      }
    });

    return isValid;
  }
}

// Instantiate and secure the application runtime lifecycle loop context bindings at DOM execution ready triggers
document.addEventListener('DOMContentLoaded', () => {
  window.MoravianAppRootInstance = new App();
});

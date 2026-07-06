export class Renderer {
  constructor(svgElement) {
    this.svg = svgElement;
    this.gridLayer = svgElement.getElementById('svg-grid-layer');
    this.envelopeLayer = svgElement.getElementById('svg-envelope-layer');
    this.openingsLayer = svgElement.getElementById('svg-openings-layer');
    this.selectionLayer = svgElement.getElementById('svg-selection-layer');
    
    this.dimWidthText = svgElement.getElementById('svg-dim-width-text');
    this.dimHeightText = svgElement.getElementById('svg-dim-height-text');
    
    this.canvasWidth = 800;
    this.canvasHeight = 500;
    this.paddingX = 50;
    this.baselineY = 420;
  }

  render(state) {
    const activeFaceId = state.activeFace;
    const wall = state.walls[activeFaceId];
    if (!wall) return;

    // 1. Calculate Spatial Scaling Transformations to fit the viewport box bounding box safely
    const maxWallLength = Math.max(state.width, state.length);
    const scaleX = (this.canvasWidth - (this.paddingX * 2)) / maxWallLength;
    const scaleY = 18.0; // Fixed projection multiplier mapping heights natively to preserve aspect targets

    const renderWidth = wall.length * scaleX;
    const renderHeight = wall.height * scaleY;
    const startX = this.paddingX + ((this.canvasWidth - (this.paddingX * 2)) - renderWidth) / 2;
    const wallTopY = this.baselineY - renderHeight;

    // 2. Clear out older dynamic canvas element node allocations loops
    this.openingsLayer.innerHTML = '';
    this.selectionLayer.innerHTML = '';

    // 3. Update Primary Exterior Framework Enclosures Shell Layout Vectors
    const wallRect = this.envelopeLayer.querySelector('#svg-wall');
    if (wallRect) {
      wallRect.setAttribute('x', startX);
      wallRect.setAttribute('y', wallTopY);
      wallRect.setAttribute('width', renderWidth);
      wallRect.setAttribute('height', renderHeight);
      wallRect.setAttribute('fill', state.wallColor);
    }

    const wainscotRect = this.envelopeLayer.querySelector('#svg-wainscot');
    if (wainscotRect) {
      if (state.wainscot) {
        const wainscotHeight = 3.0 * scaleY;
        wainscotRect.setAttribute('x', startX);
        wainscotRect.setAttribute('y', this.baselineY - wainscotHeight);
        wainscotRect.setAttribute('width', renderWidth);
        wainscotRect.setAttribute('height', wainscotHeight);
        wainscotRect.setAttribute('fill', state.wainscotColor);
        wainscotRect.classList.remove('hidden');
      } else {
        wainscotRect.classList.add('hidden');
      }
    }

    const roofPoly = this.envelopeLayer.querySelector('#svg-roof');
    if (roofPoly) {
      if (activeFaceId === 'front' || activeFaceId === 'rear') {
        const apexHeight = (wall.length / 2) * (4 / 12) * scaleY; // Fixed 4:12 Pitch Standard Formula
        const apexY = wallTopY - apexHeight;
        const centerX = startX + (renderWidth / 2);
        
        roofPoly.setAttribute('points', `${startX},${wallTopY} ${centerX},${apexY} ${startX + renderWidth},${wallTopY}`);
        roofPoly.setAttribute('fill', state.roofColor);
        roofPoly.classList.remove('hidden');
      } else {
        // Hide gabled visual treatments for raw perspective side view eave profile representations
        roofPoly.classList.add('hidden');
      }
    }

    // 4. Update Dynamic Dimension Callouts Strings Elements text nodes
    if (this.dimWidthText) {
      this.dimWidthText.textContent = `${wall.length} ft (Active Wall Width)`;
      this.dimWidthText.setAttribute('x', this.canvasWidth / 2);
    }
    if (this.dimHeightText) {
      this.dimHeightText.textContent = `${wall.height} ft Clear Eave Line`;
      this.dimHeightText.setAttribute('y', this.baselineY - (renderHeight / 2));
    }

    // 5. Build Apertures Nodes Visual Map Representations Array Loops
    wall.openings.forEach(opening => {
      const opWidth = opening.width * scaleX;
      const opHeight = opening.height * scaleY;
      const opCenterX = startX + (opening.position * scaleX);
      const opStartX = opCenterX - (opWidth / 2);
      
      // Compute the floor line matching projection anchors context tags
      let opStartY = this.baselineY - opHeight;
      if (opening.type === 'window') {
        opStartY = wallTopY + (renderHeight * 0.3); // Base offset position floating window nodes natively
      }

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('data-id', opening.id);
      rect.setAttribute('x', opStartX);
      rect.setAttribute('y', opStartY);
      rect.setAttribute('width', opWidth);
      rect.setAttribute('height', opHeight);
      rect.setAttribute('class', `opening-rect${opening.selected ? ' selected' : ''}`);
      rect.setAttribute('fill', '#F1F5F9');
      
      // Mobile Pointer & Accessibility Focus Framework Additions
      rect.setAttribute('focusable', 'true');
      rect.setAttribute('tabindex', '0');
      
      this.openingsLayer.appendChild(rect);
    });
  }
}

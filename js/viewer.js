/**
 * @file viewer.js
 * @description SVG Rendering Engine & 2D Canvas Manager.
 * Handles all 2D visualization, canvas rendering, and opening manipulation.
 * PHASE 3-5: Wall unification + projection engine + drag-ready rendering
 */

import { state } from './state.js';
import { constants } from './constants.js';
import { pricing } from './pricing.js';

/**
 * Grid snap constant (normalized)
 * 0.04 ≈ 4ft on standard 40ft width
 */
const GRID_STEP = 0.04;

/**
 * Viewer module
 * Manages SVG canvas rendering and 2D building visualization
 */
const viewer = {
    svg: null,
    dragState: null,

    /**
     * Initialize viewer
     */
    init() {
        this.svg = document.getElementById('building-svg');
        
        if (this.svg) {
            this.initDragSystem();
            this.renderPipeline();
            console.log('✓ Viewer initialized with drag system');
        }
    },

    /**
     * Initialize pointer-based drag system
     * PHASE 5-6: Complete drag & drop foundation
     */
    initDragSystem() {
        this.svg.addEventListener('pointerdown', (e) => this.onPointerDown(e), false);
        window.addEventListener('pointermove', (e) => this.onPointerMove(e), false);
        window.addEventListener('pointerup', (e) => this.onPointerUp(e), false);
        this.svg.addEventListener('pointerleave', (e) => this.onPointerUp(e), false);
    },

    /**
     * Pointer down - start drag
     * PHASE 6: Detect opening nodes and begin drag state
     */
    onPointerDown(e) {
        const target = e.target;
        
        // Only handle opening-node elements
        if (!target.classList.contains('opening-node')) return;

        e.preventDefault();
        
        const openingId = target.getAttribute('data-opening-id');
        const opening = state.getOpening(openingId);
        
        if (!opening) return;

        // Select opening
        state.selectOpening(openingId);

        // Get SVG bounds for coordinate conversion
        const svgRect = this.svg.getBoundingClientRect();

        // Store drag state
        this.dragState = {
            openingId,
            svgRect,
            startX: e.clientX,
            startY: e.clientY,
            startOpX: opening.x,
            startOpY: opening.y,
            isDragging: false
        };

        this.svg.style.cursor = 'grabbing';
    },

    /**
     * Pointer move - drag object
     * PHASE 6: Convert pointer movement to normalized coordinates with snapping
     */
    onPointerMove(e) {
        if (!this.dragState) return;

        e.preventDefault();

        const opening = state.getOpening(this.dragState.openingId);
        if (!opening) return;

        // Calculate movement in SVG coordinate space
        const { svgRect, startX, startY, startOpX, startOpY } = this.dragState;
        const { width, height } = svgRect;

        // Convert pixel movement to normalized space
        // Use projection to get wall dimensions
        const activeWall = state.getActiveWall();
        const projection = this.getWallProjection(activeWall, state.building);
        const wallScale = 10; // From renderOpenings scale

        const wallPixelWidth = projection.w * wallScale;
        const wallPixelHeight = projection.h * wallScale;

        const deltaX = (e.clientX - startX) / wallPixelWidth;
        const deltaY = (e.clientY - startY) / wallPixelHeight;

        // Calculate new position
        let newX = startOpX + deltaX;
        let newY = startOpY + deltaY;

        // Apply grid snap
        newX = this.snapToGrid(newX, GRID_STEP);
        newY = this.snapToGrid(newY, GRID_STEP);

        // Clamp to bounds (prevent dragging outside wall)
        const maxX = 1 - opening.width;
        const maxY = 1 - opening.height;
        newX = Math.max(0, Math.min(maxX, newX));
        newY = Math.max(0, Math.min(maxY, newY));

        // Update state WITHOUT dispatch (preview mode)
        opening.x = newX;
        opening.y = newY;

        this.dragState.isDragging = true;

        // Render preview
        this.renderPipeline();
    },

    /**
     * Pointer up - end drag
     * PHASE 6: Finalize position and save to storage
     */
    onPointerUp(e) {
        if (!this.dragState) return;

        e.preventDefault();

        if (this.dragState.isDragging) {
            // Dispatch change event to trigger storage
            state.dispatchChange('openings', 'move', null);
            state.saveToStorage();
        }

        this.dragState = null;
        this.svg.style.cursor = '';
        this.renderPipeline();
    },

    /**
     * Snap value to grid
     * PHASE 6: Global grid snapping
     * @param {number} value - Normalized value (0-1)
     * @param {number} step - Grid step
     * @returns {number} Snapped value
     */
    snapToGrid(value, step) {
        return Math.round(value / step) * step;
    },

    /**
     * Get wall projection dimensions based on active wall
     * PHASE 3-4: Unified wall projection engine
     * @param {string} activeWall - Current wall being viewed
     * @param {object} building - Building state object
     * @returns {object} Projection with {w, h, mirror}
     */
    getWallProjection(activeWall, building) {
        if (!building.dimensions) {
            return { w: 40, h: 14, mirror: false };
        }

        const { width, length, height } = building.dimensions;

        switch (activeWall) {
            case "front":
                return { w: width, h: height, mirror: false };
            case "rear":
                return { w: width, h: height, mirror: true };
            case "left":
                return { w: length, h: height, mirror: false };
            case "right":
                return { w: length, h: height, mirror: true };
            default:
                return { w: width, h: height, mirror: false };
        }
    },

    /**
     * Main render pipeline
     * Called whenever state changes or view needs update
     */
    renderPipeline() {
        if (!this.svg) return;

        // Clear previous SVG content
        while (this.svg.firstChild) {
            this.svg.removeChild(this.svg.firstChild);
        }

        // PHASE 3: Use unified activeWall instead of currentFace
        const activeWall = state.getActiveWall();
        const projection = this.getWallProjection(activeWall, state.building);

        // Render layers
        this.renderGrid();
        this.renderBuilding(projection);
        this.renderOpenings(projection, activeWall);
        this.renderSelection(projection, activeWall);
    },

    /**
     * Render building envelope (roof, walls, wainscot)
     */
    renderBuilding(projection) {
        const { dimensions, roofColor, wallColor, wainscotEnabled, wainscotColor } = state.building;
        
        if (!dimensions) return;

        const { height } = dimensions;
        const padding = 50;
        const scale = 10;
        const w = projection.w * scale;
        const h = height * scale;

        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'envelope-layer');

        // Wall rectangle
        const wallRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        wallRect.setAttribute('class', 'wall-rect');
        wallRect.setAttribute('x', padding);
        wallRect.setAttribute('y', padding);
        wallRect.setAttribute('width', w);
        wallRect.setAttribute('height', h);
        wallRect.setAttribute('fill', wallColor || '#64748B');
        wallRect.setAttribute('stroke', '#000');
        wallRect.setAttribute('stroke-width', '2');
        group.appendChild(wallRect);

        // Wainscot (if enabled)
        if (wainscotEnabled) {
            const wainscotRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            wainscotRect.setAttribute('class', 'wainscot-rect');
            wainscotRect.setAttribute('x', padding);
            wainscotRect.setAttribute('y', padding + h - h * 0.3);
            wainscotRect.setAttribute('width', w);
            wainscotRect.setAttribute('height', h * 0.3);
            wainscotRect.setAttribute('fill', wainscotColor || '#475569');
            group.appendChild(wainscotRect);
        }

        this.svg.appendChild(group);
    },

    /**
     * Render openings (doors and windows) on current face
     * PHASE 4-5: Safe filtering + normalized coordinate conversion
     * @param {object} projection - Wall projection data
     * @param {string} activeWall - Active wall name
     */
    renderOpenings(projection, activeWall) {
        // PHASE 4: Safe filtering with null check
        const openingsOnFace = (state.building.openings || []).filter(o => o.face === activeWall);

        const padding = 50;
        const scale = 10;
        const wallW = projection.w * scale;
        const wallH = projection.h * scale;

        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'openings-layer');
        group.setAttribute('id', 'svg-openings-layer');

        openingsOnFace.forEach(opening => {
            // PHASE 5: Convert normalized (0-1) to SVG coordinates
            const svgX = padding + (opening.x * wallW);
            const svgY = padding + (opening.y * wallH);
            const svgW = opening.width * wallW;
            const svgH = opening.height * wallH;

            // Opening rectangle
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('class', 'opening-node');
            rect.setAttribute('data-opening-id', opening.id);
            rect.setAttribute('x', svgX);
            rect.setAttribute('y', svgY);
            rect.setAttribute('width', svgW);
            rect.setAttribute('height', svgH);
            rect.setAttribute('fill', '#E2E8F0');
            rect.setAttribute('stroke', '#333');
            rect.setAttribute('stroke-width', '1');

            if (state.building.selectedOpeningId === opening.id) {
                rect.setAttribute('class', 'opening-node selected');
                rect.setAttribute('stroke', '#D4AF37');
                rect.setAttribute('stroke-width', '3');
            }

            group.appendChild(rect);
        });

        this.svg.appendChild(group);
    },

    /**
     * Render selection highlights
     * @param {object} projection - Wall projection data
     * @param {string} activeWall - Active wall name
     */
    renderSelection(projection, activeWall) {
        if (!state.building.selectedOpeningId) return;

        const opening = state.getOpening(state.building.selectedOpeningId);
        if (!opening || opening.face !== activeWall) return;

        const padding = 50;
        const scale = 10;
        const wallW = projection.w * scale;
        const wallH = projection.h * scale;
        
        const svgX = padding + (opening.x * wallW);
        const svgY = padding + (opening.y * wallH);
        const svgW = opening.width * wallW;
        const svgH = opening.height * wallH;

        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'selection-layer');

        // Selection outline
        const outline = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        outline.setAttribute('x', svgX - 5);
        outline.setAttribute('y', svgY - 5);
        outline.setAttribute('width', svgW + 10);
        outline.setAttribute('height', svgH + 10);
        outline.setAttribute('fill', 'none');
        outline.setAttribute('stroke', '#D4AF37');
        outline.setAttribute('stroke-width', '2');
        outline.setAttribute('stroke-dasharray', '5,5');
        group.appendChild(outline);

        // Resize handles (corners)
        const handles = [
            { x: svgX, y: svgY, cursor: 'nwse-resize' },
            { x: svgX + svgW, y: svgY, cursor: 'nesw-resize' },
            { x: svgX, y: svgY + svgH, cursor: 'nesw-resize' },
            { x: svgX + svgW, y: svgY + svgH, cursor: 'nwse-resize' }
        ];

        handles.forEach(handle => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('class', 'resize-handle');
            circle.setAttribute('cx', handle.x);
            circle.setAttribute('cy', handle.y);
            circle.setAttribute('r', '5');
            circle.setAttribute('fill', '#D4AF37');
            circle.setAttribute('style', `cursor: ${handle.cursor}`);
            group.appendChild(circle);
        });

        this.svg.appendChild(group);
    },

    /**
     * Render grid lines
     */
    renderGrid() {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'grid-layer');

        const spacing = 40;
        const maxX = 800;
        const maxY = 500;

        // Vertical lines
        for (let x = 0; x <= maxX; x += spacing) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('class', x % 160 === 0 ? 'grid-line-major' : 'grid-line');
            line.setAttribute('x1', x);
            line.setAttribute('y1', 0);
            line.setAttribute('x2', x);
            line.setAttribute('y2', maxY);
            group.appendChild(line);
        }

        // Horizontal lines
        for (let y = 0; y <= maxY; y += spacing) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('class', y % 160 === 0 ? 'grid-line-major' : 'grid-line');
            line.setAttribute('x1', 0);
            line.setAttribute('y1', y);
            line.setAttribute('x2', maxX);
            line.setAttribute('y2', y);
            group.appendChild(line);
        }

        this.svg.appendChild(group);
    }
};

export { viewer };

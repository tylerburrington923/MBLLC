/**
 * @file viewer.js
 * @description SVG Rendering Engine & 2D Canvas Manager.
 * Handles all 2D visualization, canvas rendering, and opening manipulation.
 */

import { state } from './state.js';
import { constants } from './constants.js';

/**
 * Viewer module
 * Manages SVG canvas rendering and 2D building visualization
 */
const viewer = {
    svg: null,
    canvas: null,
    scale: 1.0,
    panX: 0,
    panY: 0,
    isDragging: false,
    dragStart: { x: 0, y: 0 },

    /**
     * Initialize viewer
     */
    init() {
        this.canvas = document.getElementById('viewer-canvas');
        this.initSVG();
        this.initInteractions();
        this.initTabSwitching();
        console.log('Viewer initialized');
    },

    /**
     * Initialize SVG canvas
     */
    initSVG() {
        if (this.canvas) {
            this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            this.svg.setAttribute('class', 'viewer-svg');
            this.svg.setAttribute('viewBox', `0 0 ${constants.svg.viewBoxWidth} ${constants.svg.viewBoxHeight}`);
            this.canvas.appendChild(this.svg);
        }
    },

    /**
     * Initialize user interactions (click, drag, zoom)
     */
    initInteractions() {
        if (this.canvas) {
            this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
            this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
            this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
            this.canvas.addEventListener('wheel', (e) => this.handleZoom(e));
            this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
            this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
            this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        }
    },

    /**
     * Initialize tab switching for different views
     */
    initTabSwitching() {
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const face = tab.dataset.face;
                if (face) {
                    state.setCurrentFace(face);
                    this.switchViewTab(tab);
                    this.renderPipeline();
                }
            });
        });
    },

    /**
     * Switch active tab
     * @param {HTMLElement} tab - Tab button element
     */
    switchViewTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    },

    /**
     * Get wall projection dimensions based on active wall
     * CRITICAL FIX: Each wall gets proper width/height assignment
     * @param {string} activeWall - Current wall being viewed
     * @param {object} building - Building state object
     * @returns {object} Projection with {w, h, mirror}
     */
    getWallProjection(activeWall, building) {
        const { width, length, height } = building.dimensions;

        switch (activeWall) {
            case "front":
            case "rear":
                return { w: width, h: height, mirror: activeWall === "rear" };

            case "left":
            case "right":
                return { w: length, h: height, mirror: activeWall === "right" };

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

        // Get current wall projection (CRITICAL FIX)
        const projection = this.getWallProjection(state.currentFace, state.building);

        // Render building envelope
        this.renderBuilding();

        // Render openings on current face with projection awareness
        this.renderOpenings(projection);

        // Render selection UI if opening selected
        if (state.selectedOpening) {
            this.renderSelectionUI();
        }

        // Render grid (optional, can be toggled)
        this.renderGrid();
    },

    /**
     * Render building envelope (roof, walls, wainscot)
     */
    renderBuilding() {
        const { width, length, height, roofPitch, wainscotEnabled } = state.building;
        const cfg = constants.svg;
        const scale = cfg.gridSize;

        // Calculate positions
        const x = cfg.padding;
        const y = cfg.padding;
        const w = width * scale;
        const h = height * scale;

        // Roof polygon
        const roofHeight = this.calculateRoofHeight(roofPitch, width);
        const roofPoly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        roofPoly.setAttribute('class', 'roof-poly');
        roofPoly.setAttribute('points', `
            ${x},${y + h}
            ${x + w / 2},${y + h - roofHeight * scale}
            ${x + w},${y + h}
        `);
        roofPoly.setAttribute('fill', state.building.roofColor);
        this.svg.appendChild(roofPoly);

        // Walls
        const wallRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        wallRect.setAttribute('class', 'wall-rect');
        wallRect.setAttribute('x', x);
        wallRect.setAttribute('y', y + h);
        wallRect.setAttribute('width', w);
        wallRect.setAttribute('height', h * 0.5);
        wallRect.setAttribute('fill', state.building.wallColor);
        this.svg.appendChild(wallRect);

        // Wainscot (if enabled)
        if (wainscotEnabled) {
            const wainscotRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            wainscotRect.setAttribute('class', 'wainscot-rect');
            wainscotRect.setAttribute('x', x);
            wainscotRect.setAttribute('y', y + h + h * 0.4);
            wainscotRect.setAttribute('width', w);
            wainscotRect.setAttribute('height', h * 0.1);
            wainscotRect.setAttribute('fill', state.building.wainscotColor);
            this.svg.appendChild(wainscotRect);
        }
    },

    /**
     * Calculate roof peak height from pitch
     * @param {string} pitch - Roof pitch (e.g., "4:12")
     * @param {number} width - Building width
     * @returns {number} Height in feet
     */
    calculateRoofHeight(pitch, width) {
        const [rise, run] = pitch.split(':').map(Number);
        return (width / 2) * (rise / run);
    },

    /**
     * Render openings (doors and windows) on current face
     * CRITICAL FIX: Now projection-aware and normalized
     * @param {object} projection - Wall projection data
     */
    renderOpenings(projection) {
        const openings = state.getOpeningsByFace(state.currentFace);
        const cfg = constants.svg;
        const scale = cfg.gridSize;

        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'openings-layer');

        openings.forEach(opening => {
            // CRITICAL FIX: Convert normalized coordinates to SVG space
            // opening.x and opening.y are 0-1 normalized values
            const x = cfg.padding + (opening.x * projection.w * scale);
            const y = cfg.padding + (opening.y * projection.h * scale);
            const w = opening.width * scale;
            const h = opening.height * scale;

            // Opening rectangle
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('class', 'opening-node');
            rect.setAttribute('x', x);
            rect.setAttribute('y', y);
            rect.setAttribute('width', w);
            rect.setAttribute('height', h);
            rect.setAttribute('fill', cfg.colors.opening);
            rect.setAttribute('stroke', cfg.colors.openingStroke);
            rect.setAttribute('stroke-width', cfg.strokeWidths.default);
            rect.setAttribute('data-opening-id', opening.id);

            if (state.selectedOpening === opening.id) {
                rect.classList.add('selected');
            }

            // Label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('class', 'opening-label');
            text.setAttribute('x', x + w / 2);
            text.setAttribute('y', y + h / 2);
            text.setAttribute('pointer-events', 'none');
            text.textContent = opening.type.replace('_', ' ').toUpperCase();

            rect.addEventListener('click', (e) => {
                e.stopPropagation();
                state.selectOpening(opening.id);
                this.renderPipeline();
            });

            rect.addEventListener('mousedown', (e) => {
                if (e.button === 0) {
                    e.stopPropagation();
                    this.startDraggingOpening(e, opening.id);
                }
            });

            group.appendChild(rect);
            group.appendChild(text);
        });

        this.svg.appendChild(group);
    },

    /**
     * Render selection UI (handles, resize controls)
     */
    renderSelectionUI() {
        const opening = state.getOpening(state.selectedOpening);
        if (!opening) return;

        const cfg = constants.svg;
        const scale = cfg.gridSize;
        const projection = this.getWallProjection(state.currentFace, state.building);
        
        const x = cfg.padding + (opening.x * projection.w * scale);
        const y = cfg.padding + (opening.y * projection.h * scale);
        const w = opening.width * scale;
        const h = opening.height * scale;
        const handleSize = 8;

        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'selection-layer');

        // Selection outline
        const outline = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        outline.setAttribute('class', 'selection-box');
        outline.setAttribute('x', x - 4);
        outline.setAttribute('y', y - 4);
        outline.setAttribute('width', w + 8);
        outline.setAttribute('height', h + 8);
        group.appendChild(outline);

        // Resize handles (corners)
        const handles = [
            { x: x - handleSize / 2, y: y - handleSize / 2, cursor: 'nwse-resize' },
            { x: x + w - handleSize / 2, y: y - handleSize / 2, cursor: 'nesw-resize' },
            { x: x - handleSize / 2, y: y + h - handleSize / 2, cursor: 'nesw-resize' },
            { x: x + w - handleSize / 2, y: y + h - handleSize / 2, cursor: 'nwse-resize' }
        ];

        handles.forEach((handle, idx) => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('class', 'selection-handle');
            circle.setAttribute('cx', handle.x + handleSize / 2);
            circle.setAttribute('cy', handle.y + handleSize / 2);
            circle.setAttribute('r', handleSize / 2);
            circle.setAttribute('style', `cursor: ${handle.cursor}`);
            group.appendChild(circle);
        });

        this.svg.appendChild(group);
    },

    /**
     * Render grid lines
     */
    renderGrid() {
        const cfg = constants.svg;
        const grid = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        grid.setAttribute('class', 'grid-layer');

        const spacing = cfg.gridSize;
        for (let x = 0; x <= cfg.viewBoxWidth; x += spacing) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('class', x % (spacing * 4) === 0 ? 'grid-line-major' : 'grid-line');
            line.setAttribute('x1', x);
            line.setAttribute('y1', 0);
            line.setAttribute('x2', x);
            line.setAttribute('y2', cfg.viewBoxHeight);
            grid.appendChild(line);
        }

        for (let y = 0; y <= cfg.viewBoxHeight; y += spacing) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('class', y % (spacing * 4) === 0 ? 'grid-line-major' : 'grid-line');
            line.setAttribute('x1', 0);
            line.setAttribute('y1', y);
            line.setAttribute('x2', cfg.viewBoxWidth);
            line.setAttribute('y2', y);
            grid.appendChild(line);
        }

        this.svg.appendChild(grid);
    },

    /**
     * Handle canvas click (deselect opening if clicking empty area)
     */
    handleCanvasClick(e) {
        if (e.target === this.svg || e.target === this.canvas) {
            state.selectOpening(null);
            this.renderPipeline();
        }
    },

    /**
     * Start dragging opening
     */
    startDraggingOpening(e, openingId) {
        this.isDragging = true;
        this.dragStart = { x: e.clientX, y: e.clientY };
    },

    /**
     * Handle mouse down
     */
    handleMouseDown(e) {
        if (e.button === 0) {
            this.isDragging = true;
            this.dragStart = { x: e.clientX, y: e.clientY };
        }
    },

    /**
     * Handle mouse move (dragging)
     */
    handleMouseMove(e) {
        if (this.isDragging && state.selectedOpening) {
            const dx = (e.clientX - this.dragStart.x) / constants.svg.gridSize;
            const dy = (e.clientY - this.dragStart.y) / constants.svg.gridSize;

            const opening = state.getOpening(state.selectedOpening);
            if (opening) {
                state.updateOpening(state.selectedOpening, {
                    x: Math.max(0, opening.x + dx),
                    y: Math.max(0, opening.y + dy)
                });
                this.dragStart = { x: e.clientX, y: e.clientY };
                this.renderPipeline();
            }
        }
    },

    /**
     * Handle mouse up
     */
    handleMouseUp(e) {
        this.isDragging = false;
    },

    /**
     * Handle zoom with mouse wheel
     */
    handleZoom(e) {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        this.scale = Math.max(constants.svg.minScale, Math.min(constants.svg.maxScale, this.scale * zoomFactor));
        this.svg.style.transform = `scale(${this.scale})`;
    },

    /**
     * Handle touch start
     */
    handleTouchStart(e) {
        if (e.touches.length === 1) {
            this.dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            this.isDragging = true;
        }
    },

    /**
     * Handle touch move
     */
    handleTouchMove(e) {
        if (this.isDragging && e.touches.length === 1 && state.selectedOpening) {
            const dx = (e.touches[0].clientX - this.dragStart.x) / constants.svg.gridSize;
            const dy = (e.touches[0].clientY - this.dragStart.y) / constants.svg.gridSize;

            const opening = state.getOpening(state.selectedOpening);
            if (opening) {
                state.updateOpening(state.selectedOpening, {
                    x: Math.max(0, opening.x + dx),
                    y: Math.max(0, opening.y + dy)
                });
                this.dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                this.renderPipeline();
            }
        }
    },

    /**
     * Handle touch end
     */
    handleTouchEnd(e) {
        this.isDragging = false;
    }
};

export { viewer };

import { PostFrameConfigurator } from './configurator.js';

document.addEventListener('DOMContentLoaded', () => {
    const core = new PostFrameConfigurator();
    
    // DOM Elements Cache Mapping 
    const svg = document.getElementById('building-svg');
    const svgWall = document.getElementById('svg-wall');
    const svgRoof = document.getElementById('svg-roof');
    const svgWainscot = document.getElementById('svg-wainscot');
    const openingsLayer = document.getElementById('svg-openings-layer');
    const priceBadge = document.getElementById('price-badge');
    const mobilePriceBadge = document.getElementById('mobile-price-badge');
    
    // Modification panel selectors
    const modifierCard = document.getElementById('modifier-card');
    const modWidthInput = document.getElementById('mod-width');
    const modHeightInput = document.getElementById('mod-height');

    let draggedElement = null;

    function renderWorkspace() {
        // 1. Setup Shell Proportions Framework
        // Base viewport bounds: Left margin=50, Right margin=750 (Total width span=700)
        // Floor line fixed baseline boundary coordinate index = 420
        const canvasWidthSpan = 700;
        const baseFloorY = 420;
        
        // Scale height linearly (e.g., 14ft height maps cleanly inside canvas bounds)
        const pixelsPerFootY = 15; 
        const wallHeightPixels = core.state.height * pixelsPerFootY;
        const wallTopY = baseFloorY - wallHeightPixels;

        svgWall.setAttribute('y', wallTopY);
        svgWall.setAttribute('height', wallHeightPixels);
        svgWall.setAttribute('fill', core.state.wallColor);

        // 2. Structural Roof Geometry Truss Vector Paths Points Array
        const ridgeX = 400; // Center peak profile alignment track
        const roofPeakY = wallTopY - 60; // 4:12 standard fixed offset pitch projection
        svgRoof.setAttribute('points', `50,${wallTopY} ${ridgeX},${roofPeakY} 750,${wallTopY}`);
        svgRoof.setAttribute('fill', core.state.roofColor);

        // 3. Wainscot Assembly Strip Installation
        if (core.state.hasWainscot) {
            svgWainscot.classList.remove('hidden');
            const wainscotHeightPixels = 3 * pixelsPerFootY; // Fixed 3ft lower accent line
            svgWainscot.setAttribute('y', baseFloorY - wainscotHeightPixels);
            svgWainscot.setAttribute('height', wainscotHeightPixels);
            svgWainscot.setAttribute('fill', core.state.wainscotColor);
        } else {
            svgWainscot.classList.add('hidden');
        }

        // 4. Labels and Dimensions Overlay Setup
        document.getElementById('svg-dim-width-text').textContent = `${core.state.width} ft (Building Frame Width Line)`;
        document.getElementById('svg-dim-height-text').textContent = `${core.state.height} ft Eave Structural Line`;

        // 5. Render Openings Node Array Log Loop
        openingsLayer.innerHTML = '';
        const activeFaceOpenings = core.state.openings.filter(op => op.face === core.state.activeFace);

        activeFaceOpenings.forEach(op => {
            const nodeW = (op.width / core.state.width) * canvasWidthSpan;
            const nodeH = op.height * pixelsPerFootY;
            const nodeX = 50 + ((op.xPercent / 100) * canvasWidthSpan);
            // Lock components flat to ground surface line natively
            const nodeY = baseFloorY - nodeH; 

            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('id', op.id);
            rect.setAttribute('x', nodeX);
            rect.setAttribute('y', nodeY);
            rect.setAttribute('width', nodeW);
            rect.setAttribute('height', nodeH);
            rect.setAttribute('class', `opening-rect ${core.state.selectedNodeId === op.id ? 'selected' : ''}`);
            
            // Text color coding inside component nodes matching styling blocks definitions
            if (op.type === 'window') rect.style.fill = '#93C5FD'; 
            else if (op.type === 'walk_door') rect.style.fill = '#D1D5DB';
            else rect.style.fill = '#E2E8F0';

            // Attach drag interaction sequences directly to the nodes
            rect.addEventListener('mousedown', (e) => startDrag(e, op));
            rect.addEventListener('touchstart', (e) => startDrag(e, op), { passive: false });

            openingsLayer.appendChild(rect);
        });

        // Update Global Pricing Output Displays
        const currentCost = core.calculateEstimate();
        const localizedCostString = `$${currentCost.toLocaleString()}`;
        priceBadge.textContent = localizedCostString;
        mobilePriceBadge.textContent = localizedCostString;

        // Toggle editing panel drawer visibility targets context mapping
        const selectedNode = core.state.openings.find(op => op.id === core.state.selectedNodeId);
        if (selectedNode) {
            modifierCard.classList.remove('hidden');
            modWidthInput.value = selectedNode.width;
            modHeightInput.value = selectedNode.height;
        } else {
            modifierCard.classList.add('hidden');
        }
    }

    // Interactive Drag Mechanics Handlers Block
    function startDrag(e, op) {
        e.preventDefault();
        core.state.selectedNodeId = op.id;
        draggedElement = op;
        renderWorkspace();

        const moveEvent = e.type === 'touchstart' ? 'touchmove' : 'mousemove';
        const endEvent = e.type === 'touchstart' ? 'touchend' : 'mouseup';

        const handleMove = (moveEvt) => {
            if (!draggedElement) return;
            const clientX = moveEvt.type === 'touchmove' ? moveEvt.touches[0].clientX : moveEvt.clientX;
            
            const coords = core.getSVGCoords({ clientX }, svg);
            const canvasX = coords.x - 50; // Align coordinate with building boundary track
            let xPercent = (canvasX / 700) * 100;

            // 4ft Structural Lock Grid Snapping Alignment Mechanics
            const totalFeet = core.state.width;
            const currentFootPosition = (xPercent / 100) * totalFeet;
            const snappedFoot = Math.round(currentFootPosition / 4) * 4;
            
            // Constrain within building boundaries
            xPercent = (snappedFoot / totalFeet) * 100;
            const maxPercent = 100 - ((draggedElement.width / totalFeet) * 100);
            draggedElement.xPercent = Math.max(0, Math.min(xPercent, maxPercent));
            
            renderWorkspace();
        };

        const handleEnd = () => {
            draggedElement = null;
            window.removeEventListener(moveEvent, handleMove);
            window.removeEventListener(endEvent, handleEnd);
        };

        window.addEventListener(moveEvent, handleMove, { passive: false });
        window.addEventListener(endEvent, handleEnd);
    }

    // UI Input Change Watcher Bindings Mapping Matrix Loops
    document.querySelectorAll('select').forEach(el => {
        el.addEventListener('change', (e) => {
            core.updateParameter(e.target.name, e.target.value);
            renderWorkspace();
        });
    });

    // Swatch Array Selections Binding Click Listeners
    const bindSwatches = (containerId, stateKey) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.swatch-btn');
            if (!btn) return;
            container.querySelectorAll('.swatch-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            core.updateParameter(stateKey, btn.dataset.value);
            renderWorkspace();
        });
    };

    bindSwatches('swatches-roof', 'roofColor');
    bindSwatches('swatches-wall', 'wallColor');
    bindSwatches('swatches-trim', 'trimColor');
    bindSwatches('swatches-wainscot', 'wainscotColor');

    // Toggle row switches handling loops logic targets
    const bindToggles = (toggleContainerId, stateKey, visibilityToggleCallback) => {
        const row = document.getElementById(toggleContainerId);
        if (!row) return;
        row.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-toggle');
            if (!btn) return;
            row.querySelectorAll('.btn-toggle').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            core.updateParameter(stateKey, btn.dataset.value);
            if (visibilityToggleCallback) visibilityToggleCallback(btn.dataset.value);
            renderWorkspace();
        });
    };

    bindToggles('toggle-wainscot', 'hasWainscot', (val) => {
        document.getElementById('wainscot-color-container').classList.toggle('hidden', val === 'false');
    });
    bindToggles('toggle-interior', 'hasInteriorLiner', (val) => {
        document.getElementById('interior-color-container').classList.toggle('hidden', val === 'false');
    });

    // Angle Elevation Mapping Tabs Navigation Controller Base Switches
    document.getElementById('view-tabs').addEventListener('click', (e) => {
        const tab = e.target.closest('.tab-btn');
        if (!tab) return;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        tab.classList.add('active');
        core.state.activeFace = tab.dataset.face;
        document.getElementById('viewer-title').textContent = `${tab.textContent} Elevation Projection View`;
        renderWorkspace();
    });

    // Component Assembly Openings Injectors Click Actions Triggers Router
    document.querySelectorAll('.btn-inject').forEach(btn => {
        btn.addEventListener('click', () => {
            core.injectOpening(btn.dataset.type);
            renderWorkspace();
        });
    });

    // Active Selection Modifier Scaler Inputs Processing
    modWidthInput.addEventListener('input', (e) => {
        const selectedNode = core.state.openings.find(op => op.id === core.state.selectedNodeId);
        if (selectedNode) {
            selectedNode.width = Math.max(3, Math.min(Number(e.target.value), core.state.width));
            renderWorkspace();
        }
    });

    modHeightInput.addEventListener('input', (e) => {
        const selectedNode = core.state.openings.find(op => op.id === core.state.selectedNodeId);
        if (selectedNode) {
            selectedNode.height = Math.max(3, Math.min(Number(e.target.value), core.state.height - 2));
            renderWorkspace();
        }
    });

    // Delete Component Track Processing Node Sequence Logic Action
    document.getElementById('btn-delete').addEventListener('click', () => {
        core.state.openings = core.state.openings.filter(op => op.id !== core.state.selectedNodeId);
        core.state.selectedNodeId = null;
        renderWorkspace();
    });

    // Duplicate Node Action
    document.getElementById('btn-duplicate').addEventListener('click', () => {
        const current = core.state.openings.find(op => op.id === core.state.selectedNodeId);
        if (current) {
            const clone = { ...current, id: 'node_' + Date.now(), xPercent: Math.min(current.xPercent + 8, 80) };
            core.state.openings.push(clone);
            core.state.selectedNodeId = clone.id;
            renderWorkspace();
        }
    });

    // Kick off initialization structural render layout map track sequence logic
    renderWorkspace();
});
waiting 

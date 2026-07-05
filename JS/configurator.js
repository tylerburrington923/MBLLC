/**
 * Moravian Builders LLC - Configuration & Core Layout State Engine
 */
export class PostFrameConfigurator {
    constructor() {
        this.state = {
            width: 30,
            length: 40,
            height: 14,
            roofColor: '#334155',
            wallColor: '#475569',
            trimColor: '#1E293B',
            hasWainscot: false,
            wainscotColor: '#1E293B',
            overhang: 12,
            hasInteriorLiner: false,
            interiorColor: '#F8FAFC',
            activeFace: 'front', // 'front', 'rear', 'left', 'right'
            openings: [], // Arrays of injected component structural nodes
            selectedNodeId: null
        };

        // Standard Pricing Matrices
        this.basePricePerSqFt = 25; // Base framing lumber + labor index
        this.heightSurchargePerFt = 1200; 
        this.wainscotCostPerLinearFt = 18;
        this.interiorLinerCostPerSqFt = 8;
        
        this.openingCosts = {
            overhead: 1250,
            bifold: 3200,
            slider: 950,
            walk_door: 450,
            window: 250
        };
    }

    updateParameter(key, value) {
        if (value === 'true') value = true;
        if (value === 'false') value = false;
        if (!isNaN(value) && typeof value !== 'boolean' && String(value).trim() !== '' && !String(value).startsWith('#')) {
            value = Number(value);
        }
        this.state[key] = value;
        return this.calculateEstimate();
    }

    calculateEstimate() {
        const sqFt = this.state.width * this.state.length;
        let total = sqFt * this.basePricePerSqFt;

        // Height scale addition
        if (this.state.height > 10) {
            total += (this.state.height - 10) * this.heightSurchargePerFt;
        }

        // Wainscot perimeter calculations
        if (this.state.hasWainscot) {
            const perimeter = (this.state.width * 2) + (this.state.length * 2);
            total += perimeter * this.wainscotCostPerLinearFt;
        }

        // Internal lining structural area payload
        if (this.state.hasInteriorLiner) {
            const wallArea = ((this.state.width * 2) + (this.state.length * 2)) * this.state.height;
            total += wallArea * this.interiorLinerCostPerSqFt;
        }

        // Apertures count pricing lookup mapping loop
        this.state.openings.forEach(op => {
            total += this.openingCosts[op.type] || 0;
            // Scale multiplier based on custom surface sizing
            const baseArea = 32; // 4x8 reference node area
            const currentArea = op.width * op.height;
            if (currentArea > baseArea) {
                total += (currentArea - baseArea) * 15;
            }
        });

        return total;
    }

    injectOpening(type) {
        const id = 'node_' + Date.now();
        
        // Dynamic default sizes matching standardized structural styles
        let w = 4, h = 4;
        if (type === 'overhead') { w = 10; h = 10; }
        else if (type === 'bifold') { w = 24; h = 14; }
        else if (type === 'slider') { w = 12; h = 12; }
        else if (type === 'walk_door') { w = 3; h = 7; }

        const newNode = {
            id,
            type,
            width: w,
            height: h,
            face: this.state.activeFace,
            xPercent: 40, // Base placement alignment starting coordinate offset
            yPercent: 0   // Snapped to structural finish grade floor baseline
        };

        this.state.openings.push(newNode);
        this.state.selectedNodeId = id;
        return newNode;
    }

    getSVGCoords(event, svgElement) {
        const point = svgElement.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;
        // Matrix conversion addressing small viewport fluid coordinates scaling
        const transformations = svgElement.getScreenCTM().inverse();
        return point.matrixTransform(transformations);
    }
}
 

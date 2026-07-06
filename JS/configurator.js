import { BuildingState } from './state.js';
import { RuleContext } from './utils.js';

export class Configurator {
  constructor(initialData = {}) {
    this.state = new BuildingState(initialData);
    this.pricingEngine = null;
    this.listeners = new Set();
    this.ruleContext = RuleContext;
  }

  registerPricingEngine(engine) {
    this.pricingEngine = engine;
    this.evaluatePricing();
  }

  evaluatePricing() {
    if (!this.pricingEngine) return;
    this.state.pricing = this.pricingEngine(this.state);
    this.notify('pricing:updated', this.state.pricing);
  }

  setActiveFace(faceId) {
    if (!this.state.walls[faceId]) return;
    this.state.activeFace = faceId;
    this.notify('state:updated', this.state);
  }

  updateEnvelopeProperties(properties = {}) {
    let dimensionsChanged = false;
    const nextWidth = properties.width !== undefined ? Number(properties.width) : this.state.width;
    const nextLength = properties.length !== undefined ? Number(properties.length) : this.state.length;
    const nextHeight = properties.height !== undefined ? Number(properties.height) : this.state.height;

    if (nextWidth !== this.state.width || nextLength !== this.state.length || nextHeight !== this.state.height) {
      dimensionsChanged = true;
    }

    if (dimensionsChanged) {
      this.state.updateDimensions(nextWidth, nextLength, nextHeight, this.ruleContext);
    }

    if (properties.roofColor !== undefined) this.state.roofColor = properties.roofColor;
    if (properties.wallColor !== undefined) this.state.wallColor = properties.wallColor;
    if (properties.trimColor !== undefined) this.state.trimColor = properties.trimColor;
    if (properties.wainscot !== undefined) this.state.wainscot = !!properties.wainscot;
    if (properties.wainscotColor !== undefined) this.state.wainscotColor = properties.wainscotColor;
    if (properties.interiorLiner !== undefined) this.state.interiorLiner = !!properties.interiorLiner;
    if (properties.interiorColor !== undefined) this.state.interiorColor = properties.interiorColor;
    if (properties.overhang !== undefined) this.state.overhang = Number(properties.overhang);
    if (properties.specialNotes !== undefined) this.state.specialNotes = properties.specialNotes;

    this.evaluatePricing();
    this.notify('state:updated', this.state);
  }

  addOpeningToActiveWall(openingData) {
    const faceId = this.state.activeFace;
    const wall = this.state.walls[faceId];
    if (!wall) return null;

    // Default position to physical center of the wall if not specified
    if (openingData.position === undefined) {
      openingData.position = wall.length / 2;
    }

    // Explicitly deselect existing selections on this wall line
    wall.openings.forEach(op => op.deselect());

    const op = wall.addOpening(openingData, this.ruleContext);
    if (op) {
      op.select();
      this.evaluatePricing();
      this.notify('opening:added', { wallId: faceId, opening: op });
    } else {
      this.notify('error:action_rejected', { message: 'Placement constraints or space overlap conflict.' });
    }
    return op;
  }

  moveOpeningInActiveWall(openingId, requestedPosition) {
    const faceId = this.state.activeFace;
    const wall = this.state.walls[faceId];
    if (!wall) return false;

    const success = wall.moveOpening(openingId, requestedPosition, this.ruleContext);
    if (success) {
      this.evaluatePricing();
      this.notify('opening:moved', { wallId: faceId, openingId, position: wall.getOpening(openingId).position });
    }
    return success;
  }

  removeOpeningFromActiveWall(openingId) {
    const faceId = this.state.activeFace;
    const wall = this.state.walls[faceId];
    if (!wall) return false;

    const success = wall.removeOpening(openingId);
    if (success) {
      this.evaluatePricing();
      this.notify('opening:removed', { wallId: faceId, openingId });
    }
    return success;
  }

  updateOpeningProperties(openingId, properties = {}) {
    const faceId = this.state.activeFace;
    const wall = this.state.walls[faceId];
    if (!wall) return false;

    const opening = wall.getOpening(openingId);
    if (!opening || opening.locked) return false;

    // Transactional structural geometry mutation safety validation check
    const originalWidth = opening.width;
    const originalHeight = opening.height;
    const originalPosition = opening.position;

    if (properties.width !== undefined) opening.width = Number(properties.width);
    if (properties.height !== undefined) opening.height = Number(properties.height);

    const validatedPos = wall._resolveValidPosition(opening.position, opening.width, openingId, this.ruleContext);

    if (validatedPos !== null) {
      opening.position = validatedPos;
      this.evaluatePricing();
      this.notify('state:updated', this.state);
      return true;
    } else {
      // Revert if mutation breaches geometry bounds
      opening.width = originalWidth;
      opening.height = originalHeight;
      opening.position = originalPosition;
      this.notify('error:action_rejected', { message: 'Sizing adjustment violates boundary or minimum overlap limits.' });
      return false;
    }
  }

  selectOpening(openingId) {
    Object.values(this.state.walls).forEach(wall => {
      wall.openings.forEach(op => {
        if (op.id === openingId) {
          op.select();
        } else {
          op.deselect();
        }
      });
    });
    this.notify('state:updated', this.state);
  }

  clearSelection() {
    Object.values(this.state.walls).forEach(wall => {
      wall.openings.forEach(op => op.deselect());
    });
    this.notify('state:updated', this.state);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(type, payload) {
    this.listeners.forEach(listener => listener({ type, payload, state: this.state }));
  }
}

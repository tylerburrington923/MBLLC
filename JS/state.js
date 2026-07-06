import { Validator, SnapUtility, RuleContext } from './utils.js';

export class OpeningModel {
  constructor(data = {}) {
    this.id = data.id || Math.random().toString(36).substr(2, 9);
    this.type = data.type || 'overhead'; // 'overhead' | 'bifold' | 'slider' | 'walk_door' | 'window'
    this.width = Number(data.width) || 3.0;
    this.height = Number(data.height) || 6.8;
    this.position = Number(data.position) || 0;
    this.selected = !!data.selected;
    this.locked = !!data.locked;
  }

  select() { this.selected = true; }
  deselect() { this.selected = false; }
  lock() { this.locked = true; }
  unlock() { this.locked = false; }
}

export class WallModel {
  constructor(data = {}) {
    this.id = data.id; // 'front' | 'rear' | 'left' | 'right'
    this.orientation = data.orientation; // 'N' | 'S' | 'E' | 'W'
    this.length = Number(data.length) || 40;
    this.height = Number(data.height) || 14;
    this._openings = new Map();

    if (data.openings) {
      data.openings.forEach(op => this.addOpening(op));
    }
  }

  get openings() {
    return Array.from(this._openings.values());
  }

  getOpening(id) {
    return this._openings.get(id);
  }

  addOpening(openingData, context = RuleContext) {
    const opening = openingData instanceof OpeningModel 
      ? openingData 
      : new OpeningModel(openingData);

    const targetPos = this._resolveValidPosition(opening.position, opening.width, null, context);
    if (targetPos === null) return null;

    opening.position = targetPos;
    this._openings.set(opening.id, opening);
    return opening;
  }

  moveOpening(id, requestedPosition, context = RuleContext) {
    const opening = this.getOpening(id);
    if (!opening || opening.locked) return false;

    const targetPos = this._resolveValidPosition(requestedPosition, opening.width, id, context);
    if (targetPos === null) return false;

    opening.position = targetPos;
    return true;
  }

  removeOpening(id) {
    return this._openings.delete(id);
  }

  resize({ length, height }, context = RuleContext) {
    this.length = Number(length) ?? this.length;
    this.height = Number(height) ?? this.height;

    const currentOpenings = this.openings;
    this._openings.clear();

    for (const op of currentOpenings) {
      const targetPos = this._resolveValidPosition(op.position, op.width, null, context);
      if (targetPos !== null) {
        op.position = targetPos;
        this._openings.set(op.id, op);
      }
    }
  }

  _resolveValidPosition(rawPosition, width, excludeId = null, context = RuleContext) {
    let targetPos = SnapUtility.snapToGrid(rawPosition, context.snapIncrement);
    targetPos = SnapUtility.snapToCenter(targetPos, this.length, context.centerSnapThreshold);

    const range = Validator.calculateValidRange(width, this.length, context);
    
    if (targetPos < range.min) targetPos = range.min;
    if (targetPos > range.max) targetPos = range.max;

    if (!Validator.checkCollision(targetPos, width, this.openings, excludeId, context)) {
      return null;
    }

    return targetPos;
  }
}

export class BuildingState {
  constructor(data = {}) {
    this.width = Number(data.width) || 30;
    this.length = Number(data.length) || 40;
    this.height = Number(data.height) || 14;
    
    this.roofColor = data.roofColor || '#334155';
    this.wallColor = data.wallColor || '#475569';
    this.trimColor = data.trimColor || '#1E293B';
    this.wainscot = !!data.wainscot;
    this.wainscotColor = data.wainscotColor || '#1E293B';
    this.interiorLiner = !!data.interiorLiner;
    this.interiorColor = data.interiorColor || '#F8FAFC';
    this.overhang = Number(data.overhang) || 12;
    this.specialNotes = data.specialNotes || '';

    this.activeFace = data.activeFace || 'front'; // 'front' | 'rear' | 'left' | 'right'

    this.walls = {
      front: new WallModel({ id: 'front', orientation: 'S', length: this.width, height: this.height, openings: data.walls?.front?.openings }),
      rear: new WallModel({ id: 'rear', orientation: 'N', length: this.width, height: this.height, openings: data.walls?.rear?.openings }),
      left: new WallModel({ id: 'left', orientation: 'W', length: this.length, height: this.height, openings: data.walls?.left?.openings }),
      right: new WallModel({ id: 'right', orientation: 'E', length: this.length, height: this.height, openings: data.walls?.right?.openings })
    };

    this.pricing = {
      breakdown: [],
      subtotal: 0,
      total: 0
    };
  }

  updateDimensions(width, length, height, context = RuleContext) {
    this.width = Number(width);
    this.length = Number(length);
    this.height = Number(height);

    this.walls.front.resize({ length: this.width, height: this.height }, context);
    this.walls.rear.resize({ length: this.width, height: this.height }, context);
    this.walls.left.resize({ length: this.length, height: this.height }, context);
    this.walls.right.resize({ length: this.length, height: this.height }, context);
  }
}


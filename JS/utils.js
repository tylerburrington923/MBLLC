export const RuleContext = {
  snapIncrement: 1.0,
  cornerMargin: 1.0,
  minSpacing: 2.0,
  centerSnapThreshold: 2.0
};

export class SnapUtility {
  static snapToGrid(position, increment = 1.0) {
    if (!increment || increment <= 0) return position;
    return Math.round(position / increment) * increment;
  }

  static snapToCenter(position, wallLength, threshold = 2.0) {
    const center = wallLength / 2;
    if (Math.abs(position - center) <= threshold) {
      return center;
    }
    return position;
  }
}

export class Validator {
  static calculateValidRange(openingWidth, wallLength, context = RuleContext) {
    const margin = context.cornerMargin ?? 1.0;
    const halfWidth = openingWidth / 2;
    return {
      min: margin + halfWidth,
      max: wallLength - margin - halfWidth
    };
  }

  static checkCollision(position, width, existingOpenings, excludeId = null, context = RuleContext) {
    const minSpacing = context.minSpacing ?? 2.0;
    const halfWidth = width / 2;
    const start = position - halfWidth;
    const end = position + halfWidth;

    for (const op of existingOpenings) {
      if (excludeId && op.id === excludeId) continue;
      
      const opHalfWidth = op.width / 2;
      const opStart = op.position - opHalfWidth;
      const opEnd = op.position + opHalfWidth;

      if (start - minSpacing < opEnd && end + minSpacing > opStart) {
        return false;
      }
    }
    return true;
  }
}

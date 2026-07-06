export function calculateBuildingPricing(buildingState) {
  const breakdown = [];
  
  // 1. Footprint Dimensions Envelope Computations
  const width = buildingState.width;
  const length = buildingState.length;
  const height = buildingState.height;
  const squareFootage = width * length;
  
  // Base shell calculations matching standardized regional post timber frameworks crew indices
  const baseShellPrice = squareFootage * 22.0 + (height - 10) * 1500.0;
  breakdown.push({
    item: `Base Structural Shell (${width}ft x ${length}ft x ${height}ft Frame)`,
    cost: baseShellPrice
  });

  // 2. Structural Exterior Boxed Overhang Surcharge Profiles
  if (buildingState.overhang > 0) {
    const perimeter = 2 * (width + length);
    const overhangCost = perimeter * (buildingState.overhang / 12) * 15.0;
    breakdown.push({
      item: `${buildingState.overhang}-Inch Boxed Eave Overhang Perimeter Assembly`,
      cost: overhangCost
    });
  }

  // 3. Lower Level Wainscot Accent Panel Siding Finishes
  if (buildingState.wainscot) {
    const perimeter = 2 * (width + length);
    const wainscotCost = perimeter * 18.0;
    breakdown.push({
      item: "3ft Structural Metal Wainscot Lower Accent Border Sheet Installation",
      cost: wainscotCost
    });
  }

  // 4. Finished Interior Liner Packages Finishes
  if (buildingState.interiorLiner) {
    const wallArea = 2 * (width + length) * height;
    const ceilingArea = squareFootage; // Approximation matching pitch area indices roughly
    const linerCost = (wallArea + ceilingArea) * 3.50;
    breakdown.push({
      item: "Full Premium Finished Internal Siding Metal Liner Package Shell Layer",
      cost: linerCost
    });
  }

  // 5. Apertures Assembly Spatial Structural Nodes Component Count Calculations
  let openingsCost = 0;
  Object.values(buildingState.walls).forEach(wall => {
    wall.openings.forEach(opening => {
      let unitCost = 0;
      const openingArea = opening.width * opening.height;

      switch (opening.type) {
        case 'overhead':
          unitCost = 1200.0 + openingArea * 25.0;
          break;
        case 'bifold':
          unitCost = 3500.0 + openingArea * 45.0;
          break;
        case 'slider':
          unitCost = 900.0 + openingArea * 15.0;
          break;
        case 'walk_door':
          unitCost = 450.0;
          break;
        case 'window':
          unitCost = 250.0;
          break;
        default:
          unitCost = 300.0;
      }
      openingsCost += unitCost;
    });
  });

  if (openingsCost > 0) {
    breakdown.push({
      item: "Apertures Structural Openings Framing Component Cargo and Fitment Assemblies",
      cost: openingsCost
    });
  }

  // 6. Subtotal and Final Safe Underwriting Summation Line Indices
  const subtotal = breakdown.reduce((sum, current) => sum + current.cost, 0);
  const total = subtotal; // Ready for potential future automated tax matrices or permit overhead values

  return {
    breakdown,
    subtotal,
    total
  };
}


export function calculateMaterialEstimates(buildingState) {
  const width = buildingState.width;
  const length = buildingState.length;
  const height = buildingState.height;
  const overhang = buildingState.overhang;

  // 1. Structural Posts (6x6 Treated Timber Columns spaced roughly on 8ft centers)
  const postsLongWall = (Math.ceil(length / 8) + 1) * 2;
  const postsShortWall = (Math.ceil(width / 8) - 1) * 2;
  const totalPosts = postsLongWall + Math.max(0, postsShortWall);

  // 2. Framing Lumber (Skirt boards, Wall girts at 2ft centers, Roof purlins at 2ft centers)
  const skirtBoards = Math.ceil((2 * (width + length)) / 16) * 3; // 3 rows of 2x6 splash boards
  const wallGirtRows = Math.ceil(height / 2);
  const wallGirts = Math.ceil((2 * (width + length)) / 16) * wallGirtRows;
  
  const roofPerimeterLength = length;
  const slopeFactor = 1.054; // Splayed rafters mapping a 4:12 pitch system roughly
  const roofRafterLength = (width / 2) * slopeFactor;
  const purlinRowsPerSide = Math.ceil(roofRafterLength / 2);
  const roofPurlins = Math.ceil(roofPerimeterLength / 16) * purlinRowsPerSide * 2;

  // 3. Clear Span Roof Engineered Trusses (Placed on 4ft spacing increments standard)
  const structuralTrusses = Math.ceil(length / 4) + 1;

  // 4. Exterior Metal Sheathing Siding and Roof Panel Squares
  const wallSurfaceArea = 2 * (width + length) * height;
  const roofSurfaceArea = 2 * roofPerimeterLength * roofRafterLength;
  
  // Deduct large apertures roughly to optimize material takeoff counts (overhead, bifold, sliders)
  let openingDeductions = 0;
  Object.values(buildingState.walls).forEach(wall => {
    wall.openings.forEach(op => {
      if (op.type !== 'window' && op.type !== 'walk_door') {
        openingDeductions += op.width * op.height;
      }
    });
  });

  const finalNetWallArea = Math.max(0, wallSurfaceArea - openingDeductions);
  const wallMetalPanels12ft = Math.ceil(finalNetWallArea / 36); // Standard 36-inch net coverage sheets
  const roofMetalPanels12ft = Math.ceil(roofSurfaceArea / 36);

  return [
    { category: "Timber Foundation Columns", spec: "6x6 Structural Treated Wood Posts (Structural Embedding Grade)", quantity: totalPosts, unit: "Pcs" },
    { category: "Engineered Clear-Span System", spec: `Custom Engineered 4:12 Pitch Clear-Span Wood Trusses (${width}ft Span)`, quantity: structuralTrusses, unit: "Pcs" },
    { category: "Base Footprint Lumber Protection", spec: "2x6 Treated Ground Splash/Skirt Structural Planks", quantity: skirtBoards, unit: "Pcs" },
    { category: "Framing Shell Timber Components", spec: "2x4 Kiln-Dried Premium Industrial Grade Structural Wall Girts", quantity: wallGirts, unit: "Pcs" },
    { category: "Roof Framing Timber Components", spec: "2x4 Kiln-Dried Premium Structural Roof Purlins Layout Planks", quantity: roofPurlins, unit: "Pcs" },
    { category: "Exterior Protective Cladding", spec: `Premium Weather-Coated 29-Gauge Ribbed Exterior Wall Panels`, quantity: wallMetalPanels12ft, unit: "Linear Sheets" },
    { category: "Roof System Cladding Plates", spec: `Heavy-Duty 29-Gauge Engine Structural Ridge Roof Metal Panels`, quantity: roofMetalPanels12ft, unit: "Linear Sheets" },
    { category: "Trim Details & Assemblies Pack", spec: `Engineered Flash Edges, Universal Ridges, Ridge Caps, Corner Fasteners`, quantity: 1, unit: "Complete Kit Package" }
  ];
}


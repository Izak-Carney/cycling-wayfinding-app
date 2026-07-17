// Coordinates verified against OpenStreetMap (Nominatim/Overpass), not
// estimated, since a wrong pin here sends a visiting rider to the wrong spot.

// The Local Store, 205 N Dewey St, Eau Claire, WI 54701 - Volume One's retail
// space and the e-bike rental pickup/drop-off point. Every route starts and
// ends here.
export const HOME_BASE = {
  name: 'Volume One & The Local Store',
  coords: [-91.4990018, 44.8150014],
}

// Each route's stops were chosen and ordered so the outbound and return legs
// take different streets/trails where possible (checked against BRouter's
// actual routed geometry - a straight there-and-back retraces the same path
// twice, which is exactly what a sightseeing loop should avoid). Metadata
// tags (lengthCategory/hilliness/scenery/trafficComfort) are derived from
// real BRouter output for the exact stop list below - distance in miles,
// elevation gain in feet per mile, and the fraction of the route on
// dedicated trail or on-road bike lane vs. plain roads - not estimated.
export const SIGHTSEEING_ROUTES = [
  {
    name: 'Downtown & Confluence Loop',
    description: 'A short loop past Phoenix Park, North River Fronts Park, and Haymarket Plaza at the confluence.',
    stops: [
      { name: 'Phoenix Park', coords: [-91.502892, 44.8139364] },
      { name: 'North River Fronts Park', coords: [-91.5051767, 44.8215117] },
      { name: 'Haymarket Plaza', coords: [-91.5020704, 44.8116874] },
    ],
    lengthCategory: 'short',
    hilliness: 'flat',
    scenery: 'downtown',
    trafficComfort: 'mostly-trail',
  },
  {
    name: 'River Bluffs Loop',
    description: 'Out along the Chippewa River State Trail to Halfmoon Beach, Carson Park, and Owen Park.',
    stops: [
      { name: 'Halfmoon Beach', coords: [-91.5148664, 44.8139455] },
      { name: 'Carson Park', coords: [-91.5226359, 44.807394] },
      { name: 'Owen Park', coords: [-91.5021981, 44.803707] },
    ],
    lengthCategory: 'medium',
    hilliness: 'flat',
    scenery: 'river',
    trafficComfort: 'mixed',
  },
  {
    name: 'Nature & Overlooks Loop',
    description: 'Riverside Owen Park and the wooded trails of Putnam Park State Natural Area.',
    stops: [
      { name: 'Owen Park', coords: [-91.5021981, 44.803707] },
      { name: 'Putnam Park State Natural Area', coords: [-91.5135595, 44.797802] },
    ],
    lengthCategory: 'medium',
    hilliness: 'rolling',
    scenery: 'nature',
    trafficComfort: 'mixed',
  },
  {
    name: 'East Side & Mount Tom Loop',
    description: "The hilliest option: Boyd Park, the overlook at Mount Tom Park, and North River Fronts Park.",
    stops: [
      { name: 'Boyd Park', coords: [-91.4829567, 44.8135006] },
      { name: 'Mount Tom Park', coords: [-91.4818872, 44.8189405] },
      { name: 'North River Fronts Park', coords: [-91.5051767, 44.8215117] },
    ],
    lengthCategory: 'medium',
    hilliness: 'hilly',
    scenery: 'hills',
    trafficComfort: 'mixed',
  },
  {
    // Eau Claire's answer to the Seven Bridges of Konigsberg: every bridge
    // here was verified (not guessed) to actually cross the Chippewa or Eau
    // Claire River, by intersecting real OSM bridge-way geometry against the
    // real river centerlines - a handful of "bridge=yes" ways near downtown
    // (e.g. Eddy Street, the CVTC Foot Bridge) turned out to cross something
    // else entirely (a pond/side channel 600+ meters from either river) and
    // are excluded. `routePoints` walks each bridge's own two end nodes as a
    // consecutive waypoint pair, so BRouter is forced across the full span
    // rather than merely routed near a point on it.
    //
    // Two rivers, three land regions: the Chippewa runs north-south on the
    // west, the Eau Claire comes in from the east and joins it. That leaves
    // the WEST BANK, the NORTH side (home at 205 N Dewey St, plus Phoenix
    // Park and Riverfront Terrace), and DOWNTOWN/south (Haymarket, Pablo
    // Center, Barstow St). Seven bridges cross the Chippewa (west bank <->
    // east): UW-Eau Claire Footbridge, Water Street, Lake Street, the Grand
    // Avenue Footbridge, the Phoenix Park bridge, Madison Street, and High
    // Bridge. Four cross the Eau Claire (downtown/south <-> north): the
    // Confluence/Haymarket bridge, Barstow, Farwell, and Dewey.
    //
    // Two important bridge IDs were verified against OSM after being
    // mislabeled earlier: the Chippewa crossing at 44.813 (right by Phoenix
    // Park) is the *Phoenix Park* bridge, and the separate Chippewa crossing
    // at 44.810 (by Owen Park / Main St) is the *Grand Avenue Footbridge*.
    // An earlier version had these two names swapped, which is why the
    // confluence area kept backtracking - the fix below was being applied to
    // the wrong bridge.
    //
    // The order that keeps every crossing to a single clean pass (verified
    // leg-by-leg against real routed geometry): Dewey out of home first;
    // Lake crossed early so the long southbound leg doesn't clip it; down the
    // west bank to cross the Water Street bridge heading EAST onto the campus
    // side, then the local-rider connector that BRouter won't find on its own
    // - right on Park Avenue, then right (west) on Garfield and across campus
    // to the foot of the UW-Eau Claire Footbridge, which is then crossed back
    // to the west bank. (Those two Chippewa bridges used to dead-end into a
    // there-and-back; BRouter's trekking profile prefers the shorter path
    // that stops at the footbridge rather than looping through campus, so the
    // one Park Avenue waypoint is needed to pin it to the route a rider
    // actually takes - the ways themselves are all connected and bike-legal.)
    // Then up the west
    // bank over the Phoenix Park bridge and Madison to High (recrossed once,
    // the minimum to fix the odd-vertex parity and turn back south); then the
    // other local-knowledge move - cross the Grand Avenue Footbridge heading
    // EAST, follow the riverside trail north past Haymarket Plaza, and cross
    // the Confluence/Haymarket bridge from the SOUTH - then Barstow and
    // Farwell back to home. Every bridge is crossed exactly once except High.
    name: 'Bridges of Eau Claire Loop',
    description:
      "An homage to the Seven Bridges of Konigsberg: every real Chippewa and Eau Claire River crossing downtown, each crossed exactly once, with only High Bridge deliberately recrossed to close the loop.",
    stops: [
      { name: 'Dewey Street Bridge', coords: [-91.498732, 44.813838] },
      { name: 'Lake Street Bridge', coords: [-91.499133, 44.807865] },
      { name: 'Water Street Bridge', coords: [-91.499092, 44.801628] },
      { name: 'UW-Eau Claire Footbridge', coords: [-91.500735, 44.800154] },
      { name: 'Phoenix Park Trail Bridge', coords: [-91.505446, 44.813074] },
      { name: 'Madison Street Bridge', coords: [-91.506941, 44.815783] },
      { name: 'High Bridge', coords: [-91.509369, 44.824689] },
      { name: 'Grand Avenue Footbridge', coords: [-91.501825, 44.809927] },
      { name: 'Haymarket Plaza', coords: [-91.5020704, 44.8116874] },
      { name: 'Confluence Trail Bridge', coords: [-91.502324, 44.812731] },
      { name: 'Barstow Street Bridge', coords: [-91.501085, 44.813221] },
      { name: 'Farwell Street Bridge', coords: [-91.499816, 44.813593] },
    ],
    routePoints: [
      [-91.4988686, 44.8141129], // Dewey N -> home side
      [-91.4985961, 44.8135624], // Dewey S -> downtown
      [-91.498624, 44.8080725], // Lake E (crossed early to avoid clipping it later)
      [-91.4996427, 44.8076572], // Lake W -> west bank
      [-91.5004492, 44.8018619], // Water St W
      [-91.497734, 44.8013943], // Water St E (crossed EAST onto the campus side)
      [-91.49642, 44.80114], // right onto Park Ave (Park Ave / Summit jct)
      [-91.500324, 44.7994366], // right onto Garfield, west across campus to the UWEC footbridge foot
      [-91.5011452, 44.8008713], // cross the UWEC Footbridge back to the west bank
      [-91.5064154, 44.8128518], // Phoenix Park bridge W
      [-91.5044767, 44.8132966], // Phoenix Park bridge E -> north side
      [-91.5056575, 44.8159331], // Madison E
      [-91.508225, 44.815632], // Madison W
      [-91.5110955, 44.8244943], // High W
      [-91.5076421, 44.8248835], // High E
      [-91.5076421, 44.8248835], // High E (recross to turn back south)
      [-91.5110955, 44.8244943], // High W
      [-91.5028586, 44.8096088], // Grand Avenue Footbridge W
      [-91.5007918, 44.8102455], // Grand Avenue Footbridge E (crossed EAST)
      [-91.5021226, 44.8124811], // Confluence S (trail north past Haymarket, cross from south)
      [-91.5025259, 44.8129805], // Confluence N
      [-91.5011372, 44.8134594], // Barstow N
      [-91.5010337, 44.8129817], // Barstow S
      [-91.499739, 44.8132955], // Farwell S
      [-91.4998927, 44.8138897], // Farwell N -> home
    ],
    lengthCategory: 'long',
    hilliness: 'flat',
    scenery: 'bridges',
    trafficComfort: 'mixed',
  },
  {
    name: 'Grand Tour',
    description: 'The full sightseeing circuit: Cameron Park, Halfmoon Beach, Carson Park, Putnam Park, Owen Park, and Randall Park.',
    stops: [
      { name: 'Cameron Park', coords: [-91.5230236, 44.8154409] },
      { name: 'Halfmoon Beach', coords: [-91.5148664, 44.8139455] },
      { name: 'Carson Park', coords: [-91.5226359, 44.807394] },
      { name: 'Putnam Park State Natural Area', coords: [-91.5135595, 44.797802] },
      { name: 'Owen Park', coords: [-91.5021981, 44.803707] },
      { name: 'Randall Park', coords: [-91.5066906, 44.8045763] },
    ],
    lengthCategory: 'long',
    hilliness: 'rolling',
    scenery: 'mix',
    trafficComfort: 'mixed',
  },
]

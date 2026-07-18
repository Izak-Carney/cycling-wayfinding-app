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
    // real river centerlines. `routePoints` walks each bridge's own two end
    // nodes as a consecutive waypoint pair, so BRouter is forced across the
    // full span rather than merely routed near a point on it.
    //
    // Two rivers, three land regions: the Chippewa runs north-south on the
    // west, the Eau Claire comes in from the east and joins it. That leaves
    // the WEST BANK, the NORTH side (home at 205 N Dewey St, plus Phoenix
    // Park and Riverfront Terrace), and DOWNTOWN/south (Haymarket, Pablo
    // Center, Barstow St). This loop rides ten bridges. Six cross the
    // Chippewa: the UW-Eau Claire Footbridge, Water Street, Lake Street, and
    // the Grand Avenue Footbridge (west bank <-> south), plus the Phoenix
    // Park bridge and High Bridge (west bank <-> north). Four cross the Eau
    // Claire (north <-> south): the Confluence/Haymarket bridge, Barstow,
    // Dewey, and the S Bridge.
    //
    // Two downtown street crossings that aren't much fun on a bike were left
    // out. Madison Street (a Chippewa west<->north crossing) is dropped
    // entirely, and Farwell Street is replaced by the S Bridge - the wooden
    // pedestrian/cycle bridge (OSM way 86479569, highway=cycleway, reached by
    // dedicated trail on both banks) about a quarter mile up the Eau Claire
    // River. This also makes the Konigsberg parity work FOR the rider. With
    // all eleven bridges, the west bank and the north side each had an odd
    // number of crossings (7), so no Eulerian circuit was possible and the
    // route had to double back over High Bridge once just to fix the parity
    // and turn south. Dropping Madison takes both the west bank and the north
    // side to an even 6 (south stays at 8), so every land region is now
    // even-degree: a true Eulerian circuit exists from home, every bridge
    // crossed exactly once, no High Bridge double-back. Swapping Farwell for
    // the S Bridge is a like-for-like north<->south Eau Claire crossing, so it
    // leaves the parity untouched.
    //
    // The order that keeps every crossing to a single clean pass (verified
    // leg-by-leg against real BRouter trekking geometry - the routed line
    // crosses the two rivers exactly ten times, once at each bridge, and
    // never at Madison or Farwell). The subtlety is the Eau Claire's south
    // bank: it is NOT continuous for bikes across the downtown mouth
    // (Haymarket / Pablo Center), so the two downtown crossings (Confluence,
    // Barstow) must be ridden as their own pair near the mouth, while the two
    // eastern crossings (Dewey, the S Bridge) are ridden as a separate loop
    // farther east - out on the south-bank cycleway, back on the Old Abe State
    // Trail. Mixing the two (e.g. routing Barstow's south end straight to the
    // S Bridge) forces BRouter to double back over Barstow to get around the
    // gap; keeping them separate is what this ordering is for.
    //
    // Barstow out of home first (north->south) into downtown; south down the
    // east bank and across Lake Street (south->west); down the west bank over
    // Water Street heading EAST onto the campus side, then the local-rider
    // connector BRouter won't find on its own - right on Park Avenue, then
    // right (west) on Garfield across campus to the foot of the UW-Eau Claire
    // Footbridge, crossed back to the west bank. (BRouter's trekking profile
    // prefers the shorter path that stops at the footbridge rather than
    // looping through campus, so the one Park Avenue waypoint pins it to the
    // route a rider actually takes - the ways are all connected and
    // bike-legal.) Up the Chippewa River State Trail over the Phoenix Park
    // bridge (west->north), then north up the EAST bank on cycleway and quiet
    // residential streets to High Bridge, crossed once (north->west) - the
    // loop climbs the east side and returns down the west side instead of
    // doubling back. Down the west-bank trail over the Grand Avenue Footbridge
    // heading EAST into downtown, then north past Haymarket Plaza to cross the
    // Confluence bridge from the SOUTH. Then the clean eastern loop: east
    // along the north bank to Dewey, across it (north->south), east on the
    // south-bank cycleway to the S Bridge, across it (south->north), and home
    // on the Old Abe State Trail. Every bridge is crossed exactly once.
    name: 'Bridges of Eau Claire Loop',
    description:
      'An homage to the Seven Bridges of Konigsberg: a single clean loop over ten downtown river crossings, each ridden exactly once. Skips the traffic of the Madison Street bridge and trades Farwell Street for the S Bridge, the wooden bike-and-foot bridge a quarter mile up the Eau Claire River.',
    stops: [
      { name: 'Barstow Street Bridge', coords: [-91.501085, 44.813221] },
      { name: 'Lake Street Bridge', coords: [-91.499133, 44.807865] },
      { name: 'Water Street Bridge', coords: [-91.499092, 44.801628] },
      { name: 'UW-Eau Claire Footbridge', coords: [-91.500735, 44.800154] },
      { name: 'Phoenix Park Trail Bridge', coords: [-91.505446, 44.813074] },
      { name: 'High Bridge', coords: [-91.509369, 44.824689] },
      { name: 'Grand Avenue Footbridge', coords: [-91.501825, 44.809927] },
      { name: 'Haymarket Plaza', coords: [-91.5020704, 44.8116874] },
      { name: 'Confluence Trail Bridge', coords: [-91.502324, 44.812731] },
      { name: 'Dewey Street Bridge', coords: [-91.498732, 44.813838] },
      { name: 'S Bridge', coords: [-91.4939491, 44.8141213] },
    ],
    routePoints: [
      [-91.5011372, 44.8134594], // Barstow N -> home side
      [-91.5010337, 44.8129817], // Barstow S -> downtown (crossed north->south)
      [-91.498624, 44.8080725], // south down the east bank to Lake E
      [-91.4996427, 44.8076572], // Lake W (crossed south->west onto the west bank)
      [-91.5004492, 44.8018619], // south down the west bank to Water St W
      [-91.497734, 44.8013943], // Water St E (crossed EAST onto the campus side)
      [-91.49642, 44.80114], // right onto Park Ave (Park Ave / Summit jct)
      [-91.500324, 44.7994366], // right onto Garfield, west across campus to the UWEC footbridge foot
      [-91.5011452, 44.8008713], // cross the UWEC Footbridge back to the west bank
      [-91.5064154, 44.8128518], // up the Chippewa River State Trail to Phoenix Park bridge W
      [-91.5044767, 44.8132966], // Phoenix Park bridge E -> north side
      [-91.5076421, 44.8248835], // north up the EAST bank to High Bridge E
      [-91.5110955, 44.8244943], // High W (crossed once, north->west; no double-back)
      [-91.5028586, 44.8096088], // down the west-bank trail to Grand Avenue Footbridge W
      [-91.5007918, 44.8102455], // Grand Avenue Footbridge E (crossed EAST into downtown)
      [-91.5021226, 44.8124811], // Confluence S (trail north past Haymarket, cross from south)
      [-91.5025259, 44.8129805], // Confluence N -> north side
      [-91.4988686, 44.8141129], // east along the north bank (Old Abe Trail) to Dewey N
      [-91.4985961, 44.8135624], // Dewey S (crossed north->south onto the south-bank cycleway)
      [-91.4946902, 44.8136808], // east on the south-bank cycleway to the S Bridge S
      [-91.493208, 44.8145618], // S Bridge N -> home on the Old Abe State Trail
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

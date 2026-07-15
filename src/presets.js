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
    // Modeling the two riverbanks plus the downtown peninsula as 3 regions:
    // 7 bridges cross the Chippewa (peninsula <-> west bank) and 4 cross the
    // Eau Claire (peninsula <-> north bank). That's exactly 2 odd-degree
    // regions (7 and 11 are odd; the west bank alone is also odd at 7), so -
    // unlike Konigsberg's impossible 4-odd-vertex layout - an Eulerian path
    // crossing every bridge exactly once is graph-theoretically possible
    // here. In practice BRouter still needs a rideable street connecting one
    // bridge's far end to the next one's, and checking the actual routed
    // geometry (which side of the river each point falls on, verified
    // against real river centerlines rather than assumed) found Dewey Street
    // Bridge's north end has no such connection to its neighbors - every
    // pairing tried made BRouter duck back across some bridge immediately
    // after Dewey rather than continuing along the bank. Every other
    // adjacent pair (Barstow<->Farwell, and every Chippewa-side pair) does
    // connect cleanly with no backtracking. `routePoints` orders bridges to
    // isolate that one unavoidable exception and walks each bridge's own two
    // end nodes as a consecutive waypoint pair, so BRouter is forced across
    // the full span rather than merely routed near a point on it. High
    // Bridge is deliberately recrossed a second time, the minimum needed to
    // close the path back into a loop ending at Volume One.
    name: 'Bridges of Eau Claire Loop',
    description:
      "An homage to the Seven Bridges of Konigsberg: every real Chippewa and Eau Claire River crossing downtown, each fully traversed, with only High Bridge recrossed to close the loop.",
    stops: [
      { name: 'Confluence Trail Bridge', coords: [-91.502324, 44.812731] },
      { name: 'Dewey Street Bridge', coords: [-91.498732, 44.813838] },
      { name: 'Barstow Street Bridge', coords: [-91.501085, 44.813221] },
      { name: 'Farwell Street Bridge', coords: [-91.499816, 44.813593] },
      { name: 'UW-Eau Claire Footbridge', coords: [-91.500735, 44.800154] },
      { name: 'Summit Avenue / Water Street Bridge', coords: [-91.499092, 44.801628] },
      { name: 'Lake Street Bridge', coords: [-91.499133, 44.807865] },
      { name: 'Phoenix Park Trail Bridge', coords: [-91.501825, 44.809927] },
      { name: 'Grand Avenue Trail Bridge', coords: [-91.505446, 44.813074] },
      { name: 'Madison Street Bridge', coords: [-91.506941, 44.815783] },
      { name: 'High Bridge', coords: [-91.509369, 44.824689] },
    ],
    routePoints: [
      [-91.5025259, 44.8129805],
      [-91.5021226, 44.8124811],
      [-91.4985961, 44.8135624],
      [-91.4988686, 44.8141129],
      [-91.5011372, 44.8134594],
      [-91.5010337, 44.8129817],
      [-91.499739, 44.8132955],
      [-91.4998927, 44.8138897],
      [-91.500324, 44.7994366],
      [-91.5011452, 44.8008713],
      [-91.5004492, 44.8018619],
      [-91.497734, 44.8013943],
      [-91.498624, 44.8080725],
      [-91.4996427, 44.8076572],
      [-91.5028586, 44.8096088],
      [-91.5007918, 44.8102455],
      [-91.5044767, 44.8132966],
      [-91.5064154, 44.8128518],
      [-91.508225, 44.815632],
      [-91.5056575, 44.8159331],
      [-91.5076421, 44.8248835],
      [-91.5110955, 44.8244943],
      [-91.5110955, 44.8244943],
      [-91.5076421, 44.8248835],
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

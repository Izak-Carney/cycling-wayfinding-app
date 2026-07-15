export const QUIZ_QUESTIONS = [
  {
    key: 'length',
    question: 'How far do you want to ride?',
    options: [
      { value: 'short', label: 'Short (~2 miles)' },
      { value: 'medium', label: 'Medium (~4-5 miles)' },
      { value: 'long', label: 'Long (~7+ miles)' },
    ],
  },
  {
    key: 'hilliness',
    question: 'How hilly do you want it?',
    options: [
      { value: 'flat', label: 'Flat and easy' },
      { value: 'rolling', label: 'Some rolling hills' },
      { value: 'hilly', label: 'Bring on the hills' },
    ],
  },
  {
    key: 'scenery',
    question: 'What do you want to see most?',
    options: [
      { value: 'downtown', label: 'Historic downtown' },
      { value: 'river', label: 'Rivers, lakes & beaches' },
      { value: 'nature', label: 'Woods & nature trails' },
      { value: 'hills', label: 'Hilltop overlooks' },
      { value: 'bridges', label: 'Bridges & river crossings' },
      { value: 'mix', label: 'A bit of everything' },
    ],
  },
  {
    key: 'trafficComfort',
    question: 'How comfortable are you riding near car traffic?',
    options: [
      { value: 'mostly-trail', label: "I'd rather stick to dedicated trails" },
      { value: 'mixed', label: "Bike lanes and quiet streets are fine" },
    ],
  },
]

// answers: { length, hilliness, scenery, trafficComfort }. Each route's
// metadata (see presets.js) was derived from real routed distance/elevation/
// surface data, so this is matching against measured values, not guesses.
export function recommendRoute(answers, routes) {
  let best = routes[0]
  let bestScore = -Infinity

  for (const route of routes) {
    let score = 0
    if (route.lengthCategory === answers.length) score += 3
    if (route.hilliness === answers.hilliness) score += 3
    if (route.scenery === answers.scenery || answers.scenery === 'mix') score += 2
    if (route.trafficComfort === answers.trafficComfort) score += 1

    if (score > bestScore) {
      bestScore = score
      best = route
    }
  }

  return best
}

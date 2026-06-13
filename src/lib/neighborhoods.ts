export const CA_NEIGHBORHOODS: Record<string, string[]> = {
  "90011": ["Downtown LA", "Fashion District"],
  "90026": ["Echo Park", "Silver Lake"],
  "90037": ["South LA", "Exposition Park"],
  "90210": ["Beverly Hills", "Golden Triangle"],
  "94601": ["Fruitvale", "Jingletown"],
  "94607": ["West Oakland", "Prescott"],
  "94102": ["Tenderloin", "Civic Center"],
  "94110": ["Mission District", "Bernal Heights"],
  "92101": ["Downtown SD", "East Village"],
  "92104": ["North Park", "South Park"],
  "90802": ["Downtown Long Beach", "Waterfront"],
  "91101": ["Old Pasadena", "Playhouse District"],
  "92701": ["Civic Center", "French Park"],
  "94704": ["South Berkeley", "UC Berkeley"],
  "92501": ["Downtown Riverside", "Wood Streets"],
  "95112": ["Japantown", "Rose Garden"],
  "90004": ["Koreatown", "Wilshire Center"],
  "94612": ["Lake Merritt", "Grand Lake"],
  "90301": ["Morningside Park", "Downtown Inglewood"],
  "95814": ["Midtown", "Capitol Mall"],
  "92805": ["Anaheim Colony", "Platinum Triangle"],
  "93721": ["Tower District", "Civic Center"],
  "95202": ["Waterfront", "Miracle Mile"],
  "93301": ["Downtown", "Oleander"],
  "94122": ["Sunset District", "Parkside"],
  "90032": ["El Sereno", "City Terrace"],
  "93001": ["Avenue District", "Westside"],
  "95354": ["College Area", "Downtown Modesto"],
};

export const DEFAULT_NEIGHBORHOODS = [
  "Downtown",
  "Midtown",
  "Westside",
  "Eastside",
  "Southside",
];

export const CA_TRANSIT_OPTIONS = [
  "BART",
  "LA Metro",
  "Muni",
  "Caltrain",
  "Bus Line",
  "Clinic nearby",
  "Food bank nearby",
];

export function neighborhoodsForZip(zipCode: string): string[] {
  if (zipCode.length === 5 && CA_NEIGHBORHOODS[zipCode]) {
    return CA_NEIGHBORHOODS[zipCode];
  }
  return DEFAULT_NEIGHBORHOODS;
}

export interface LatLng {
  lat: number;
  lng: number;
}

const CITY_COORDS: Record<string, LatLng> = {
  // Ontario
  "toronto": { lat: 43.6532, lng: -79.3832 },
  "ottawa": { lat: 45.4215, lng: -75.6972 },
  "mississauga": { lat: 43.5890, lng: -79.6441 },
  "brampton": { lat: 43.7315, lng: -79.7624 },
  "hamilton": { lat: 43.2557, lng: -79.8711 },
  "london": { lat: 42.9849, lng: -81.2453 },
  "markham": { lat: 43.8561, lng: -79.3370 },
  "vaughan": { lat: 43.8361, lng: -79.4981 },
  "kitchener": { lat: 43.4516, lng: -80.4925 },
  "windsor": { lat: 42.3149, lng: -83.0364 },
  "richmond hill": { lat: 43.8828, lng: -79.4403 },
  "oakville": { lat: 43.4675, lng: -79.6877 },
  "burlington": { lat: 43.3255, lng: -79.7990 },
  "oshawa": { lat: 43.8971, lng: -78.8658 },
  "barrie": { lat: 44.3894, lng: -79.6903 },
  "st. catharines": { lat: 43.1594, lng: -79.2469 },
  "cambridge": { lat: 43.3600, lng: -80.3123 },
  "kingston": { lat: 44.2312, lng: -76.4860 },
  "guelph": { lat: 43.5448, lng: -80.2482 },
  "thunder bay": { lat: 48.3809, lng: -89.2477 },
  "waterloo": { lat: 43.4668, lng: -80.5164 },
  "sudbury": { lat: 46.4917, lng: -80.9930 },
  "greater sudbury": { lat: 46.4917, lng: -80.9930 },
  "peterborough": { lat: 44.3091, lng: -78.3197 },
  "brantford": { lat: 43.1394, lng: -80.2644 },
  "north bay": { lat: 46.3091, lng: -79.4608 },
  "sault ste. marie": { lat: 46.5136, lng: -84.3358 },

  // British Columbia
  "vancouver": { lat: 49.2827, lng: -123.1207 },
  "surrey": { lat: 49.1913, lng: -122.8490 },
  "burnaby": { lat: 49.2488, lng: -122.9805 },
  "richmond": { lat: 49.1666, lng: -123.1336 },
  "kelowna": { lat: 49.8880, lng: -119.4960 },
  "abbotsford": { lat: 49.0504, lng: -122.3045 },
  "coquitlam": { lat: 49.2838, lng: -122.7932 },
  "langley": { lat: 49.1044, lng: -122.6604 },
  "saanich": { lat: 48.4870, lng: -123.3700 },
  "victoria": { lat: 48.4284, lng: -123.3656 },
  "nanaimo": { lat: 49.1659, lng: -123.9401 },
  "kamloops": { lat: 50.6745, lng: -120.3273 },
  "chilliwack": { lat: 49.1579, lng: -121.9514 },
  "prince george": { lat: 53.9169, lng: -122.7494 },
  "delta": { lat: 49.0847, lng: -123.0579 },

  // Alberta
  "calgary": { lat: 51.0447, lng: -114.0719 },
  "edmonton": { lat: 53.5461, lng: -113.4938 },
  "red deer": { lat: 52.2681, lng: -113.8112 },
  "lethbridge": { lat: 49.6956, lng: -112.8451 },
  "st. albert": { lat: 53.6341, lng: -113.6253 },
  "medicine hat": { lat: 50.0405, lng: -110.6764 },
  "grande prairie": { lat: 55.1707, lng: -118.7956 },
  "airdrie": { lat: 51.2917, lng: -114.0144 },

  // Quebec
  "montreal": { lat: 45.5017, lng: -73.5673 },
  "québec city": { lat: 46.8139, lng: -71.2080 },
  "quebec city": { lat: 46.8139, lng: -71.2080 },
  "laval": { lat: 45.5669, lng: -73.6920 },
  "gatineau": { lat: 45.4765, lng: -75.7013 },
  "longueuil": { lat: 45.5312, lng: -73.5185 },
  "sherbrooke": { lat: 45.4042, lng: -71.8929 },
  "saguenay": { lat: 48.4267, lng: -71.0674 },
  "lévis": { lat: 46.8032, lng: -71.1773 },
  "trois-rivières": { lat: 46.3432, lng: -72.5418 },

  // Manitoba
  "winnipeg": { lat: 49.8951, lng: -97.1384 },
  "brandon": { lat: 49.8485, lng: -99.9501 },
  "steinbach": { lat: 49.5257, lng: -96.6847 },

  // Saskatchewan
  "saskatoon": { lat: 52.1332, lng: -106.6700 },
  "regina": { lat: 50.4452, lng: -104.6189 },
  "prince albert": { lat: 53.2033, lng: -105.7531 },
  "moose jaw": { lat: 50.3930, lng: -105.5522 },

  // Nova Scotia
  "halifax": { lat: 44.6488, lng: -63.5752 },
  "cape breton": { lat: 46.1368, lng: -60.1942 },
  "sydney": { lat: 46.1368, lng: -60.1942 },
  "truro": { lat: 45.3647, lng: -63.2800 },

  // New Brunswick
  "moncton": { lat: 46.0878, lng: -64.7782 },
  "saint john": { lat: 45.2733, lng: -66.0633 },
  "fredericton": { lat: 45.9636, lng: -66.6431 },

  // Prince Edward Island
  "charlottetown": { lat: 46.2382, lng: -63.1311 },

  // Newfoundland and Labrador
  "st. john's": { lat: 47.5615, lng: -52.7126 },
  "corner brook": { lat: 48.9510, lng: -57.9534 },

  // Northwest Territories
  "yellowknife": { lat: 62.4540, lng: -114.3718 },

  // Yukon
  "whitehorse": { lat: 60.7212, lng: -135.0568 },

  // Nunavut
  "iqaluit": { lat: 63.7467, lng: -68.5170 },
};

const PROVINCE_CENTROIDS: Record<string, LatLng> = {
  ON: { lat: 50.0, lng: -85.0 },
  BC: { lat: 53.7267, lng: -127.6476 },
  AB: { lat: 53.9333, lng: -116.5765 },
  QC: { lat: 52.9399, lng: -73.5491 },
  MB: { lat: 53.7609, lng: -98.8139 },
  SK: { lat: 52.9399, lng: -106.4509 },
  NS: { lat: 44.6820, lng: -63.7443 },
  NB: { lat: 46.5653, lng: -66.4619 },
  PE: { lat: 46.2382, lng: -63.1311 },
  NL: { lat: 53.1355, lng: -57.6604 },
  NT: { lat: 64.8255, lng: -124.8457 },
  YT: { lat: 64.2823, lng: -135.0000 },
  NU: { lat: 70.2998, lng: -83.1076 },
};

function jitter(value: number, amount = 0.12): number {
  return value + (Math.random() - 0.5) * amount;
}

export function geocodeJob(location: string, province: string): LatLng {
  const normalized = location.toLowerCase().trim();

  const exact = CITY_COORDS[normalized];
  if (exact) {
    return { lat: jitter(exact.lat, 0.08), lng: jitter(exact.lng, 0.1) };
  }

  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return { lat: jitter(coords.lat, 0.08), lng: jitter(coords.lng, 0.1) };
    }
  }

  const provinceFallback = PROVINCE_CENTROIDS[province.toUpperCase()];
  if (provinceFallback) {
    return { lat: jitter(provinceFallback.lat, 1.5), lng: jitter(provinceFallback.lng, 2.0) };
  }

  return { lat: jitter(56.1304, 3), lng: jitter(-106.3468, 4) };
}

export function isPointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  let inside = false;
  const { lat: y, lng: x } = point;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function haversineDistance(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const ac =
    sinDLat * sinDLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinDLng *
      sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(ac), Math.sqrt(1 - ac));
}

export function validKoreaCoordinate(lat: unknown, lng: unknown): lat is number {
 return typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng) && lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132;
}

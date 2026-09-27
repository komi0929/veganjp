const STORAGE_KEY = 'vegan_jp_saved_places';

export function getSavedPlaceIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleSavePlaceId(googlePlaceId: string): boolean {
  const ids = getSavedPlaceIds();
  const index = ids.indexOf(googlePlaceId);
  let saved = false;
  if (index >= 0) {
    ids.splice(index, 1);
    saved = false;
  } else {
    ids.push(googlePlaceId);
    saved = true;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event('vegan_jp_saved_changed'));
  return saved;
}

export function isPlaceSaved(googlePlaceId: string): boolean {
  return getSavedPlaceIds().includes(googlePlaceId);
}

const STORAGE_KEY = 'vegan_jp_my_posts';

export function getMyPostIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addMyPostId(postId: string): void {
  const ids = getMyPostIds();
  ids.push(postId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function isMyPost(postId: string): boolean {
  return getMyPostIds().includes(postId);
}

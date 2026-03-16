const rawBase = import.meta.env.VITE_API_URL?.trim() || '';

export function apiUrl(path: string): string {
  if (!path.startsWith('/')) {
    throw new Error(`apiUrl expected a path starting with "/". Got: ${path}`);
  }

  if (!rawBase) {
    return path;
  }

  const base = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;
  return `${base}${path}`;
}

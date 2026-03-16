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

export function apiStreamUrl(path: string): string {
  return apiUrl(path);
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(apiUrl(path), {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

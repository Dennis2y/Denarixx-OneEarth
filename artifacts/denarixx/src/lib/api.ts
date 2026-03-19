const rawBase = import.meta.env.VITE_API_URL?.trim() || "";

const AUTH_TOKEN_KEY = "denarixx_auth_token";

export function apiUrl(path: string): string {
  if (!path.startsWith("/")) {
    throw new Error(`apiUrl expected a path starting with "/". Got: ${path}`);
  }

  if (!rawBase) return path;

  const base = rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase;
  return `${base}${path}`;
}

export function apiStreamUrl(path: string): string {
  return apiUrl(path);
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  try {
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    else localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {}
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getAuthToken();

  const response = await fetch(apiUrl(path), {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload
        ? String(
            (payload as Record<string, unknown>).error ||
              (payload as Record<string, unknown>).message ||
              `API error ${response.status}`
          )
        : `API error ${response.status}`;

    throw new Error(message);
  }

  return payload;
}

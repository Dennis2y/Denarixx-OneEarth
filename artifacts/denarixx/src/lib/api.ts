const rawBase = import.meta.env.VITE_API_URL?.trim() || "";

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

export async function apiFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(apiUrl(path), {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
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

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function getPage() {
  try {
    const response = await fetch(`${API}/content/public/home`, {
      next: { revalidate: 5 },
    });

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export async function adminFetch(
  path: string,
  token: string,
  init: RequestInit = {},
) {
  return fetch(`${API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
}

export const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  quote: string | null;
  photoUrl: string;
  xUrl: string | null;
  dribbbleUrl: string | null;
  linkedinUrl: string | null;
  sortOrder: number;
};

export async function getPage() {
  try {
    const response = await fetch(`${API}/content/public/home`, {
      cache: 'no-store',
    });

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export async function getTeam(): Promise<TeamMember[]> {
  try {
    const response = await fetch(`${API}/team`, {
      cache: 'no-store',
    });

    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
}

export async function adminFetch(
  path: string,
  token: string,
  init: RequestInit = {},
) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
  if (response.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    window.location.reload();
    throw new Error('Session expired');
  }
  return response;
}

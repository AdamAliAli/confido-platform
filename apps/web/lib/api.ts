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

// Shared pages reuse enabled homepage content without exposing admin endpoints.
export async function getHomeBlocks(): Promise<Record<string, Record<string, unknown>>> {
  try {
    const page = await getPage();
    const blocks = Array.isArray(page?.blocks) ? page.blocks : [];
    return Object.fromEntries(blocks
      .filter((block: { type?: unknown; enabled?: boolean }) => block && typeof block.type === 'string' && block.enabled !== false)
      .map((block: { type: string; data?: unknown }) => [block.type, block.data && typeof block.data === 'object' && !Array.isArray(block.data) ? block.data : {}]));
  } catch {
    return {};
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

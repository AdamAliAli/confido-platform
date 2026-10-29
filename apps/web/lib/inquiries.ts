export const INQUIRY_INTERESTS = ['Social Media Management', 'Brand Strategy', 'Positioning', 'Brand Systems', 'Something else'] as const;
export type Inquiry = { id: string; email: string; phone: string | null; interest: string; message: string; read: boolean; createdAt: string };

// This only controls the UI; the API enforces the actual delete permission.
export function canDeleteInquiry(token: string): boolean {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '='))).role === 'ADMIN';
  } catch { return false; }
}

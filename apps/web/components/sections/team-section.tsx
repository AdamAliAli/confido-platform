import type { TeamMember } from '@/lib/api';
import { TeamSlider } from './team-slider';
import { text } from '@/lib/media-url';

export function TeamSection({ members, data = {} }: { members: TeamMember[]; data?: Record<string, unknown> }) {
  if (members.length === 0) return null;

  return <TeamSlider members={members} label={text(data.label, 'TEAM MEMBERS')} />;
}

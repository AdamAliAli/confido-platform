import type { TeamMember } from '@/lib/api';
import { TeamSlider } from './team-slider';

export function TeamSection({ members }: { members: TeamMember[] }) {
  if (members.length === 0) return null;

  return <TeamSlider members={members} />;
}

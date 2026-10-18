import { getTeam } from '@/lib/api';
import { TeamSlider } from './team-slider';

export async function TeamSection() {
  const members = await getTeam();

  if (members.length === 0) return null;

  return <TeamSlider members={members} />;
}

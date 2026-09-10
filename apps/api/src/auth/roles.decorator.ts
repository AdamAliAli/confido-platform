import { SetMetadata } from '@nestjs/common'; export type Role='ADMIN'|'EDITOR'; export const ROLES_KEY='roles'; export const Roles=(...roles:Role[])=>SetMetadata(ROLES_KEY,roles);

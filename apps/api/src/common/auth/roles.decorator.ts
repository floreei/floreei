import type { Role } from "@sistema-flores/types";
import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = "roles";

/** Restringe a rota aos papéis informados (usar com RolesGuard). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

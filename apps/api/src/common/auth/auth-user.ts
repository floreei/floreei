import type { Role } from "@sistema-flores/types";

/** Identidade autenticada anexada à requisição pelo FirebaseAuthGuard. */
export interface AuthUser {
  id: string;
  companyId: string;
  email: string;
  role: Role;
}

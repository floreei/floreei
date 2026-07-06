import type { Feature, Role } from "@sistema-flores/types";

/** Identidade autenticada anexada à requisição pelo FirebaseAuthGuard. */
export interface AuthUser {
  id: string;
  companyId: string;
  email: string;
  role: Role;
  /** Features liberadas para a empresa (resolvidas no guard). */
  features: Feature[];
}

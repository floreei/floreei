import type { PublicUser } from "@sistema-flores/types";
import { UserEntity } from "../infrastructure/user.entity";

/** Converte a entidade de usuário para a representação pública (sem segredos). */
export function toPublicUser(user: UserEntity): PublicUser {
  return {
    id: user.id,
    companyId: user.companyId,
    name: user.name,
    email: user.email,
    role: user.role,
    pending: !user.firebaseUid,
  };
}

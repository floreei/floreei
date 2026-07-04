import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { FirebaseIdentity } from "./firebase-token.guard";

/** Injeta a identidade do Firebase (req.firebaseToken) validada pelo guard. */
export const FirebaseToken = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): FirebaseIdentity => {
    return ctx
      .switchToHttp()
      .getRequest<{ firebaseToken: FirebaseIdentity }>().firebaseToken;
  },
);

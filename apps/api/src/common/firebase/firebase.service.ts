import { Injectable } from "@nestjs/common";
import { App, getApps, initializeApp } from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";
import {
  firebaseAppOptions,
  firebaseWebApiKey,
  hasFirebaseAdminCredentials,
} from "./firebase-options";

const IDENTITY_URL = "https://identitytoolkit.googleapis.com/v1";

interface CreateAuthUserInput {
  email: string;
  password: string;
  displayName?: string;
}

/**
 * Inicializa e expõe o Firebase Admin SDK (sempre o projeto real, sem emulador).
 * `verifyIdToken` funciona só com o `projectId`; criar/apagar usuário usa o Admin
 * SDK quando há service account, ou o Identity Toolkit REST (apiKey pública) caso
 * contrário — a mesma capacidade do cadastro self-service.
 */
@Injectable()
export class FirebaseService {
  private readonly app: App;

  constructor() {
    this.app = getApps()[0] ?? initializeApp(firebaseAppOptions());
  }

  auth(): Auth {
    return getAuth(this.app);
  }

  /** Cria um usuário de e-mail/senha e devolve o uid. */
  async createAuthUser(input: CreateAuthUserInput): Promise<{ uid: string }> {
    if (hasFirebaseAdminCredentials()) {
      const created = await this.auth().createUser(input);
      return { uid: created.uid };
    }
    return this.restSignUp(input);
  }

  /**
   * Remove um usuário do Firebase. Com service account usa o Admin SDK; sem ela é
   * best-effort (não há como apagar por uid via REST sem o token do próprio
   * usuário) — usado apenas para compensar falhas de persistência local.
   */
  async deleteAuthUser(uid: string): Promise<void> {
    if (hasFirebaseAdminCredentials()) {
      await this.auth().deleteUser(uid);
    }
  }

  /**
   * Se o Admin SDK está configurado (service account). Sem ele, apagar/gerir
   * usuários no Firebase vira no-op — o chamador avisa o operador.
   */
  isAdminEnabled(): boolean {
    return hasFirebaseAdminCredentials();
  }

  /** Cadastro via Identity Toolkit REST (apiKey pública) — sem service account. */
  private async restSignUp(
    input: CreateAuthUserInput,
  ): Promise<{ uid: string }> {
    const res = await fetch(
      `${IDENTITY_URL}/accounts:signUp?key=${firebaseWebApiKey()}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: input.email,
          password: input.password,
          returnSecureToken: true,
        }),
      },
    );
    const data = (await res.json().catch(() => ({}))) as {
      localId?: string;
      error?: { message?: string };
    };
    if (!res.ok || !data.localId) {
      const message = data.error?.message ?? "";
      if (message.startsWith("EMAIL_EXISTS")) {
        throw Object.assign(new Error("email-already-exists"), {
          code: "auth/email-already-exists",
        });
      }
      throw new Error(`Firebase signUp falhou: ${message || res.status}`);
    }
    return { uid: data.localId };
  }
}

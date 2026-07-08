"use client";

import {
  ACCESS_DENIED_CODES,
  type LoginInput,
  type PublicUser,
  type RegisterInput,
} from "@sistema-flores/types";
import { useQueryClient } from "@tanstack/react-query";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ApiError, api } from "../api/client";
import { auth } from "../firebase";

/** Firebase autenticado, mas ainda sem empresa/conta local (novo login social). */
export interface PendingProvision {
  email: string;
  name: string;
}

/** Empresa autenticada, mas sem acesso liberado (trial expirado ou suspensa). */
export interface BlockedAccess {
  code: string;
  message: string;
}

/** Autenticado no Firebase, mas com e-mail ainda não verificado. */
export interface AwaitingVerification {
  email: string;
}

interface AuthContextValue {
  user: PublicUser | null;
  ready: boolean;
  pendingProvision: PendingProvision | null;
  blocked: BlockedAccess | null;
  awaitingVerification: AwaitingVerification | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  /** Cria empresa + conta local para um usuário já autenticado no Firebase. */
  provisionCompany: (
    companyName: string,
    name: string,
    document: string,
  ) => Promise<void>;
  /** Reenvia o e-mail de verificação. */
  resendVerification: () => Promise<void>;
  /** Recarrega o usuário; se verificado, provisiona (se veio de cadastro) e segue. */
  confirmVerification: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  /** Atualiza campos do usuário em memória (ex.: nome da empresa). */
  patchUser: (patch: Partial<PublicUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function firebaseErrorCode(error: unknown): string {
  return typeof error === "object" && error !== null && "code" in error
    ? (error as { code: string }).code
    : "";
}

/** Traduz os erros do Firebase Auth para mensagens amigáveis (pt-BR). */
function mapFirebaseError(error: unknown): Error {
  const messages: Record<string, string> = {
    "auth/invalid-credential": "E-mail ou senha inválidos.",
    "auth/invalid-email": "E-mail inválido.",
    "auth/user-not-found": "E-mail ou senha inválidos.",
    "auth/wrong-password": "E-mail ou senha inválidos.",
    "auth/email-already-in-use": "Já existe uma conta com este e-mail.",
    "auth/weak-password": "A senha deve ter ao menos 6 caracteres.",
    "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde.",
    "auth/account-exists-with-different-credential":
      "Já existe uma conta com este e-mail usando outro método de login.",
    "auth/popup-blocked":
      "O navegador bloqueou a janela do Google. Permita popups e tente de novo.",
  };
  const code = firebaseErrorCode(error);
  if (code) {
    return new Error(
      messages[code] ?? "Não foi possível concluir. Tente novamente.",
    );
  }
  return error instanceof Error ? error : new Error("Erro inesperado.");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [ready, setReady] = useState(false);
  const [pendingProvision, setPendingProvision] =
    useState<PendingProvision | null>(null);
  const [blocked, setBlocked] = useState<BlockedAccess | null>(null);
  const [awaitingVerification, setAwaitingVerification] =
    useState<AwaitingVerification | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  // Evita marcar "pendingProvision" enquanto um provisionamento explícito roda.
  const provisioningRef = useRef(false);
  // Dados do cadastro guardados para provisionar após a verificação do e-mail.
  const pendingRegistration = useRef<{
    companyName: string;
    name: string;
    document: string;
  } | null>(null);

  const refreshProfile = useCallback(async (): Promise<void> => {
    try {
      setUser(await api.get<PublicUser>("/auth/me"));
      setPendingProvision(null);
      setBlocked(null);
      setAwaitingVerification(null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        // 401 = autenticado no Firebase mas ainda sem conta local.
        setUser(null);
        const fb = auth.currentUser;
        if (fb && !provisioningRef.current) {
          setPendingProvision({
            email: fb.email ?? "",
            name: fb.displayName ?? "",
          });
        }
      } else if (
        error instanceof ApiError &&
        error.status === 403 &&
        error.code === ACCESS_DENIED_CODES.EMAIL_NOT_VERIFIED
      ) {
        // E-mail ainda não verificado.
        setUser(null);
        setAwaitingVerification({ email: auth.currentUser?.email ?? "" });
      } else if (error instanceof ApiError && error.status === 403 && error.code) {
        // 403 com outro código = empresa sem acesso (trial expirado ou suspensa).
        setUser(null);
        setBlocked({ code: error.code, message: error.message });
      } else {
        throw error;
      }
    }
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        await refreshProfile().catch(() => setUser(null));
      } else {
        setUser(null);
        setPendingProvision(null);
        setBlocked(null);
        setAwaitingVerification(null);
      }
      setReady(true);
    });
  }, [refreshProfile]);

  const login = useCallback(
    async ({ email, password }: LoginInput) => {
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (error) {
        throw mapFirebaseError(error);
      }
      await refreshProfile();
    },
    [refreshProfile],
  );

  const register = useCallback(
    async ({ companyName, name, document, email, password }: RegisterInput) => {
      try {
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (error) {
        throw mapFirebaseError(error);
      }
      // Só em ambiente de teste (E2E): pula a verificação de e-mail e provisiona
      // direto — o Firebase real não permite confirmar o e-mail num teste. A
      // flag só é ligada no webServer do Playwright; em produção fica desligada.
      if (process.env.NEXT_PUBLIC_E2E === "true") {
        provisioningRef.current = true;
        try {
          await api.post<PublicUser>("/auth/provision", {
            companyName,
            name,
            document,
          });
        } finally {
          provisioningRef.current = false;
        }
        await refreshProfile();
        return;
      }
      // Guarda os dados para provisionar depois da verificação e envia o link.
      pendingRegistration.current = { companyName, name, document };
      try {
        if (auth.currentUser) await sendEmailVerification(auth.currentUser);
      } catch {
        // Falha ao enviar não bloqueia — há o botão de reenviar.
      }
      setAwaitingVerification({ email });
    },
    [refreshProfile],
  );

  const loginWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      const code = firebaseErrorCode(error);
      // Usuário fechou/cancelou o popup: não é erro.
      if (
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request"
      ) {
        return;
      }
      throw mapFirebaseError(error);
    }
    await refreshProfile();
  }, [refreshProfile]);

  const resendVerification = useCallback(async () => {
    if (auth.currentUser) await sendEmailVerification(auth.currentUser);
  }, []);

  const confirmVerification = useCallback(async () => {
    const fb = auth.currentUser;
    if (!fb) throw new Error("Sessão perdida. Entre novamente.");
    await fb.reload();
    if (!fb.emailVerified) {
      throw new Error(
        "Ainda não confirmamos seu e-mail. Clique no link que enviamos e tente de novo.",
      );
    }
    // Novo ID token já com email_verified=true, para as chamadas seguintes.
    await fb.getIdToken(true);
    provisioningRef.current = true;
    try {
      if (pendingRegistration.current) {
        await api.post<PublicUser>(
          "/auth/provision",
          pendingRegistration.current,
        );
        pendingRegistration.current = null;
      }
    } finally {
      provisioningRef.current = false;
    }
    setAwaitingVerification(null);
    await refreshProfile();
  }, [refreshProfile]);

  const provisionCompany = useCallback(
    async (companyName: string, name: string, document: string) => {
      provisioningRef.current = true;
      try {
        await api.post<PublicUser>("/auth/provision", {
          companyName,
          name,
          document,
        });
        setPendingProvision(null);
        await refreshProfile();
      } finally {
        provisioningRef.current = false;
      }
    },
    [refreshProfile],
  );

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setPendingProvision(null);
    setBlocked(null);
    setAwaitingVerification(null);
    pendingRegistration.current = null;
    queryClient.clear();
    router.push("/login");
  }, [queryClient, router]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      // Privacidade: não revela se o e-mail existe (trata como sucesso).
      if (firebaseErrorCode(error) === "auth/user-not-found") return;
      throw mapFirebaseError(error);
    }
  }, []);

  const patchUser = useCallback((patch: Partial<PublicUser>) => {
    setUser((current) => (current ? { ...current, ...patch } : current));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        pendingProvision,
        blocked,
        awaitingVerification,
        login,
        register,
        loginWithGoogle,
        provisionCompany,
        resendVerification,
        confirmVerification,
        logout,
        resetPassword,
        patchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}

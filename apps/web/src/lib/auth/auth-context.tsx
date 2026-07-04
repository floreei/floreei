"use client";

import type { LoginInput, PublicUser, RegisterInput } from "@sistema-flores/types";
import { useQueryClient } from "@tanstack/react-query";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
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

interface AuthContextValue {
  user: PublicUser | null;
  ready: boolean;
  pendingProvision: PendingProvision | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  /** Cria empresa + conta local para um usuário já autenticado no Firebase. */
  provisionCompany: (companyName: string, name: string) => Promise<void>;
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
  const router = useRouter();
  const queryClient = useQueryClient();
  // Evita marcar "pendingProvision" enquanto um provisionamento explícito roda.
  const provisioningRef = useRef(false);

  const refreshProfile = useCallback(async (): Promise<void> => {
    try {
      setUser(await api.get<PublicUser>("/auth/me"));
      setPendingProvision(null);
    } catch (error) {
      // 401 = autenticado no Firebase mas ainda sem conta local.
      if (error instanceof ApiError && error.status === 401) {
        setUser(null);
        const fb = auth.currentUser;
        if (fb && !provisioningRef.current) {
          setPendingProvision({
            email: fb.email ?? "",
            name: fb.displayName ?? "",
          });
        }
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
    async ({ companyName, name, email, password }: RegisterInput) => {
      provisioningRef.current = true;
      try {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
          throw mapFirebaseError(error);
        }
        try {
          await api.post<PublicUser>("/auth/provision", { companyName, name });
        } catch (error) {
          // Desfaz o cadastro no Firebase se o provisionamento falhar.
          await auth.currentUser?.delete().catch(() => undefined);
          throw error;
        }
        await refreshProfile();
      } finally {
        provisioningRef.current = false;
      }
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

  const provisionCompany = useCallback(
    async (companyName: string, name: string) => {
      provisioningRef.current = true;
      try {
        await api.post<PublicUser>("/auth/provision", { companyName, name });
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
        login,
        register,
        loginWithGoogle,
        provisionCompany,
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

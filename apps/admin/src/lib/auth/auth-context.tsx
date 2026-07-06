"use client";

import type { PlatformSession } from "@sistema-flores/types";
import { useQueryClient } from "@tanstack/react-query";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
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
  useState,
} from "react";
import { ApiError, api } from "../api/client";
import { auth } from "../firebase";

interface AdminAuthValue {
  session: PlatformSession | null;
  ready: boolean;
  /** Autenticado no Firebase, mas o e-mail não é um gestor da plataforma. */
  deniedEmail: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

function firebaseErrorCode(error: unknown): string {
  return typeof error === "object" && error !== null && "code" in error
    ? (error as { code: string }).code
    : "";
}

function mapFirebaseError(error: unknown): Error {
  const messages: Record<string, string> = {
    "auth/invalid-credential": "E-mail ou senha inválidos.",
    "auth/invalid-email": "E-mail inválido.",
    "auth/user-not-found": "E-mail ou senha inválidos.",
    "auth/wrong-password": "E-mail ou senha inválidos.",
    "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde.",
    "auth/popup-blocked":
      "O navegador bloqueou a janela do Google. Permita popups e tente de novo.",
  };
  const code = firebaseErrorCode(error);
  if (code) {
    return new Error(messages[code] ?? "Não foi possível entrar. Tente de novo.");
  }
  return error instanceof Error ? error : new Error("Erro inesperado.");
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<PlatformSession | null>(null);
  const [ready, setReady] = useState(false);
  const [deniedEmail, setDeniedEmail] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  const refresh = useCallback(async (): Promise<void> => {
    try {
      setSession(await api.get<PlatformSession>("/admin/me"));
      setDeniedEmail(null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        setSession(null);
        setDeniedEmail(auth.currentUser?.email ?? "");
      } else if (error instanceof ApiError && error.status === 401) {
        setSession(null);
        setDeniedEmail(null);
      } else {
        throw error;
      }
    }
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        await refresh().catch(() => setSession(null));
      } else {
        setSession(null);
        setDeniedEmail(null);
      }
      setReady(true);
    });
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (error) {
        throw mapFirebaseError(error);
      }
      await refresh();
    },
    [refresh],
  );

  const loginWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      const code = firebaseErrorCode(error);
      if (
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request"
      ) {
        return;
      }
      throw mapFirebaseError(error);
    }
    await refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await signOut(auth);
    setSession(null);
    setDeniedEmail(null);
    queryClient.clear();
    router.push("/login");
  }, [queryClient, router]);

  return (
    <AdminAuthContext.Provider
      value={{ session, ready, deniedEmail, login, loginWithGoogle, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth deve ser usado dentro de AdminAuthProvider");
  }
  return ctx;
}

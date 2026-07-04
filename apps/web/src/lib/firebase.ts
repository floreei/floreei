import { getApp, getApps, initializeApp } from "firebase/app";
import { type Auth, connectAuthEmulator, getAuth } from "firebase/auth";

/**
 * Config pública do Firebase (não é segredo). Os valores abaixo são o padrão de
 * **dev** (projeto ***REMOVED***); em produção, sobrescreva por ambiente com
 * as variáveis NEXT_PUBLIC_FIREBASE_* no build.
 */
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
    "***REMOVED***",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??
    "***REMOVED***.firebaseapp.com",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "***REMOVED***",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    "***REMOVED***.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "***REMOVED***",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??
    "1:***REMOVED***:web:0c1fa8abb914c8d49cc5ce",
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "***REMOVED***",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);

// Conecta ao emulador no navegador quando configurado (apenas testes).
const emulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
if (emulatorHost && typeof window !== "undefined") {
  const w = window as typeof window & { __authEmulatorConnected?: boolean };
  if (!w.__authEmulatorConnected) {
    connectAuthEmulator(auth, `http://${emulatorHost}`, {
      disableWarnings: true,
    });
    w.__authEmulatorConnected = true;
  }
}

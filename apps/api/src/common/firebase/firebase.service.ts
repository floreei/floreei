import { Injectable } from "@nestjs/common";
import { App, getApps, initializeApp } from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";
import { firebaseAppOptions } from "./firebase-options";

/**
 * Inicializa e expõe o Firebase Admin SDK. As credenciais são resolvidas por
 * `firebaseAppOptions()` conforme o ambiente (emulador, service account ou só
 * projectId). Ver comentários lá.
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
}

import { Global, Module } from "@nestjs/common";
import { FirebaseService } from "./firebase.service";

/** Torna o Firebase Admin SDK disponível para toda a aplicação. */
@Global()
@Module({
  providers: [FirebaseService],
  exports: [FirebaseService],
})
export class FirebaseModule {}

import { Global, Module } from "@nestjs/common";
import { EmailService } from "./email.service";

/** Envio de e-mail transacional (Resend), disponível para toda a aplicação. */
@Global()
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}

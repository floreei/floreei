import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import type { InviteInfo, PublicUser } from "@sistema-flores/types";
import type { AuthUser } from "../../../common/auth/auth-user";
import { CurrentUser } from "../../../common/auth/current-user.decorator";
import { FirebaseToken } from "../../../common/auth/firebase-token.decorator";
import {
  FirebaseTokenGuard,
  type FirebaseIdentity,
} from "../../../common/auth/firebase-token.guard";
import { Public } from "../../../common/auth/public.decorator";
import { AuthService } from "../application/auth.service";
import { AcceptInviteDto, ProvisionDto } from "./auth.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /**
   * Provisiona empresa + admin a partir de um cadastro já feito no Firebase.
   * O token é validado pelo FirebaseTokenGuard (não exige usuário local ainda).
   */
  @Public()
  @UseGuards(FirebaseTokenGuard)
  @Post("provision")
  provision(
    @FirebaseToken() firebase: FirebaseIdentity,
    @Body() dto: ProvisionDto,
  ): Promise<PublicUser> {
    return this.auth.provision(firebase, dto);
  }

  @Get("me")
  me(@CurrentUser() user: AuthUser): Promise<PublicUser> {
    return this.auth.me(user.id);
  }

  /** Dados públicos de um convite (tela de aceite). Sem autenticação. */
  @Public()
  @Get("invite/:token")
  inviteInfo(@Param("token") token: string): Promise<InviteInfo> {
    return this.auth.inviteInfo(token);
  }

  /** Aceite do convite: cria a conta no Firebase com a senha escolhida. */
  @Public()
  @Post("accept-invite")
  acceptInvite(@Body() dto: AcceptInviteDto): Promise<{ email: string }> {
    return this.auth.acceptInvite(dto.token, dto.password);
  }
}

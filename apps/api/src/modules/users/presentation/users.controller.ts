import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import type { InviteResult, PublicUser } from "@sistema-flores/types";
import type { AuthUser } from "../../../common/auth/auth-user";
import { CurrentUser } from "../../../common/auth/current-user.decorator";
import { Roles } from "../../../common/auth/roles.decorator";
import { UsersService } from "../application/users.service";
import { CreateUserDto, UpdateUserDto } from "./users.dto";

@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(): Promise<PublicUser[]> {
    return this.users.list();
  }

  @Roles("ADMIN")
  @Post()
  create(@Body() dto: CreateUserDto): Promise<InviteResult> {
    return this.users.create(dto);
  }

  @Roles("ADMIN")
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<PublicUser> {
    return this.users.update(id, dto);
  }

  /** Remove um membro (ou cancela um convite pendente). */
  @Roles("ADMIN")
  @Delete(":id")
  remove(
    @Param("id") id: string,
    @CurrentUser() current: AuthUser,
  ): Promise<void> {
    return this.users.remove(id, current.id);
  }
}

import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import type { PublicUser } from "@sistema-flores/types";
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
  create(@Body() dto: CreateUserDto): Promise<PublicUser> {
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
}

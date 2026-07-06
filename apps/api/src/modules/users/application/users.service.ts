import { ConflictException, Injectable } from "@nestjs/common";
import type {
  CreateUserInput,
  PublicUser,
  UpdateUserInput,
} from "@sistema-flores/types";
import { FirebaseService } from "../../../common/firebase/firebase.service";
import { UserRepository } from "../infrastructure/user.repository";
import { toPublicUser } from "./user.mapper";

@Injectable()
export class UsersService {
  constructor(
    private readonly users: UserRepository,
    private readonly firebase: FirebaseService,
  ) {}

  /** Lista os membros da equipe da empresa atual. */
  async list(): Promise<PublicUser[]> {
    const found = await this.users.findAll({ order: { name: "ASC" } });
    return found.map(toPublicUser);
  }

  /** Cria um novo membro da equipe (operador ou administrador). */
  async create(input: CreateUserInput): Promise<PublicUser> {
    if (await this.users.emailExistsGlobally(input.email)) {
      throw new ConflictException("Já existe uma conta com este e-mail.");
    }

    const firebaseUser = await this.createFirebaseUser(input);
    try {
      const user = this.users.create({
        name: input.name,
        email: input.email,
        firebaseUid: firebaseUser.uid,
        role: input.role,
        active: true,
      });
      return toPublicUser(await this.users.save(user));
    } catch (error) {
      // Compensa a criação no Firebase se a persistência local falhar.
      await this.firebase.deleteAuthUser(firebaseUser.uid).catch(() => undefined);
      throw error;
    }
  }

  /** Atualiza nome, papel ou status de um membro. */
  async update(id: string, input: UpdateUserInput): Promise<PublicUser> {
    const user = await this.users.findByIdOrFail(id);
    Object.assign(user, input);
    return toPublicUser(await this.users.save(user));
  }

  private async createFirebaseUser(
    input: CreateUserInput,
  ): Promise<{ uid: string }> {
    try {
      return await this.firebase.createAuthUser({
        email: input.email,
        password: input.password,
        displayName: input.name,
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code: string }).code === "auth/email-already-exists"
      ) {
        throw new ConflictException("Já existe uma conta com este e-mail.");
      }
      throw error;
    }
  }
}

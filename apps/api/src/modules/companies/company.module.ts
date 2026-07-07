import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Patch,
} from "@nestjs/common";
import { InjectRepository, TypeOrmModule } from "@nestjs/typeorm";
import {
  companySettingsSchema,
  storeSettingsSchema,
  type CompanySettings,
  type CompanySettingsInput,
  type StoreSettings,
  type StoreSettingsInput,
} from "@sistema-flores/types";
import { createZodDto } from "nestjs-zod";
import { Repository } from "typeorm";
import { Roles } from "../../common/auth/roles.decorator";
import { encryptSecret } from "../../common/crypto/store-crypto";
import { TenantContextService } from "../../common/tenant/tenant-context.service";
import { CompanyEntity } from "./infrastructure/company.entity";

class CompanySettingsDto extends createZodDto(companySettingsSchema) {}
class StoreSettingsDto extends createZodDto(storeSettingsSchema) {}

function toStore(c: CompanyEntity): StoreSettings {
  return {
    slug: c.storeSlug,
    enabled: c.storeEnabled,
    primaryColor: c.storePrimaryColor,
    accentColor: c.storeAccentColor,
    headline: c.storeHeadline,
    description: c.storeDescription,
    mercadoPagoPublicKey: c.mpPublicKey,
    mercadoPagoConnected: Boolean(c.mpAccessToken),
  };
}

function toSettings(c: CompanyEntity): CompanySettings {
  return {
    id: c.id,
    name: c.name,
    document: c.document,
    phone: c.phone,
    email: c.email,
    address: c.address,
    pixKey: c.pixKey,
    logo: c.logo,
  };
}

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly companies: Repository<CompanyEntity>,
    private readonly tenant: TenantContextService,
  ) {}

  private async current(): Promise<CompanyEntity> {
    const company = await this.companies.findOne({
      where: { id: this.tenant.getCompanyIdOrThrow() },
    });
    if (!company) throw new NotFoundException("Empresa não encontrada.");
    return company;
  }

  async get(): Promise<CompanySettings> {
    return toSettings(await this.current());
  }

  async update(input: CompanySettingsInput): Promise<CompanySettings> {
    const company = await this.current();
    company.name = input.name;
    company.document = input.document ?? null;
    company.phone = input.phone ?? null;
    company.email = input.email ?? null;
    company.address = input.address ?? null;
    company.pixKey = input.pixKey ?? null;
    company.logo = input.logo ?? null;
    return toSettings(await this.companies.save(company));
  }

  async getStore(): Promise<StoreSettings> {
    return toStore(await this.current());
  }

  async updateStore(input: StoreSettingsInput): Promise<StoreSettings> {
    const company = await this.current();
    const slug = input.slug ?? null;

    if (input.enabled && !slug) {
      throw new BadRequestException(
        "Defina o endereço da loja antes de ativá-la.",
      );
    }
    if (slug) {
      const clash = await this.companies.findOne({
        where: { storeSlug: slug },
      });
      if (clash && clash.id !== company.id) {
        throw new ConflictException("Este endereço de loja já está em uso.");
      }
    }

    company.storeSlug = slug;
    company.storeEnabled = input.enabled;
    company.storePrimaryColor = input.primaryColor;
    company.storeAccentColor = input.accentColor;
    company.storeHeadline = input.headline ?? null;
    company.storeDescription = input.description ?? null;
    if (input.mercadoPagoPublicKey !== undefined) {
      company.mpPublicKey = input.mercadoPagoPublicKey ?? null;
    }
    // Token: write-only. Só atualiza se veio preenchido; cifra em repouso.
    if (input.mercadoPagoAccessToken) {
      company.mpAccessToken = encryptSecret(input.mercadoPagoAccessToken);
    }
    return toStore(await this.companies.save(company));
  }

  /** Lookup público por slug (sem filtro de tenant) — usado pela loja. */
  findBySlug(slug: string): Promise<CompanyEntity | null> {
    return this.companies.findOne({ where: { storeSlug: slug } });
  }

  /** Lookup por id (sem filtro de tenant) — usado pelo webhook de pagamento. */
  findById(id: string): Promise<CompanyEntity | null> {
    return this.companies.findOne({ where: { id } });
  }
}

@Controller("company")
class CompanyController {
  constructor(private readonly company: CompanyService) {}

  @Get()
  get() {
    return this.company.get();
  }

  @Roles("ADMIN")
  @Patch()
  update(@Body() dto: CompanySettingsDto) {
    return this.company.update(dto);
  }

  @Get("store")
  getStore() {
    return this.company.getStore();
  }

  @Roles("ADMIN")
  @Patch("store")
  updateStore(@Body() dto: StoreSettingsDto) {
    return this.company.updateStore(dto);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([CompanyEntity])],
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}

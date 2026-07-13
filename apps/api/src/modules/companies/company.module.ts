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
  companyFiscalSettingsSchema,
  companySettingsSchema,
  storeSettingsSchema,
  type CompanyFiscalSettings,
  type CompanyFiscalSettingsInput,
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
class CompanyFiscalSettingsDto extends createZodDto(companyFiscalSettingsSchema) {}

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

function toFiscal(c: CompanyEntity): CompanyFiscalSettings {
  return {
    stateRegistration: c.stateRegistration,
    taxRegime: c.taxRegime,
    addressStreet: c.fiscalAddressStreet,
    addressNumber: c.fiscalAddressNumber,
    addressComplement: c.fiscalAddressComplement,
    addressNeighborhood: c.fiscalAddressNeighborhood,
    addressCity: c.fiscalAddressCity,
    addressState: c.fiscalAddressState,
    addressZip: c.fiscalAddressZip,
    cityCode: c.fiscalCityCode,
    invoiceAutoEmit: c.invoiceAutoEmit,
    environment: c.fiscalEnvironment,
    naturezaOperacao: c.fiscalNature,
    cfopInState: c.fiscalCfopInState,
    cfopOutState: c.fiscalCfopOutState,
    icmsCsosn: c.fiscalIcmsCsosn,
    icmsCst: c.fiscalIcmsCst,
    origem: c.fiscalOrigin,
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

  async getFiscal(): Promise<CompanyFiscalSettings> {
    return toFiscal(await this.current());
  }

  async updateFiscal(
    input: CompanyFiscalSettingsInput,
  ): Promise<CompanyFiscalSettings> {
    const company = await this.current();
    company.stateRegistration = input.stateRegistration ?? null;
    company.taxRegime = input.taxRegime ?? null;
    company.fiscalAddressStreet = input.addressStreet ?? null;
    company.fiscalAddressNumber = input.addressNumber ?? null;
    company.fiscalAddressComplement = input.addressComplement ?? null;
    company.fiscalAddressNeighborhood = input.addressNeighborhood ?? null;
    company.fiscalAddressCity = input.addressCity ?? null;
    company.fiscalAddressState = input.addressState ?? null;
    company.fiscalAddressZip = input.addressZip ?? null;
    company.fiscalCityCode = input.cityCode ?? null;
    company.invoiceAutoEmit = input.invoiceAutoEmit;
    company.fiscalEnvironment = input.environment;
    company.fiscalNature = input.naturezaOperacao ?? null;
    company.fiscalCfopInState = input.cfopInState ?? null;
    company.fiscalCfopOutState = input.cfopOutState ?? null;
    company.fiscalIcmsCsosn = input.icmsCsosn ?? null;
    company.fiscalIcmsCst = input.icmsCst ?? null;
    company.fiscalOrigin = input.origem ?? null;
    return toFiscal(await this.companies.save(company));
  }

  /** Usado só pelo EventsService no fluxo de venda (emissão automática). */
  async isInvoiceAutoEmitEnabled(): Promise<boolean> {
    return (await this.current()).invoiceAutoEmit;
  }

  /** Entidade completa da empresa atual — usado pra montar os dados do emissor da nota. */
  getCurrentEntity(): Promise<CompanyEntity> {
    return this.current();
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

  @Get("fiscal")
  getFiscal() {
    return this.company.getFiscal();
  }

  @Roles("ADMIN")
  @Patch("fiscal")
  updateFiscal(@Body() dto: CompanyFiscalSettingsDto) {
    return this.company.updateFiscal(dto);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([CompanyEntity])],
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}

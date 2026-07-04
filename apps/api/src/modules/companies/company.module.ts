import {
  Body,
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
  type CompanySettings,
  type CompanySettingsInput,
} from "@sistema-flores/types";
import { createZodDto } from "nestjs-zod";
import { Repository } from "typeorm";
import { Roles } from "../../common/auth/roles.decorator";
import { TenantContextService } from "../../common/tenant/tenant-context.service";
import { CompanyEntity } from "./infrastructure/company.entity";

class CompanySettingsDto extends createZodDto(companySettingsSchema) {}

function toSettings(c: CompanyEntity): CompanySettings {
  return {
    id: c.id,
    name: c.name,
    document: c.document,
    phone: c.phone,
    email: c.email,
    address: c.address,
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
    company.logo = input.logo ?? null;
    return toSettings(await this.companies.save(company));
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
}

@Module({
  imports: [TypeOrmModule.forFeature([CompanyEntity])],
  controllers: [CompanyController],
  providers: [CompanyService],
})
export class CompanyModule {}

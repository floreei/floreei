import { DataSource, Repository } from "typeorm";
import { TenantScopedRepository } from "../src/common/database/tenant-scoped.repository";
import { TenantContextService } from "../src/common/tenant/tenant-context.service";
import { TenantSubscriber } from "../src/common/tenant/tenant.subscriber";
import { CompanyEntity } from "../src/modules/companies/infrastructure/company.entity";
import { CustomerEntity } from "../src/modules/customers/infrastructure/customer.entity";
import { initTestDataSource, truncateAll } from "./utils/test-database";

// Repositório concreto mínimo para exercitar o isolamento via base genérica.
class CustomerTestRepository extends TenantScopedRepository<CustomerEntity> {
  constructor(repo: Repository<CustomerEntity>, tenant: TenantContextService) {
    super(repo, tenant, "Cliente");
  }
}

describe("Isolamento multi-tenant", () => {
  let dataSource: DataSource;
  let tenant: TenantContextService;
  let repo: CustomerTestRepository;
  let rawRepo: Repository<CustomerEntity>;
  let companyA: CompanyEntity;
  let companyB: CompanyEntity;

  beforeAll(async () => {
    dataSource = await initTestDataSource();
    tenant = new TenantContextService();
    // Registra o subscriber que carimba o companyId no insert.
    new TenantSubscriber(dataSource, tenant);
    rawRepo = dataSource.getRepository(CustomerEntity);
    repo = new CustomerTestRepository(rawRepo, tenant);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await truncateAll(dataSource);
    const companies = dataSource.getRepository(CompanyEntity);
    companyA = await companies.save(companies.create({ name: "Floricultura A" }));
    companyB = await companies.save(companies.create({ name: "Floricultura B" }));
  });

  const asCompany = <T>(companyId: string, fn: () => Promise<T>) =>
    tenant.run({ companyId, userId: "00000000-0000-0000-0000-000000000000", role: "ADMIN" }, fn);

  it("filtra leituras pelo companyId do contexto", async () => {
    await asCompany(companyA.id, async () => {
      await repo.save(repo.create({ name: "Cliente A" }));
    });
    await asCompany(companyB.id, async () => {
      await repo.save(repo.create({ name: "Cliente B" }));
    });

    const fromA = await asCompany(companyA.id, () => repo.findAll());
    const fromB = await asCompany(companyB.id, () => repo.findAll());

    expect(fromA.map((c) => c.name)).toEqual(["Cliente A"]);
    expect(fromB.map((c) => c.name)).toEqual(["Cliente B"]);
  });

  it("não permite acessar registro de outra empresa por id", async () => {
    const created = await asCompany(companyA.id, () =>
      repo.save(repo.create({ name: "Cliente A" })),
    );

    const seenByB = await asCompany(companyB.id, () => repo.findById(created.id));
    expect(seenByB).toBeNull();

    const seenByA = await asCompany(companyA.id, () => repo.findById(created.id));
    expect(seenByA?.name).toBe("Cliente A");
  });

  it("o subscriber carimba companyId mesmo sem ser informado", async () => {
    const created = await asCompany(companyA.id, async () => {
      // cria via repo cru, sem setar companyId — subscriber deve preencher
      const entity = rawRepo.create({ name: "Sem dono" });
      return rawRepo.save(entity);
    });

    expect(created.companyId).toBe(companyA.id);
  });

  it("count respeita o tenant", async () => {
    await asCompany(companyA.id, () => repo.save(repo.create({ name: "A1" })));
    await asCompany(companyA.id, () => repo.save(repo.create({ name: "A2" })));
    await asCompany(companyB.id, () => repo.save(repo.create({ name: "B1" })));

    expect(await asCompany(companyA.id, () => repo.count())).toBe(2);
    expect(await asCompany(companyB.id, () => repo.count())).toBe(1);
  });
});

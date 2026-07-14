import "reflect-metadata";
import { FirebaseService } from "../common/firebase/firebase.service";
import { CompanyEntity } from "../modules/companies/infrastructure/company.entity";
import { UserEntity } from "../modules/users/infrastructure/user.entity";
import dataSource from "./data-source";

/**
 * Conecta a loja Floravie no ambiente real, de forma idempotente:
 * 1) garante a empresa Floravie (loja ativa, slug "floravie", storefront próprio);
 * 2) vincula o e-mail informado como ADMIN dela, reusando o `firebaseUid` da
 *    conta que já existe no Firebase (login multi-conta) — sem recriar credencial.
 *
 * Uso: `FLORAVIE_ADMIN_EMAIL=voce@dominio.com pnpm --filter @sistema-flores/api connect:floravie`
 * (default do e-mail: hugouraga61@gmail.com).
 */
const EMAIL = process.env.FLORAVIE_ADMIN_EMAIL ?? "hugouraga61@gmail.com";
const SLUG = "floravie";

async function run(): Promise<void> {
  await dataSource.initialize();
  // Garante o schema em dia (idempotente) — o script depende de colunas novas
  // como `store_custom`. Em prod as migrations já rodaram no start; aqui não faz
  // nada de novo. Em dev, aplica as pendentes antes de consultar.
  await dataSource.runMigrations();
  const companies = dataSource.getRepository(CompanyEntity);
  const users = dataSource.getRepository(UserEntity);

  let company = await companies.findOne({ where: { storeSlug: SLUG } });
  if (!company) {
    const now = new Date();
    company = await companies.save(
      companies.create({
        name: "Floravie Ateliê",
        plan: "TRIAL",
        firstAccessAt: now,
        trialEndsAt: new Date(now.getTime() + 3650 * 86_400_000),
        lastSeenAt: now,
        storeEnabled: true,
        storeSlug: SLUG,
        storeCustom: true,
      }),
    );
    // eslint-disable-next-line no-console
    console.log(`Empresa Floravie criada: ${company.id}`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`Empresa Floravie já existe: ${company.id}`);
  }

  const existing = await users.findOne({
    where: { companyId: company.id, email: EMAIL },
  });
  // Já vinculado: nada a fazer (evita bater no Firebase a cada start do container).
  if (existing?.firebaseUid) {
    // eslint-disable-next-line no-console
    console.log(`Admin ${EMAIL} já é ADMIN da Floravie. Nada a fazer.`);
    await dataSource.destroy();
    return;
  }

  // Só aqui precisamos do Firebase (buscar o uid da conta que já existe).
  const firebase = new FirebaseService();
  const fbUser = await firebase.auth().getUserByEmail(EMAIL);
  if (existing) {
    existing.firebaseUid = fbUser.uid;
    existing.active = true;
    await users.save(existing);
    // eslint-disable-next-line no-console
    console.log(`Admin ${EMAIL} vinculado à Floravie (uid atualizado).`);
  } else {
    await users.save(
      users.create({
        companyId: company.id,
        name: fbUser.displayName ?? "Administrador",
        email: EMAIL,
        firebaseUid: fbUser.uid,
        role: "ADMIN",
        active: true,
      }),
    );
    // eslint-disable-next-line no-console
    console.log(`Admin ${EMAIL} vinculado à Floravie como ADMIN.`);
  }

  await dataSource.destroy();
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Falha ao conectar a Floravie:", error);
  process.exit(1);
});

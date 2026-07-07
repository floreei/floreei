import request from "supertest";
import {
  bearer,
  loginAs,
  registerCompany,
  uniqueEmail,
} from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

describe("Dados da empresa (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;

  const auth = () => bearer(token);

  beforeAll(async () => {
    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.reset();
    token = (
      await registerCompany(http, {
        companyName: "Floricultura Bela Flor",
      })
    ).accessToken;
  });

  it("retorna e atualiza os dados da empresa", async () => {
    const before = await http.get("/api/company").set(auth()).expect(200);
    expect(before.body.name).toBe("Floricultura Bela Flor");
    // Documento vem do cadastro (CNPJ/CPF exigido no provision).
    expect(typeof before.body.document).toBe("string");

    const updated = await http
      .patch("/api/company")
      .set(auth())
      .send({
        name: "Bela Flor Decorações",
        document: "12.345.678/0001-90",
        phone: "11999998888",
        email: "contato@belaflor.com",
        address: "Rua das Flores, 100 - São Paulo",
        pixKey: "pagamentos@belaflor.com",
        logo: "data:image/png;base64,iVBORw0KGgo=",
      })
      .expect(200);

    expect(updated.body.name).toBe("Bela Flor Decorações");
    expect(updated.body.document).toBe("12.345.678/0001-90");
    expect(updated.body.pixKey).toBe("pagamentos@belaflor.com");
    expect(updated.body.logo).toContain("data:image/png");
  });

  it("apenas ADMIN pode atualizar", async () => {
    const opEmail = uniqueEmail("op");
    await http
      .post("/api/users")
      .set(auth())
      .send({ name: "Op", email: opEmail, password: "Segredo123!" })
      .expect(201);
    const operator = await loginAs(http, opEmail, "Segredo123!");

    await http
      .patch("/api/company")
      .set(bearer(operator.accessToken))
      .send({ name: "Hack" })
      .expect(403);
  });

  it("isola a empresa por tenant", async () => {
    await http
      .patch("/api/company")
      .set(auth())
      .send({ name: "Empresa A", document: "AAA" })
      .expect(200);

    const other = await registerCompany(http, { email: "outro@empresa.com" });
    const res = await http
      .get("/api/company")
      .set(bearer(other.accessToken))
      .expect(200);
    // Não vê os dados da Empresa A (isolamento por tenant).
    expect(res.body.name).not.toBe("Empresa A");
    expect(res.body.document).not.toBe("AAA");
  });
});

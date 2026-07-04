import { HealthController } from "./health.controller";

describe("HealthController", () => {
  it("retorna status ok com timestamp", () => {
    const controller = new HealthController();
    const result = controller.check();

    expect(result.status).toBe("ok");
    expect(typeof result.timestamp).toBe("string");
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
  });
});

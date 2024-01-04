const request = require("supertest");
const crypto = require("crypto");

const { ghostWebhookSecret } = require("../config");
const app = require("../app");

describe("test webhook validation", () => {
  test("app is working", async () => {
    const resp = await request(app).get("/api");
    expect(resp.statusCode).toBe(200);
  });

  test("require webhook signature", async () => {
    // No X-Ghost-Signature header
    const resp = await request(app).post("/api");
    expect(resp.statusCode).toBe(403);
    const error = JSON.parse(resp.text);
    expect(error.message).toBe("Webhook signature missing from request");
  });

  test("require properly formatted webhook signature", async () => {
    // Malformed X-Ghost-Signature header
    const resp = await request(app).post("/api").set("X-Ghost-Signature", "");
    expect(resp.statusCode).toBe(403);
    const error = JSON.parse(resp.text);
    expect(error.message).toBe("Webhook signature missing from request");
  });

  test("require properly formatted webhook signature with timestamp", async () => {
    // Malformed X-Ghost-Signature header
    const resp = await request(app).post("/api").set("X-Ghost-Signature", "sha256=sdf");
    expect(resp.statusCode).toBe(403);
    const error = JSON.parse(resp.text);
    expect(error.message).toBe("Malformed webhook signature");
  });

  test("require recent timestamp", async () => {
    const resp = await request(app)
      .post("/api")
      .set(
        "X-Ghost-Signature",
        "sha256=36bc5f48cd3f3897ed31dcc0cc59451b3cec50ba181363b8050031602e110268, t=1704389373915"
      );
    expect(resp.statusCode).toBe(403);
    const error = JSON.parse(resp.text);
    expect(error.message).toBe("Stale webhook");
  });

  test("valid webhook signature", async () => {
    const timestamp = Date.now();
    const signature = crypto.createHmac("sha256", ghostWebhookSecret).update("{}").digest("hex");
    const resp = await request(app).post("/api").set("X-Ghost-Signature", `sha256=${signature}, t=${timestamp}`);
    expect(resp.statusCode).toBe(200);
  });
});

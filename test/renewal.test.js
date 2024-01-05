const request = require("supertest");
const nock = require("nock");

const eventFixture = require("./fixtures/invoiceUpcoming");
const productFixture = require("./fixtures/product");

const { getHumanTime, getDaysUntilRenewal } = require("../helpers");
const { app, processUpcomingInvoiceWebhook } = require("../app");

describe("test upcoming invoice renewal", () => {
  beforeAll(() => {
    // Prevents real API calls from being sent to Mailgun
    nock.disableNetConnect();
    nock.enableNetConnect("127.0.0.1");
  });

  afterAll(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  test("require webhook signature", async () => {
    const resp = await request(app).post("/api/stripeWebhook", eventFixture);
    expect(resp.statusCode).toBe(403);
  });

  test("format time properly", () => {
    expect(getHumanTime(new Date(2024, 0, 1))).toBe("January 1, 2024");
  });

  test("calculate days until renewal properly", () => {
    const now = new Date(2024, 0, 1);
    const renewal = new Date(2024, 0, 5);
    expect(getDaysUntilRenewal(renewal, now)).toBe(4);
  });

  test("discard fractional days in getDaysUntilRenewal, round down", () => {
    const now = new Date(2024, 0, 1, 2, 2, 1);
    const renewal = new Date(2024, 0, 5);
    expect(getDaysUntilRenewal(renewal, now)).toBe(3);
  });

  test("send subscription renewal email", async () => {
    nock("https://api.stripe.com")
      .get(`/v1/products/${eventFixture.data.object.lines.data[0].plan.product}`)
      .reply(200, productFixture);
    nock("https://api.mailgun.net/")
      .post("/v3/mg.citationneeded.news/messages")
      .reply(200, { id: "mailgun-id-goes-here", message: "Queued. Thank you." });

    const resp = await processUpcomingInvoiceWebhook(eventFixture);
  });
});

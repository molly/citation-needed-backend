const request = require("supertest");
const FormData = require("form-data");
const nock = require("nock");

const app = require("../app");
const { makeSignature } = require("./helpers");

describe("test new subscriber", () => {
  beforeAll(() => {
    // Prevents real API calls from being sent to Mailgun
    nock.disableNetConnect();
    nock.enableNetConnect("127.0.0.1");
  });

  afterAll(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  test("require email address", async () => {
    const body = {
      member: {
        current: {
          name: "Molly",
          status: "free",
        },
      },
    };
    const signature = makeSignature(body);

    const resp = await request(app).post("/api/newSubscriber").send(body).set("X-Ghost-Signature", signature);
    expect(resp.statusCode).toBe(400);
    const error = JSON.parse(resp.text);
    expect(error.message).toBe("To email missing");
  });

  test("500s if Mailgun fails", async () => {
    nock("https://api.mailgun.net/").post("/v3/mg.citationneeded.news/messages").reply(500);

    const body = {
      member: {
        current: {
          name: "Molly",
          email: "cn-test@mollywhite.net",
          status: "free",
        },
      },
    };
    const signature = makeSignature(body);
    const resp = await request(app).post("/api/newSubscriber").send(body).set("X-Ghost-Signature", signature);
    expect(resp.statusCode).toBe(500);
  });

  test("sends email template", async () => {
    nock("https://api.mailgun.net/")
      .post("/v3/mg.citationneeded.news/messages")
      .reply(200, { id: "mailgun-id-goes-here", message: "Queued. Thank you." });

    const body = {
      member: {
        current: {
          name: "Molly",
          email: "cn-test@mollywhite.net",
          status: "free",
        },
      },
    };
    const signature = makeSignature(body);

    const resp = await request(app).post("/api/newSubscriber").send(body).set("X-Ghost-Signature", signature);
    expect(resp.statusCode).toBe(200);
  });
});

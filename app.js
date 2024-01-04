const express = require("express");
const Mailgun = require("mailgun.js");
const FormData = require("form-data");

const { logger, httpLogFormatter } = require("./logger");
const { validateWebhook } = require("./auth");
const { mailgunApiKey } = require("./config");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mailgun = new Mailgun(FormData);
const MAILGUN_DOMAIN = "mg.citationneeded.news";

app.get("/api", (_, res) => {
  // Dummy endpoint
  res.sendStatus(200);
});

app.post("/api", validateWebhook, (_, res) => {
  // Dummy endpoint to test webhook validation
  res.sendStatus(200);
});

app.post("/api/newSubscriber", validateWebhook, async (req, res) => {
  try {
    let toName = "";
    if (req.body?.member?.current?.name) {
      toName = req.body.member.current.name;
    }

    let toEmail;
    if (req.body?.member?.current?.email) {
      toEmail = req.body.member.current.email;
    } else {
      logger.error({ message: "400: To email missing", data: httpLogFormatter({ req }) });
      return res.status(400).send({ message: "To email missing" });
    }

    let template;
    if (req.body?.member?.current?.comped) {
      // Don't need to send welcome emails for comped users
      return res.sendStatus(200);
    }

    mg = mailgun.client({ username: "api", key: mailgunApiKey });
    const resp = await mg.messages.create(MAILGUN_DOMAIN, {
      from: "Citation Needed <newsletter@citationneeded.news>",
      to: `${toName} <${toEmail}>`,
      subject: "Welcome to Citation Needed",
      template: "free subscriber welcome", // Despite the name, this goes to all subscribers
    });

    logger.info({ message: "Successful newSubscriber webhook call", data: httpLogFormatter({ req, resp }) });
    return res.sendStatus(200);
  } catch (error) {
    logger.error({
      message: "500: Exception thrown in welcome email webhook processing.",
      data: httpLogFormatter({ req, error }),
    });
    return res.status(500).send({ message: "Exception thrown in welcome email webhook processing." });
  }
});

module.exports = app;

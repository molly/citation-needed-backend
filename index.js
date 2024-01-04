const express = require("express");
const path = require("path");

const { logger, httpLogFormatter } = require("./logger");
const { validateWebhook } = require("./auth");

const PORT = process.env.PORT || 5001;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
      res.status(400).send({ message: "To email missing" });
    }

    let template;
    if (req.body?.member?.current?.status === "free") {
      template = "free subscriber welcome";
    } else {
      template = "paid subscriber welcome";
    }

    const formData = new FormData();
    formData.append("from", "Citation Needed <newsletter@citationneeded.news>");
    formData.append("to", `${toName} <${toEmail}>`);
    formData.append("subject", "Welcome to Citation Needed");
    formData.append("template", template);

    const resp = await fetch(mailgunWelcomeUrl, { method: "post", body: formData });
    logger.info({ message: "Successful newSubscriber webhook call", data: httpLogFormatter({ req, resp }) });
    res.status(200).send();
  } catch (error) {
    logger.error({
      message: "500: Exception thrown in welcome email webhook processing.",
      data: httpLogFormatter({ req, error }),
    });
    res.status(500).send({ message: "Exception thrown in welcome email webhook processing." });
  }
});

app.listen(PORT);

const express = require("express");

const { validateWebhook } = require("./auth");

const config = require("./config");

const PORT = process.env.PORT || 5001;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/newSubscriber", validateWebhook, async (req, res) => {
  try {
    let toName = "";
    if (req.body?.member?.current?.name) {
      toName = req.body.member.current.name;
    }

    let toEmail;
    if (req.body?.member?.current?.email) {
      toEmail = req.body.member.current.email;
    } else {
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

    const resp = await fetch(mailgunWelcomeUrl, { method: "post", body: "formData" });
    res.status(200).send();
  } catch (error) {
    res.status(500).send({ message: "Exception thrown in welcome email webhook processing." });
  }
});

if (process.argv[2] === "prod") {
  https
    .createServer(
      {
        key: fs.readFileSync(`${config.certPath}/privkey.pem`),
        cert: fs.readFileSync(`${config.certPath}/cert.pem`),
        ca: fs.readFileSync(`${config.certPath}/chain.pem`),
        requestCert: true,
      },
      app
    )
    .listen(PORT);
} else {
  app.listen(PORT);
}

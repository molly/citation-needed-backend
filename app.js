const { logger, httpLogFormatter } = require("./logger");
const { validateGhostWebhook } = require("./auth");
const { formatCurrency, getHumanTime, getDaysUntilRenewal } = require("./helpers");
const { mailgunApiKey, stripeWebhookSecret, stripeLiveSecretKey } = require("./config");

const express = require("express");
const Mailgun = require("mailgun.js");
const FormData = require("form-data");
const stripe = require("stripe")(stripeLiveSecretKey);

const app = express();

const mailgun = new Mailgun(FormData);
const MAILGUN_DOMAIN = "mg.citationneeded.news";

app.get("/api", (_, res) => {
  // Dummy endpoint
  res.sendStatus(200);
});

app.post("/api", validateGhostWebhook, (_, res) => {
  // Dummy endpoint to test webhook validation
  res.sendStatus(200);
});

app.post("/api/newSubscriber", express.json(), validateGhostWebhook, async (req, res) => {
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

    let to;
    if (toName) {
      to = `${toName} <${toEmail}>`;
    } else {
      to = `<${toEmail}>`;
    }

    mg = mailgun.client({ username: "api", key: mailgunApiKey });
    const resp = await mg.messages.create(MAILGUN_DOMAIN, {
      from: "Citation Needed by Molly White <support@citationneeded.news>",
      to,
      subject: "Welcome to Citation Needed",
      template: "free subscriber welcome", // Despite the name, this goes to all subscribers
      "h:List-Id": "Citation Needed by Molly White <citationneeded.news>",
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

const processUpcomingInvoiceWebhook = async (event) => {
  const upcoming = event.data.object;
  const name = upcoming.customer_name;
  const email = upcoming.customer_email;

  const amount_due = upcoming.amount_due;
  const currency = upcoming.currency;
  const country = upcoming.account_country;

  const lineItem = upcoming.lines.data[0];
  const productId = lineItem.plan.product;
  const productDetails = await stripe.products.retrieve(productId);
  const tierName = productDetails.name;
  const interval = lineItem.plan.interval;
  if (interval === "month") {
    // Don't send emails for monthly subscribers, otherwise they'll get a renewal email every month
    return null;
  }

  const renewalDateSeconds = upcoming.next_payment_attempt;
  const renewalDate = new Date(renewalDateSeconds * 1000);
  const humanTime = getHumanTime(renewalDate);
  const daysUntilRenewal = getDaysUntilRenewal(renewalDate);

  let to;
  if (name) {
    to = `${name} <${email}>`;
  } else {
    to = `<${email}>`;
  }

  mg = mailgun.client({ username: "api", key: mailgunApiKey });
  const resp = await mg.messages.create(MAILGUN_DOMAIN, {
    from: "Citation Needed by Molly White <support@citationneeded.news>",
    to,
    subject: `Your subscription to Citation Needed will renew in ${daysUntilRenewal} day${
      daysUntilRenewal === 1 ? "" : "s"
    }`,
    template: "renewal",
    "h:List-Id": "Citation Needed by Molly White <citationneeded.news>",
    "h:X-Mailgun-Variables": JSON.stringify({
      renewal_date: humanTime,
      tier_name: tierName,
      subscription_amount: formatCurrency(country, currency, amount_due, true),
      subscription_interval: interval,
    }),
  });
  return resp;
};

app.post("/api/stripeWebhook", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const signature = req.headers["stripe-signature"];
    let event = req.body;
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, stripeWebhookSecret);
    } catch (err) {
      logger.error({ message: "403: Invalid Stripe webhook signature", data: httpLogFormatter({ req, error: err }) });
      return res.status(403).send({ message: "Invalid Stripe webhook signature", error: err });
    }

    switch (event.type) {
      case "invoice.upcoming":
        const resp = await processUpcomingInvoiceWebhook(event);
        return res.sendStatus(200);
      default:
        return res.sendStatus(200);
    }
  } catch (error) {
    console.error(error);
    logger.error({
      message: "500: Exception thrown in Stripe webhook processing.",
      data: httpLogFormatter({ req, error }),
    });
    return res.status(500).send({ message: "Exception thrown in Stripe webhook processing." });
  }
});

module.exports = { app, processUpcomingInvoiceWebhook };

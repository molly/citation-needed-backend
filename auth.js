const crypto = require("crypto");

const { logger, httpLogFormatter } = require("./logger");
const { ghostWebhookSecret } = require("./config");

const GHOST_WEBHOOK_HEADER = "X-Ghost-Signature";
const FIVE_MINUTES = 5 * 60 * 1000;

function validateWebhook(req, res, next) {
  if (req.get(GHOST_WEBHOOK_HEADER)) {
    const sig_header = req.get(GHOST_WEBHOOK_HEADER);

    const [signature, timestampStr] = sig_header.split(", ");
    signature = signature.replace("sha256=", "");
    timestampStr = timestamp.replace("t=", "");

    // Check timestamp is reasonably recent
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) {
      logger.error({ message: "403: Malformed webhook signature", data: httpLogFormatter({ req }) });
      return res.status(403).send({ message: "Malformed webhook signature" });
    }
    if (Math.abs(Date.now() - timestamp) > FIVE_MINUTES) {
      logger.error({ message: "403: Stale webhook", data: httpLogFormatter({ req }) });
      return res.status(403).send({ message: "Stale webhook" });
    }

    const body = JSON.stringify(req.body);
    const expected = crypto.createHmac("sha256", ghostWebhookSecret).update(body).digest("hex");
    if (expected === signature) {
      next();
    } else {
      logger.error({ message: "403: Invalid webhook signature", data: httpLogFormatter({ req }) });
      return res.status(403).send({ message: "Invalid webhook signature" });
    }
  } else {
    logger.error({ message: "403: Webhook signature missing from request", data: httpLogFormatter({ req }) });
    return res.status(403).send({ message: "Webhook signature missing from request" });
  }
}

module.exports = {
  validateWebhook,
};

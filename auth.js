const crypto = require("crypto");

const { logger, httpLogFormatter } = require("./logger");
const { ghostWebhookSecret } = require("./config");

const GHOST_WEBHOOK_HEADER = "X-Ghost-Signature";
const FIVE_MINUTES = 5 * 60 * 1000;

function validateGhostWebhook(req, res, next) {
  try {
    if (req.get(GHOST_WEBHOOK_HEADER)) {
      const sig_header = req.get(GHOST_WEBHOOK_HEADER);

      if (!/^sha256=([a-z0-9]*?), t=\d+$/.test(sig_header)) {
        logger.error({ message: "403: Malformed Ghost webhook signature", data: httpLogFormatter({ req }) });
        return res.status(403).send({ message: "Malformed Ghost webhook signature" });
      }

      let [signature, timestampStr] = sig_header.split(", ");
      signature = signature.replace("sha256=", "");
      timestampStr = timestampStr.replace("t=", "");

      // Check timestamp is reasonably recent
      const timestamp = parseInt(timestampStr, 10);
      if (isNaN(timestamp)) {
        logger.error({ message: "403: Malformed Ghost webhook signature", data: httpLogFormatter({ req }) });
        return res.status(403).send({ message: "Malformed Ghost webhook signature" });
      }
      if (Math.abs(Date.now() - timestamp) > FIVE_MINUTES) {
        logger.error({ message: "403: Stale Ghost webhook", data: httpLogFormatter({ req }) });
        return res.status(403).send({ message: "Stale Ghost webhook" });
      }

      const body = JSON.stringify(req.body || {});
      const expected = crypto.createHmac("sha256", ghostWebhookSecret).update(body).digest("hex");
      if (expected === signature) {
        next();
      } else {
        logger.error({ message: "403: Invalid Ghost webhook signature", data: httpLogFormatter({ req }) });
        return res.status(403).send({ message: "Invalid Ghost webhook signature" });
      }
    } else {
      logger.error({ message: "403: Ghost webhook signature missing from request", data: httpLogFormatter({ req }) });
      return res.status(403).send({ message: "Ghost webhook signature missing from request" });
    }
  } catch (error) {
    console.error(error);
    logger.error({
      message: "500: Exception thrown in Ghost webhook signature validation.",
      data: httpLogFormatter({ req, error }),
    });
  }
}

module.exports = {
  validateGhostWebhook,
};

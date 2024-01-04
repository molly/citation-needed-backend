const crypto = require("crypto");

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
      return res.status(403).send({ message: "Malformed webhook signature" });
    }
    if (Math.abs(Date.now() - timestamp) > FIVE_MINUTES) {
      return res.status(403).send({ message: "Stale webhook" });
    }

    const body = JSON.stringify(req.body);
    const expected = crypto.createHmac("sha256", ghostWebhookSecret).update(body).digest("hex");
    if (expected === signature) {
      next();
    } else {
      return res.status(403).send({ message: "Invalid webhook signature" });
    }
  } else {
    return res.status(403).send({ message: "Webhook signature missing from request" });
  }
}

module.exports = {
  validateWebhook,
};

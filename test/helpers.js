const crypto = require("crypto");
const { ghostWebhookSecret } = require("../config");

const makeSignature = (body) => {
  const timestamp = Date.now();
  const signature = crypto.createHmac("sha256", ghostWebhookSecret).update(JSON.stringify(body)).digest("hex");
  return `sha256=${signature}, t=${timestamp}`;
};

module.exports = { makeSignature };

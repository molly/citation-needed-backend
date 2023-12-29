const express = require("express");

let config;
if (process.argv[2] === "prod") {
  config = require("./config");
}

const PORT = process.env.PORT || 5001;

const app = express();

if (process.argv[2] === "prod") {
  https
    .createServer(
      {
        key: fs.readFileSync(`${config.certPath}/privkey.pem`),
        cert: fs.readFileSync(`${config.certPath}/cert.pem`),
        ca: fs.readFileSync(`${config.certPath}/chain.pem`),
      },
      app
    )
    .listen(PORT);
} else {
  app.listen(PORT);
}

const winston = require("winston");
require("winston-daily-rotate-file");
const path = require("path");

const transport = new winston.transports.DailyRotateFile({
  level: "info",
  filename: path.join(__dirname, "logs", "cn-backend-%DATE%.log"),
  datePattern: "YYYY-MM-DD-HH",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "30d",
});

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [transport],
});

module.exports = { logger };

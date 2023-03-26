const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

async function logEvents(message = "something was logged") {
  const date_time = new Intl.DateTimeFormat("en-us", {
    year: "numeric",
    month: "short",
    weekday: "long",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).format(new Date());

  const log_item = `${date_time}\t${crypto.randomUUID()}\t${message}\n`;

  try {
    if (!fs.existsSync(path.join(__dirname, "logs"))) {
      await fsPromises.mkdir(path.join(__dirname, "logs"));
    }
    await fsPromises.appendFile(
      path.join(__dirname, "logs", "event_log.txt"),
      log_item
    );
  } catch (err) {
    console.log(err);
  }
}

module.exports = logEvents;

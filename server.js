const logEvents = require("./logEvents");
const EventEmitter = require("events");
const path = require("path");
const fs = require("fs");
const fsPromises = require("fs").promises;
const http = require("http");

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();

myEmitter.on("log", (msg, logName) => logEvents(msg, logName));

const PORT = process.env.PORT || 3500;

const CONTENT_TYPES = {
  html: "text/html",
  js: "text/javascript",
  css: "text/css",
  json: "application/json",
  png: "image/png",
  jpeg: "image/jpeg",
  txt: "txt/plain",
};

async function serveFile(filePath, contentType, response) {
  try {
    const raw_data = await fsPromises.readFile(
      filePath,
      !contentType.includes("image") ? "utf8" : ""
    );
    const data =
      contentType === CONTENT_TYPES.json ? JSON.parse(raw_data) : raw_data;
    response.writeHead(filePath.includes("404.html") ? 404 : 200, {
      "Content-Type": contentType,
    });
    response.end(data);
  } catch (error) {
    console.log(error);
    response.statusCode = 500;
    myEmitter.emit("log", `${error.name}: ${error.message}`, "error_log.txt");
    response.end(
      contentType === CONTENT_TYPES.json ? JSON.stringify(data) : data
    );
  }
}

function getFilePath(contentType, reqURL) {
  if (contentType === CONTENT_TYPES.html && reqURL === "/") {
    return path.join(__dirname, "views", "index.html");
  } else if (contentType === CONTENT_TYPES.html && reqURL.slice(-1) === "/") {
    console.log(reqURL);
    return path.join(__dirname, "views", reqURL, "index.html");
  } else if (contentType === CONTENT_TYPES.html) {
    return path.join(__dirname, "views", reqURL);
  } else {
    return path.join(__dirname, reqURL);
  }
}

const server = http.createServer((req, res) => {
  console.log(req.url, req.method);

  myEmitter.emit("log", `${req.url}\t${req.method}`, "request_log.txt");

  let extension = path.extname(req.url);
  let contentType;

  switch (extension) {
    case ".js":
      contentType = CONTENT_TYPES.js;
      break;
    case ".css":
      contentType = CONTENT_TYPES.css;
      break;
    case ".png":
      contentType = CONTENT_TYPES.png;
      break;
    case ".jpg":
      contentType = CONTENT_TYPES.jpeg;
      break;
    case ".json":
      contentType = CONTENT_TYPES.json;
      break;
    case ".txt":
      contentType = CONTENT_TYPES.txt;
      break;
    default:
      contentType = CONTENT_TYPES.html;
  }

  let filePath = getFilePath(contentType, req.url);

  if (!extension && req.url !== "/") filePath += ".html";

  const fileExists = fs.existsSync(filePath);

  if (fileExists) {
    //serve file
    serveFile(filePath, contentType, res);
  } else {
    //redirect or throw error page
    serveFile(path.join(__dirname, "views", "404.html"), "text.html", res);
  }
});
server.listen(PORT, () => console.log(`Server started at port ${PORT}`));

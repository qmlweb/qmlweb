"use strict";

/* eslint-env es6 */

const http = require("http");
const url = require("url");
const querystring = require("querystring");
const crypto = require("crypto");
const path = require("path");
const puppeteer = require("puppeteer");
const r2 = require("r2");
const mkdirp = require("mkdirp");

const secret = crypto.randomBytes(64).toString("base64");
const port = 9100;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function mkdirpAsync(dir) {
  return new Promise(resolve => mkdirp(dir, resolve));
}

async function attempt() {
  await sleep(100);
  try {
    const res = await r2.get("http://localhost:9222/json").json;
    for (const item of res) {
      if (item.title === "Karma") return item;
    }
  } catch (e) {
    // Do nothing on a purpose
  }
  return null;
}

async function main() {
  let info;
  while (!info) {
    info = await attempt();
  }
  const browser = await puppeteer.connect({
    browserWSEndpoint: info.webSocketDebuggerUrl
  });
  const pages = await browser.pages();
  const page = pages[0];
  page.evaluate(`
    window.top.chromeScreenshot = async function(options = {}) {
      const response = await fetch(
        "http://localhost:${port}/screenshot" +
        "?rand=" + Math.random().toString(36) +
        "&options=" + encodeURIComponent(JSON.stringify(options)) +
        "&secret=${encodeURIComponent(secret)}"
      );
      const base64 = await response.text();
      return base64;
    };
  `);
  http.createServer((req, res) => {
    (async() => {
      const parsed = url.parse(req.url);
      if (parsed.pathname !== "/screenshot") throw new Error(404);
      const query = querystring.parse(parsed.query);
      if (query.secret !== secret) throw new Error(403);
      const options = query.options ? JSON.parse(query.options) : {};
      const fileName = options.fileName || "";
      if (fileName && !/^[A-Za-z0-9_/]{1,50}\.png$/.test(fileName)) {
        throw new Error(422);
      }
      const offset = options.offset || null;
      const args = { omitBackground: true };
      if (options.fileName && process.env.QMLWEB_SAVE_RENDER) {
        const filepath = `tmp/Render/${options.fileName}`;
        await mkdirpAsync(path.dirname(filepath));
        args.path = filepath;
      }
      if (offset) {
        args.clip = {
          x: parseInt(offset.left, 10),
          y: parseInt(offset.top, 10),
          width: parseInt(offset.width, 10),
          height: parseInt(offset.height, 10)
        };
      }
      return page.screenshot(args);
    })().then(data => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET");
      res.setHeader("Content-Type", "text/plain");
      res.end(data.toString("base64"));
    }).catch(e => {
      const code = /^[0-9]{3}$/.test(e.message) ? parseInt(e.message, 10) : 500;
      res.writeHead(code, { "Content-Type": "text/plain" });
      res.end(`Error ${code}`);
    });
  }).listen(port);
}

main().catch(console.error);


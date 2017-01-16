const fs = require("fs");
const path = require("path");

function include(file, window) {
  const document = window.document;
  const exports = global;
  // eslint-disable-next-line no-eval
  eval(fs.readFileSync(path.join(__dirname, file), "utf-8"));
}

require("jsdom").env("", (err, window) => {
  include("../lib/qmlweb.js", window);
  include("../lib/qmlweb.parser.js", window);

  const document = window.document;
  const file = process.argv[process.argv.length - 1];
  const div = document.createElement("div");
  document.body.appendChild(div);
  var engine = new QmlWeb.QMLEngine(div, {});
  QmlWeb.urlContentCache[file] = fs.readFileSync(file, "utf-8");
  engine.loadFile(file);
  engine.start();
});

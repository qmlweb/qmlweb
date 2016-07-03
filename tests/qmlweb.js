const fs = require('fs');
const path = require('path');

require('jsdom').env('', (err, window) => {
  /* eslint no-eval: 0 */

  const document = window.document;
  const exports = global;
  eval(fs.readFileSync(path.join(__dirname, '../lib/qt.js'), 'utf-8'));
  eval(fs.readFileSync(path.join(__dirname, '../lib/qmlweb.parser.js'), 'utf-8'));

  const file = process.argv[process.argv.length - 1];
  const div = document.createElement('div');
  document.body.appendChild(div);
  var engine = new QmlWeb.QMLEngine(div, {});
  QmlWeb.urlContentCache[file] = fs.readFileSync(file, 'utf-8');
  engine.loadFile(file);
  engine.start();
});

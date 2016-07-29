function importJavascriptInContext(jsData, $context) {
  /* Remove any ".pragma" statements, as they are not valid JavaScript */
  const source = jsData.source.replace(/\.pragma.*(?:\r\n|\r|\n)/, "\n");
  // TODO: pass more objects to the scope?
  new Function("jsData", "$context", `
    with(QmlWeb) with ($context) {
      ${source}
    }
    ${jsData.exports.map(sym => `$context.${sym} = ${sym};`).join("")}
  `)(jsData, $context);
}

QmlWeb.importJavascriptInContext = importJavascriptInContext;

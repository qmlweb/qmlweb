function importJavascriptInContext(jsData, $context) {
  /* Set the QmlWeb.executionContext so that any internal calls to Qt.include
   * will have the proper context */
  const oldExecutionContext = QmlWeb.executionContext;
  QmlWeb.executionContext = $context;
  /* Remove any ".pragma" statements, as they are not valid JavaScript */
  const source = jsData.source.replace(/\.pragma.*(?:\r\n|\r|\n)/, "\n");
  // TODO: pass more objects to the scope?
  new Function("jsData", "$context", `
    with(QmlWeb) with ($context) {
      ${source}
    }
    ${jsData.exports.map(sym => `$context.${sym} = ${sym};`).join("")}
  `)(jsData, $context);
  QmlWeb.executionContext = oldExecutionContext;
}

QmlWeb.importJavascriptInContext = importJavascriptInContext;

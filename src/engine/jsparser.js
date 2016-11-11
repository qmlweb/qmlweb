function importJavascriptInContext(contextSetter, $context) {
  /* Set the QmlWeb.executionContext so that any internal calls to Qt.include
   * will have the proper context */
  const oldExecutionContext = QmlWeb.executionContext;
  QmlWeb.executionContext = $context;
  contextSetter($context);
  QmlWeb.executionContext = oldExecutionContext;
}

QmlWeb.importJavascriptInContext = importJavascriptInContext;

function QMLUrl(val) {
  return QmlWeb.engine.$resolvePath(`${val}`);
}
QMLUrl.plainType = true;
QmlWeb.qmlUrl = QMLUrl;

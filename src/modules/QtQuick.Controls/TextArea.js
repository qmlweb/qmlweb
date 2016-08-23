QmlWeb.registerQmlType({
  module: "QtQuick.Controls",
  name: "TextArea",
  versions: /.*/,
  baseClass: "QtQuick.TextEdit"
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);
    const textarea = this.impl;
    textarea.style.padding = "5px";
    textarea.style.borderWidth = "1px";
    textarea.style.backgroundColor = "#fff";
  }
});

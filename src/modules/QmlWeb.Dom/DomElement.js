QmlWeb.registerQmlType({
  module: "QmlWeb.Dom",
  name: "DomElement",
  versions: /.*/,
  baseClass: "QtQuick.Item",
  properties: {
    tagName: { type: "string", initialValue: "div" }
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    const tagName = meta.object.tagName || "div";
    this.dom = document.createElement(tagName);

    // TODO: support properties, styles, perhaps changing the tagName
  }
});

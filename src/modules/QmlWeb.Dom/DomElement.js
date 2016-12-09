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
    meta.tagName = meta.object.tagName;
    QmlWeb.callSuper(this, meta);

    // TODO: support properties, styles, perhaps changing the tagName
  }
});

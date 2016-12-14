QmlWeb.registerQmlType({
  module: "QtQuick.Controls",
  name: "ApplicationWindow",
  versions: /^1\./,
  baseClass: "QtQuick.Window.Window",
  properties: {
    //contentItem: "ContentItem", // TODO
    menuBar: "MenuBar",
    statusBar: "Item",
    style: "Component",
    toolBar: "Item"
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    // TODO
  }
});

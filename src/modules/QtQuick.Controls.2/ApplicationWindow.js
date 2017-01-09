QmlWeb.registerQmlType({
  module: "QtQuick.Controls",
  name: "ApplicationWindow",
  versions: /^2\./,
  baseClass: "QtQuick.Window.Window",
  properties: {
    font: "font",
    activeFocusControl: "Control",
    background: "Item",
    contentData: "list",
    //contentItem: "ContentItem", // TODO
    footer: "Item",
    header: "Item",
    overlay: "Item"
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    // TODO
  }
});

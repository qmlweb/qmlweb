QmlWeb.registerQmlType({
  module: "QtMultimedia",
  name: "VideoOutput",
  versions: /^5\./,
  baseClass: "QtQuick.Item",
  enums: {
    VideoOutput: { PreserveAspectFit: 0, PreserveAspectCrop: 1, Stretch: 2 }
  },
  properties: {
    autoOrientation: "bool",
    contentRect: "rect",
    fillMode: "enum", // VideoOutput.PreserveAspectFit
    filters: "list",
    orientation: "int",
    source: "variant",
    sourceRect: "rect"
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    // TODO: impl
  }
});

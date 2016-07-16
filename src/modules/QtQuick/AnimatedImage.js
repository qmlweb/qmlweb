registerQmlType({
  module: "QtQuick",
  name: "AnimatedImage",
  versions: /.*/,
  baseClass: "Image"
}, class {
  constructor(meta) {
    callSuper(this, meta);
  }
});

QmlWeb.registerQmlType(class AnimatedImage {
  static module = "QtQuick";
  static versions = /.*/;
  static baseClass = "Image";

  constructor(meta) {
    QmlWeb.callSuper(this, meta);
  }
});

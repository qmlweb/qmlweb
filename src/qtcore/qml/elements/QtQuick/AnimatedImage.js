registerQmlType({
  module:   'QtQuick',
  name:     'AnimatedImage',
  versions: /.*/,
  baseClass: QMLImage,
  constructors: function QMLAnimatedImage(meta) {
    QMLImage.call(this, meta);
  }
});

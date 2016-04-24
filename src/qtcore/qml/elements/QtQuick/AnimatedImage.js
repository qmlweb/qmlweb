registerQmlType({
  module:   'QtQuick',
  name:     'AnimatedImage',
  versions: /.*/,
  baseClass: QMLImage,
  constructor: function QMLAnimatedImage(meta) {
    QMLImage.call(this, meta);
  }
});

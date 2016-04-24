registerQmlType({
  module:   'QtQuick',
  name:     'AnimatedImage',
  versions: /.*/,
  baseClass: 'Image',
  constructor: function QMLAnimatedImage(meta) {
    QMLImage.call(this, meta);
  }
});

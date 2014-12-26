registerQmlType({
  module:   'QtQuick',
  name:     'AnimatedImage',
  versions: /.*/,
  constructors: function QMLAnimatedImage(meta) {
    QMLImage.call(this, meta);
  }
});

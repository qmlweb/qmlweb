function QMLTextArea(meta) {
  callSuper(this, meta);
}

registerQmlType({
  module: 'QtQuick.Controls',
  name: 'TextArea',
  versions: /.*/,
  baseClass: 'QtQuick.TextEdit',
  constructor: QMLTextArea
});

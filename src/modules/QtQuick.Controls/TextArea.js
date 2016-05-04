function QMLTextArea(meta) {
  QMLTextEdit.call(this, meta);
}

registerQmlType({
  module: 'QtQuick.Controls',
  name: 'TextArea',
  versions: /.*/,
  baseClass: 'QtQuick.TextEdit',
  constructor: QMLTextArea
});

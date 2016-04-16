import QtQuick 2.2

Item {
  id: item
  property string contextVar: "42";

  Component.onCompleted: {
    var q = Qt.createQmlObject(
      "import QtQuick 2.2\nimport QtQuick.Controls 1.0\n Rectangle { color: 'green'; width: 320; height: 32; property var q: 22; Text{ color:'gold'; text: 'variable from context = ' + contextVar} }",
      item,
      "inlinecode1"
    );
  }
}

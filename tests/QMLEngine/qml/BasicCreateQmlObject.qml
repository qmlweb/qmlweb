import QtQuick 2.2

Item {
  id: item
  Component.onCompleted: {
    var q = Qt.createQmlObject(
      "import QtQuick 2.2\nimport QtQuick.Controls 1.0\n Rectangle { color: 'green'; width: 320; height: 32; property var q: 22; Text{ color:'gold'; text: 'I am an item created by createQmlObject'} }",
      item,
      "inlinecode1",
      __executionContext
    );
  }
}

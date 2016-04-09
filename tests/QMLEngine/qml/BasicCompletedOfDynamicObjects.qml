import QtQuick 2.0

Rectangle {
  color: "red"
  id: item
  
  Component.onCompleted: {
    Qt.createQmlObject(
      "import QtQuick 2.2\nItem { Component.onCompleted: parent.color = 'cyan'; }",
      item,
      "inlinecode1",
      __executionContext
    );
  }
}

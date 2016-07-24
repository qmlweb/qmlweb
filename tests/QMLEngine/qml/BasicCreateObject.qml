import QtQuick 2.2

Item {
  id: item
  property string contextVar: "42";

  Component.onCompleted: {
    var c = Qt.createComponent("BasicCreateObjectSomeComponent.qml")
    c.createObject(item)
  }
}

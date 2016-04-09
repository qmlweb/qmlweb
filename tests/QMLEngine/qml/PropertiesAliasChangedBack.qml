import QtQuick 2.0
import QtQuick.Controls 1.1

Item {
  property alias thechild: child
  property alias childData: child.somedata

  Rectangle {
    id: child
    x: somedata[0]
    y: somedata[1]
    property var somedata: [0,0]

    color: "red"; width: 64; height: 64
  }

  function go() {
    childData[0] = 100;
    childDataChanged();
  }

  Column {
    Button {
      text: "go!"
      onClicked: go();
    }
  }
}

import QtQuick 1.0;

Rectangle {
  color: "black";
  height: parent.height / 2 > 100 ? 100 : parent.height / 2;

  ListModel {
    id: menuEntries

    ListElement { label: "Menu Entry #1" }
    ListElement { label: "Menu Entry #2" }
    ListElement { label: "Menu Entry #3" }
  }

  Image {
    id: logo
    source: '/images/go-previous.png'
    anchors {
        top: parent.top
        bottom: parent.bottom
        left: parent.left
        right: parent.left + 140
        anchors.margins: 10
    }
  }

  ListView {
    model: menuEntries
    orientation: Qt.Horizontal
    spacing: 5
    delegate: Rectangle {
      width: 150
      height: 40
      color: "yellow"
      border.width: 1
      border.color: "white"
      Text {
        id: entryText
        anchors.centerIn: parent
        text: menuEntries.get(index).label
      }
    }
  }
}

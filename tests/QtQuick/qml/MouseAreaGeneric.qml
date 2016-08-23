import QtQuick 2.0

Rectangle {
  width: 20
  height: 20
  property bool pressed: mouse_area.pressed
  property Item area: mouse_area
  property int clicks: 0
  MouseArea {
    id: mouse_area
    width: 10
    height: 10
    onClicked: parent.clicks++
  }
}

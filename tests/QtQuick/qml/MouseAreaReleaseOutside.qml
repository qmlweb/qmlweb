import QtQuick 2.0

Item {
  width: 20
  height: 20
  property bool pressed: mouse_area.pressed
  MouseArea {
    id: mouse_area
    width: 10
    height: 10
  }
}

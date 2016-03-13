import QtQuick 2.0
import "../../common"

Rectangle {
  width: 200
  height: 300
  color: "orange"
  Rectangle {
    width: 30
    height: 30
    anchors.centerIn: parent
    color: "red"
  }
  RenderTest { delay: 1000; timeout: 3000 }
}

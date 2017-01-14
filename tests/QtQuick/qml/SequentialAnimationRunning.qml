import QtQuick 2.0

Rectangle {
  id: rect
  width: 300
  height: 300
  property Item area: mouse_area
  SequentialAnimation {
    id:ani
    ColorAnimation { target: rect; property: "color"; to: 'red'; duration: 100 }
    ColorAnimation { target: rect; property: "color"; duration: 100 }
    ColorAnimation { target: rect; property: "color"; to: 'green'; duration: 100 }
  }
  MouseArea{
    id: mouse_area
    onClicked: ani.running = !ani.running
    anchors.fill: parent;
  }
}

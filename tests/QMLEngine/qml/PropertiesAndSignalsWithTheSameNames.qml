import QtQuick 2.5
Item {
  property bool pressed: false
  property bool signalCaught: false
  property Item area: mouse_area
  signal pressed()
  MouseArea
  {
    id: mouse_area
    anchors.fill: parent
    onClicked:
    {
      parent.pressed()
    }
  }
  onPressed:
  {
    signalCaught = true;
  }
}

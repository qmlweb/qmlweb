import QtQuick 2.0

Item {
  property bool gotX
  property bool gotY
  
  Behavior on x {
    NumberAnimation {
      duration: 200
    }
  }
  Behavior on y {
    enabled: false
    NumberAnimation {
      duration: 200
    }
  }
  onXChanged: if (x > 0 && x < 1) gotX = true;
  onYChanged: if (y > 0 && y < 1) gotY = true;
  Component.onCompleted: x = y = 1;
}

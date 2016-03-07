import QtQuick 2.0

Rectangle {
  color: 'green'
  width: 60; height: 50

  Rectangle {
    width: 50; height: 50
    color: "#00f"
    transform: Scale {
      origin.x: 20
      origin.y: 15
      xScale: 0.5
      yScale: 0.8
    }
  }
}

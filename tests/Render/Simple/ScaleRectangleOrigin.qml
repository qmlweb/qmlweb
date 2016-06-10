import QtQuick 2.0

Rectangle {
  color: 'green'
  width: 60; height: 50

  Rectangle {
    width: 50; height: 50
    color: "#00f"
    transform: Scale {
      xScale: 0.5
      yScale: 0.8
    }
  }

  Rectangle {
    width: 50; height: 50
    color: "red"
    transform: Scale {
      origin.x: 0
      origin.y: 0
      xScale: 0.4
      yScale: 0.3
    }
  }
}

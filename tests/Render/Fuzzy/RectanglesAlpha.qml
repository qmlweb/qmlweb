import QtQuick 2.0

// Fuzzy because opacity color rounding could differ between implementations

Rectangle {
  width: 100
  height: 100
  color: '#fff'
  Item {
    opacity: 0.9
    Rectangle {
      color: '#6000ff00'
      width: 50
      height: 50
      opacity: 0.5
    }
    Rectangle {
      color: '#9000ff'
      width: 50;
      height: 50
      x: 25; y: 25
    }
    Rectangle {
      color: Qt.rgba(1, 0.4, 0.4, 0.9)
      width: 50;
      height: 50
      x: 70; y: 20
    }
  }
}

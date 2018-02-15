import QtQuick 2.0

// Fuzzy because opacity color rounding could differ between implementations

Rectangle {
  width: 100
  height: 100
  color: '#fff'
  Item {
    opacity: 0.5
    Rectangle {
      color: '#0f0'
      width: 50
      height: 50
    }
    Rectangle {
      color: '#ff0000'
      width: 50;
      height: 50
      x: 25; y: 25
    }
    Rectangle {
      color: '#00f'
      width: 50;
      height: 50
      x: 70; y: 20
    }
  }
}

import QtQuick 2.5

Rectangle {
  width: 85
  height: 15
  color: 'green'

  Rectangle {
    width: 10
    height: 10
  }
  Rectangle {
    width: 11
    height: 10
    x: 15
    border.color: 'red'
  }
  Rectangle {
    width: 10
    height: 12
    x: 30
    border.width: 2
  }
  Rectangle {
    // no width/heigth is set but border is set
    x: 45
    color: 'orange'
    border.width: 1
  }
  Rectangle {
    x: 60
    border.width: 0
    border.color: 'red'
    width: 10
    height: 10
  }
  Rectangle {
    x: 75
    border.width: 2
    width: 0
    height: 0
  }
}

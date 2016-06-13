import QtQuick 2.5

Rectangle {
  width: 75
  height: 21
  color: 'green'

  Rectangle {
    width: 5
    height: 10
  }
  Rectangle {
    width: 11
    height: 10
    x: 15
    border.color: "#27c1cf"
  }
  Rectangle {
    width: 10
    height: 10
    x: 30
    border.width: 2
  }
  Rectangle {
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
    x: 0
    y: 11
    border.width: 20
    border.color: 'red'
    width: 10
    height: 10
  }
  Rectangle {
    x: 15
    y: 11
    border.width: -20
    border.color: 'pink'
    width: 10
    height: 10
  }
  Rectangle {
    x: 30
    y: 11
    border.width: 3
    border.color: 'red'
    width: -10
    height: 10
  }
  Rectangle {
    x: 45
    y: 11
    color: 'red'
    border.width: 3
    border.color: 'transparent'
    width: 10
    height: 10
  }
}

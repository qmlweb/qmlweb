import QtQuick 2.0

Rectangle {
    width: 90
    height: 10
    color: 'yellow'

    Rectangle {
      width: 0
      height: 10
      color: 'pink'
    }
    Rectangle {
      width: 10
      height: 0
      color: 'brown'
    }
    Rectangle {
      width: 0
      height: 0
      x: 10
      color: 'blue'
    }
    Rectangle {
      implicitWidth: 10
      implicitHeight: 10
      x: 20
      color: 'red'
    }
    Rectangle {
      width: 5
      height: 10
      implicitWidth: 10
      implicitHeight: 5
      x: 30
      color: 'pink'
    }
    Rectangle {
      width: 0
      height: 0
      implicitWidth: 10
      implicitHeight: 10
      x: 40
      color: 'orange'
    }
    Rectangle {
      implicitWidth: -5
      implicitHeight: 10
      x: 50
      color: "#00ffee"
    }
    Rectangle {
      width: 10
      implicitHeight: 10
      x: 60
      color: 'gray'
    }
    Rectangle {
      height: 10
      implicitWidth: 10
      x: 70
      color: 'green'
    }
}

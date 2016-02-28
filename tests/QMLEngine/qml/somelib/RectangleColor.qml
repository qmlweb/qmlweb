import QtQuick 2.0
import "." // import "" is not correct, qmlscene says

Rectangle {
  color: 'green'
  width: 100
  height: 100
  ShinyButton {
    x: 10
    y: 10
  }
}

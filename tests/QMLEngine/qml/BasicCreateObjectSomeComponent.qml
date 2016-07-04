import QtQuick 2.2
import QtQuick.Controls 1.0

Rectangle {
  color: 'green'
  width: 320
  height: 32

  property var q: 22

  Text {
    color:'gold'
    text: 'variable from context = ' + contextVar
  }
}

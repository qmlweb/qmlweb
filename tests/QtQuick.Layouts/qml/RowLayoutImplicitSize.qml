import QtQuick 2.0
import QtQuick.Layouts 1.0

RowLayout {
  spacing: 0

  Rectangle {
    color: "red"
    implicitHeight: 20
    implicitWidth: 30
  }
  Rectangle {
    color: "green"
    implicitHeight: 25
    Layout.preferredWidth: 21
  }
  Rectangle {
    color: "blue"
    implicitHeight: 23
    implicitWidth: 31
  }
}


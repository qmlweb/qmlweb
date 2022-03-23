import QtQuick 2.0
import QtQuick.Layouts 1.0

ColumnLayout {
  spacing: 0

  Rectangle {
    color: "red"
    implicitHeight: 20
    implicitWidth: 30
  }
  Rectangle {
    color: "green"
    Layout.preferredHeight: 21
    implicitWidth: 25
  }
  Rectangle {
    color: "blue"
    implicitHeight: 23
    implicitWidth: 31
  }
}

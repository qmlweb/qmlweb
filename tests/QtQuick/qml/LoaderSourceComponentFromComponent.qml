import QtQuick 2.0

Loader {
  height: 30
  width: 30
  sourceComponent: leComponent

  Component {
    id: leComponent
    Rectangle {
      color: "yellow"
    }
  }
}

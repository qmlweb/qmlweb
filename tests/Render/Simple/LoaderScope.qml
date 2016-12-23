import QtQuick 2.0

Rectangle {
  id: root
  width: 30
  height: 30
  color: 'red'

  Loader {
    anchors.fill: parent
    source: 'res/LoaderScopeChild.qml'
  }
}

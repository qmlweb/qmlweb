import QtQuick 2.0

Loader {
  Component.onCompleted: {
    sourceComponent = Qt.createComponent("LoaderComponent.qml");
  }
}

import QtQuick 2.0

Loader {
  source: "LoaderComponent.qml"
  Component.onCompleted: {
    source = ""
  }
}

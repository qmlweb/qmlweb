import QtQuick 2.0

Item {
  property url localBindingSimple: "localBindingSimple.png"
  property url localBinding: "local" + "Binding.png"
  property url localSet
  property url remoteBindingSimple
  property url remoteBinding
  property url remoteSet
  Component.onCompleted: {
    localSet = "localSet.png"
  }
}

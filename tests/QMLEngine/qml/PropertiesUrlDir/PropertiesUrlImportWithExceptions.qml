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
  /* These are required as they force some slots to run in this context when
   * things are done in PropertiesUrlExceptionSafe. This tests that running
   * slots that throw an exception in this context doesn't have any unintended
   * consequences. */
  onLocalSetChanged: {
      throw "Some Exception"
  }
  onLocalBindingSimpleChanged: {
      throw "Some Exception"
  }
  onLocalBindingChanged: {
      throw "Some Exception"
  }
  onRemoteSetChanged: {
      throw "Some Exception"
  }
  onRemoteBindingSimpleChanged: {
      throw "Some Exception"
  }
  onRemoteBindingChanged: {
      throw "Some Exception"
  }
}

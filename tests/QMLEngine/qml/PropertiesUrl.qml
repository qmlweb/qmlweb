import QtQuick 2.0
import "PropertiesUrlDir"

Item {
  property alias localBindingSimple: properties_url_import.localBindingSimple
  property alias localBinding: properties_url_import.localBinding
  property alias localSet: properties_url_import.localSet
  property alias remoteBindingSimple: properties_url_import.remoteBindingSimple
  property alias remoteBinding: properties_url_import.remoteBinding
  property alias remoteSet: properties_url_import.remoteSet
  property url http: "http://http-url"
  property url aboutBlank: "about:blank"
  property url absolute: "/absolute-url"
  property url unset
  property url setToEmptyString: "will-be-empty-string"
  Component.onCompleted: {
    setToEmptyString = ""
  }
  PropertiesUrlImport {
    id: properties_url_import
    remoteBindingSimple: "remoteBindingSimple.png"
    remoteBinding: "remote" + "Binding.png"
    Component.onCompleted: {
      properties_url_import.remoteSet = "remoteSet.png"
    }
  }
}

import QtQuick 2.0
import QmlWeb.Dom 1.0

DomElement {
  property int bindSize: 21
  style.textAlign: "center"
  style.fontSize: bindSize + "px"
  text: "Hello HTML"
}

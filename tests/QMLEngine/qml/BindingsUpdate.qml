import QtQuick 2.0

Item {
  property int intA: 10
  property int intB: intA * 2
  property string textA: "hello"
  property string textB: textA + " world"
  property size size: Qt.size(1, 2)
  property real sizeWidth: size.width
  property real sizeHeight: size.height
}

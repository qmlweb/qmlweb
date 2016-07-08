import QtQuick 2.0

Item {
  property int intProperty: 10
  property double doubleProperty: 0.5
  property string stringProperty: "hello"
  property Item itemProperty: Item { }
  property var arrayProperty: [1, 2, "bar"]
  property int hexProperty: 0xFF
  property int octProperty: 077
  property double bigNumber: 1e8
  property size sizeProperty: Qt.size(5, 6)
}

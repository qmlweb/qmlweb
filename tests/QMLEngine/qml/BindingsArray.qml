import QtQuick 2.0

Item {
  id: main
  property int value: 5
  property bool novalue
  property variant arr: [1, 2, "hello world", [1, 2, false]]
  property variant bindingArray: [1, 2, "hello world", [+1, main.value - 3, novalue]]
  property string text: "Value=" + value
}

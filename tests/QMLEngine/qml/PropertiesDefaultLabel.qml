import QtQuick 2.2

Text {
  default property var someText
  text: "Hello, " + someText.text
}

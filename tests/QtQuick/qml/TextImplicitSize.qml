import QtQuick 2.0

Item {
  property alias text_item: _text_item
  Rectangle {
    Text {
      id: _text_item
      text: "_ _ _"
    }
  }
}

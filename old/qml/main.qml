import QtQuick 1.0;
import "jsfile.js" as Logic;

Rectangle {
  id: base
  color: 'red'

  Menu {
    id: menu
    anchors {
      top: parent.top
      left: parent.left
      right: parent.right
    }
  }

  TextInput {
    id:   textinput
    text: "Placeholder"
    anchors {
      top: menu.bottom
      left: parent.left
      right: parent.right
    }
    maximumLength: 5
    readOnly: false
    validator: RegExpValidator { regExp: /a+/ }
    onAccepted: {
      Logic.main();
      textinput.readOnly = true;
    }
  }

  NextButton {
    height: parent.height
    width:  parent.width / 2

    anchors.top:    textinput.bottom
    anchors.left:   parent.left
    anchors.bottom: parent.bottom

    source: '/images/go-previous.png'
  }

  NextButton {
    height: parent.height
    width:  parent.width / 2

    anchors.top:    textinput.bottom
    anchors.right:  parent.right
    anchors.bottom: parent.bottom

    color: 'blue'
  }
}

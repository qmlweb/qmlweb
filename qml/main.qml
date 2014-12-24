import Qt 5.4;
import "jsfile.js" as Logic;

Rectangle {
  id: base
  color: 'red'

  TextInput {
    id:   textinput
    text: "Placeholder"
    anchors {
      left: parent.left
      right: parent.right
    }
    maximumLength: 5
    readOnly: false
    validator: RegExpValidator { regExp: /a+/ }
    onAccepted: {
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

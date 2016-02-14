import QtQuick 1.1

Rectangle {
    id: page
    color: "white"
    width: 500; height: 200

    Text {
        id: title
        anchors.horizontalCenter: page.horizontalCenter
        font.pointSize: 16
        text: "Widget Gallery"
    }
    Text {
        anchors.horizontalCenter: page.horizontalCenter
        anchors.top: title.bottom
        text: "(DOM-Backend only)"
    }

    Text {
        id: hint
        x: 20
        y: 50
    }

    TextInput {
        text: "TextInput"
        width: 200
        x: 30
        y: 80

        onAccepted: {
            hint.text = text;
        }
    }

    Button {
        text: "Button"
        width: 100
        x: 30
        y: 120

        onClicked: {
            console.log ("HAAAAAALO");
            hint.text = "You clicked the Button!";
        }
    }

    CheckBox {
        id: checkbox
        text: "<b>Checkbox</b>"
        width: 150
        x: 30
        y: 150
        color: "grey"

        Rectangle {
            width: 20
            height: 20
            color: "grey"
            radius: 10
            anchors { verticalCenter: parent.verticalCenter; right: parent.right }
            css.boxShadow: "0 0 10px 1px #800"
            css.color: "white"
            css.textAlign: "center"
            dom.innerHTML: ":)"
        }
    }

    TextArea {
        x: 280
        y: 80
        width: 200
        height: 100
        text: "Hi,\nI'm a TextArea!\n" + "The checkbox is " + (checkbox.checked ? "" : "not ") + "checked."
        font.bold: true
    }

    Text {
        anchors.bottom: page.bottom
        color: "red"
        text: "More Widgets to follow..."
    }
}
 

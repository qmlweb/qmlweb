import QtQuick 2.0
import QtQuick.Controls 1.0

Rectangle {
    id: root
    color: 'white'
    width: 500

    Title { id: title ; title: 'Widgets' }

    Rectangle {
        id: grid
        width: 190
        height: 120
        anchors.top: title.bottom
        anchors.topMargin: 20
        anchors.horizontalCenter: title.horizontalCenter
        border.width: 1
        border.color: 'red'
        Grid {
            anchors.centerIn: parent
            columns: 3
            spacing: 10
            Rectangle { color: 'red'; width: 50; height: 50 }
            Rectangle { color: 'green'; width: 50; height: 50 }
            Rectangle { color: 'blue'; width: 50; height: 50 }
            Rectangle { color: 'cyan'; width: 50; height: 50 }
            Rectangle { color: 'magenta'; width: 50; height: 50 }
            Image { source: 'images/lizard.jpg'; width: 50; height: 50 }
        }
    }

    Button {
        id: button
        text: 'Button'
        width: 100
        anchors.horizontalCenter: title.horizontalCenter
        anchors.top: grid.bottom
        anchors.topMargin: 10

        onClicked: {
            info.text = 'You clicked the Button!';
        }
    }

    TextInput {
        id: in_text
        text: 'TextInput'
        width: 200
        anchors.top: button.bottom
        anchors.topMargin: 10
        anchors.left: grid.left

        onAccepted: {
            info.text = text;
            text_edit.text = text;
        }
    }

    Text {
        id: info
        anchors.left: in_text.left
        anchors.top: in_text.bottom
        anchors.topMargin: 10
        color: 'red'
        font.pointSize: 16
        text: 'Info'
    }


    CheckBox {
        id: checkbox
        text: '<b>Checkbox</b>'
        width: 150
        color: 'grey'
        anchors.top: info.bottom
        anchors.topMargin: 10
        anchors.left: grid.left

        Rectangle {
            width: 20
            height: 20
            color: 'grey'
            radius: 10
            anchors {
                verticalCenter: parent.verticalCenter
                right: parent.right
            }
            css.boxShadow: '0 0 10px 1px #800'
            css.color: 'white'
            css.textAlign: 'center'
            dom.innerHTML: 'X'
        }
    }

    TextArea {
        id: text_area
        x: 280
        y: 280
        width: 200
        height: 100
        anchors.top: checkbox.bottom
        anchors.topMargin: 10
        anchors.left: grid.left
        font.bold: true

        text: 'Hi,\nI am a TextArea!\n\n' + 'The checkbox is '
            + (checkbox.checked ? '' : 'not ') + 'checked.'
    }

    Text {
        id: final
        anchors.horizontalCenter: root.horizontalCenter
        anchors.bottom: root.bottom
        anchors.bottomMargin: 30
        color: 'red'
        font.pointSize: 20
        text: '<u>More Widgets to follow ...</u>'
    }

    TextEdit {
        id: text_edit
        x: 280
        y: 280
        width: 200
        height: 100
        anchors.top: text_area.bottom
        anchors.topMargin: 10
        anchors.left: grid.left
        font.pointSize: 12
        font.italic: true
        color: 'red'

        text: 'Hi,\nI am a TextEdit in making!\n\nMy char count is '
            + length + '\nI have '
            + lineCount + ' lines \nselectByKeyboard ' + selectByKeyboard
            + '\nselectByMouse ' + selectByMouse
    }
}

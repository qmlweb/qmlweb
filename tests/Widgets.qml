import QtQuick 2.0
import QtQuick.Controls 1.0

Rectangle {
    color: 'white'
    width: 500
    height: 700

    Title { id: title_WG ; title: 'Widgets' }

    Rectangle {
        id: grid_WG
        width: 190
        height: 120
        anchors.top: title_WG.bottom
        anchors.topMargin: 20
        anchors.horizontalCenter: title_WG.horizontalCenter
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
        id: button_WG
        text: 'Button'
        width: 100
        anchors.horizontalCenter: title_WG.horizontalCenter
        anchors.top: grid_WG.bottom
        anchors.topMargin: 10

        onClicked: {
            info_WG.text = 'You clicked the Button!';
        }
    }

    TextInput {
        id: input_WG
        text: 'TextInput'
        width: 200
        anchors.top: button_WG.bottom
        anchors.topMargin: 10
        anchors.left: grid_WG.left

        onAccepted: {
            info_WG.text = text;
            edit_WG.text = text;
        }

        focus: true
        Keys.onPressed: {
            if (event.key != Qt.Key_Enter) {
                var names = Object.getOwnPropertyNames(event), out = []
                for (var n = 0; n < names.length; n++ )
                    out.push(names[n] + ' : ' + event[names[n]]);
                edit_WG.text = out.join('\n');
            }
        }
    }

    Text {
        id: info_WG
        anchors.left: input_WG.left
        anchors.top: input_WG.bottom
        anchors.topMargin: 10
        color: 'red'
        font.pointSize: 16
        text: 'Info'
    }


    CheckBox {
        id: checkbox_WG
        text: '<b>Checkbox</b>'
        width: 150
        color: 'grey'
        anchors.top: info_WG.bottom
        anchors.topMargin: 10
        anchors.left: grid_WG.left

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
        id: area_WG
        width: 300
        height: 100
        anchors.top: checkbox_WG.bottom
        anchors.topMargin: 10
        anchors.left: grid_WG.left
        font.bold: true

        text: 'Hi,\nI am a TextArea!\n\n' + 'The checkbox is '
            + (checkbox_WG.checked ? '' : 'not ') + 'checked.'
    }

    TextEdit {
        id: edit_WG
        width: 300
        height: 200
        anchors.top: area_WG.bottom
        anchors.topMargin: 10
        anchors.left: grid_WG.left
        font.pointSize: 12
        font.italic: true
        color: 'red'

        text: 'Hi,\nI am a TextEdit in making!\n\nMy char count is '
            + length + '\nI have '
            + lineCount + ' lines \nselectByKeyboard ' + selectByKeyboard
            + '\nselectByMouse ' + selectByMouse
    }

    ComboBox {
        width: 50
        height: 20
        anchors.top: checkbox_WG.top
        anchors.left: checkbox_WG.right + 20

        model: [
        'HelloWorld', 'RectangleX', 'TextX', 'ImageX', 'ListViewX',
        'AnimationX', 'Widgets', 'Plugins', 'ColumnRow', 'TextEditX',
        'LoaderX', 'Demo', 'CanvasX', 'PathViewX',
        [ 123, 'abc', 234, 'def', 345 ]]

        //onDataChanged { alert(model.length) }

        onAccepted: {
            info_WG.text = 'Item at index ' + (currentIndex+1) + ' is ' + currentText;
        }

        onActivated: {
            info_WG.text += '\ncurrent index = ' + (index+1)
        }
    }
}

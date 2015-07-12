import QtQuick 2.0

Rectangle {
    id: page
    color: 'white'
    width: 500; height: 500

    Text {
        id: title
        anchors.horizontalCenter: page.horizontalCenter
        font.pointSize: 28
        font.bold: true
        color: '#00a'
        text: '<b><u>Plugin Example</u></b>'
    }

    TestPlugin {
        id: plugin
        name: 'Example Plugin'
        data: [1, 2, 'three', 4, '+++']
        anchors.top: title.bottom + 30
        anchors.left: title.left
        onDataChanged: {
            testPluginSignal()
        }
        onTestPluginSignal: {
            dom.textContent = data
        }
    }

    Text {
        id: child
        anchors.top: plugin.bottom + 50
        anchors.horizontalCenter: page.horizontalCenter
        font.pointSize: 20
        font.bold: true
        color: '#a0a'
        text: plugin.name
    }

    TextInput {
        id: in_text
        text: 'TextInput'
        width: 200
        anchors.top: child.bottom + 30
        anchors.left: child.left

        onAccepted: {
            plugin.data = text;
        }
    }
}
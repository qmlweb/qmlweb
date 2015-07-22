import QtQuick 2.0

Rectangle {
    color: 'white'
    width: 500
    height: 500

    Title { id: title_PL ; title: 'Plugins' }

    TestPlugin {
        id: plugin_PL
        name: 'Example Plugin'
        data: [1, 2, 'three', 4, '+++']
        anchors.top: title_PL.bottom + 30
        anchors.left: title_PL.left
        onDataChanged: {
           dom.textContent = data
           //testPluginSignal()
        }
        //onTestPluginSignal: {
        //    dom.textContent = data
        //}
    }

    Text {
        id: child_PL
        anchors.top: plugin_PL.bottom + 50
        anchors.horizontalCenter: parent.horizontalCenter
        font.pointSize: 20
        font.bold: true
        color: '#a0a'
        text: plugin_PL.name
    }

    TextInput {
        id: input_PL
        text: 'TextInput'
        width: 200
        anchors.top: child_PL.bottom + 30
        anchors.left: child_PL.left

        onAccepted: {
            plugin_PL.data = text;
        }
    }
}
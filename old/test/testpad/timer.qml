import QtQuick 2.0

Item {
    width: 600; height: 400
    Text {
        id: t
    }
    Timer {
        interval: 2000
        running: true
        onTriggered: {
            t.text += 'ontriggered, running: ' + running + '\n';
        }
        onRunningChanged: {
            t.text += 'running changed, running: ' + running + '\n';
        }
    }
}
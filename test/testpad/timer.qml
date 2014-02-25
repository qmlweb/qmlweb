import QtQuick 2.0

Item {
    id: gui
    width: ((typeof parent !== 'undefined') && (parent !== null) && parent.width) ? parent.width : 1366
    height: ((typeof parent !== 'undefined') && (parent !== null) && parent.height) ? parent.height : 768

    Timer {
            interval: 2000
            running: true
            onTriggered: {
                    console.log('ontriggered, running: ' + running);
            }
            onRunningChanged: {
                    console.log('running changed, running: ' + running);
            }
    }
}
import QtQuick 2.0

Item {
    id: root

    property int internal_created
    property int internal_destroyed

    Repeater {
        id: repeater
        Item {
            Repeater {
                model: 1
                Rectangle {
                    Component.onCompleted: {
                        root.internal_created++
                    }
                    Component.onDestruction: {
                        root.internal_destroyed++
                    }
                }
            }
        }
    }

    Component.onCompleted: {
        repeater.model = 1
        repeater.model = 0
        repeater.model = 2
        repeater.model = 0
    }
}

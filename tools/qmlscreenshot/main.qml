import QtQuick 2.4
import QtQuick.Window 2.2

Window {
    visible: true

    opacity: 1

    Loader {
        id: qmlLoader
        active: true
        source: inputQmlFile
        onLoaded: {
            parent.width = qmlLoader.item.width
            parent.height = qmlLoader.item.height
        }
    }

    Timer {
        id: timer
        interval: 1500
        repeat: false
        onTriggered: {
            if (qmlLoader.item) {
                qmlLoader.item.grabToImage(function (result) {
                    result.saveToFile(outImageFile)
                    Qt.quit()
                })
            }
        }
    }

    Component.onCompleted: {
        timer.start()
    }
}

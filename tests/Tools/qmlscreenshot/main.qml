import QtQuick 2.4
import QtQuick.Window 2.2

Window {
    visible: true

    Loader {
        id: qmlLoader
        active: true
        source: inputQmlFile
        onLoaded: {
            parent.width = qmlLoader.item.width
            parent.height = qmlLoader.item.height
        }
    }

    Component.onCompleted: {
        if (qmlLoader.item) {
            qmlLoader.item.grabToImage(function (result) {
                result.saveToFile(outImageFile)
                Qt.quit()
            })
        }
    }
}

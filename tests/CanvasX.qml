import QtQuick 2.0

Rectangle {
    color: 'white'
    width: 700
    height: 700

    Title { id: title_CN ; title: 'Canvas' }
    NotImplemented { anchors.top: title_CN.bottom + 25 }
    Item {}
    Canvas {
        id: canvas_CN
        onCompleted: {
            alert(objList(canvas_CN, 'Canvas').join('\n'))
        }
    }
}

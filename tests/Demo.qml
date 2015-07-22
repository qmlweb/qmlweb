import QtQuick 2.0

Rectangle {
    height: 7*450
    color: 'white'
    Title { id: title_DM ; title: 'Demo' }

    Grid {
        width: 450
        height: 500
        anchors.top: title_DM.bottom + 50
        //anchors.horizontalCenter: parent.horizontalCenter
        columns: 2
        spacing: 2

        HelloWorld { scale: 400/width }
        RectangleX { scale: 400/width }
        TextX { scale: 400/width }
        ImageX { scale: 400/width }

        ListViewX { scale: 400/width }
        AnimationX { scale: 400/width }
        Widgets { scale: 400/width }
        Plugins { scale: 400/width }

        ColumnRow { scale: 400/width }
        TextEditX { scale: 400/width }
        LoaderX { scale: 400/width }
        CanvasX { scale: 400/width }

        PathViewX { scale: 400/width }
     }
}

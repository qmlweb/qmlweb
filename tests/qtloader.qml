import QtQuick 2.5
import QtQuick.Window 2.0
Window {
    id: window
    visible: true
    minimumWidth: 0
    minimumHeight: 0
    flags: Qt.FramelessWindowHint

    Loader{
        opacity: 1
        anchors.centerIn: parent
        id: loader
        source: "../" + script

        onLoaded: {
            window.height = item.height
            window.width = item.width

            if(item.start !== undefined)
                item.start()
            for(var i in item.data){
                var child = item.data[i]
                if(child.__isTest){
                  child.compareRender = compare
                  child.start()
                }
            }


        }

        function compare(tag, callback){
            //console.log(source);
            var path = source.toString()
                .replace(".qml", "")
                //.replace("file:///", "") //only on windows
                .replace("file://", "")
            if(tag)
                path = path + "-" + tag

            console.log("COMPARE")
            screenshot.shootFull(path+ ".png", window)
            callback(true) //doesnt compare in qt only generate image
        }
    }

}

import QtQuick 1.0

Rectangle {
    id: page
    width: 500; height: 400
    color: "lightgray"

    Video {
        width: 400
        height: 300
        anchors.centerIn: page
        source: "http://www.w3schools.com/html/mov_bbb.mp4"
        autoPlay : true
    }

}

import QtQuick 1.0

Rectangle {
    id: page
    width: 500; height: 400
    color: "lightgray"

    Row {
      y: 10
      anchors.horizontalCenter: page.horizontalCenter

      Button {
        text: "Play/pause"
        //onClicked: video.playbackState == MediaPlayer.PlayingState ? video.pause() : video.play();
        onClicked: video.ispaused ? video.play() : video.pause()
      }
      Button {
        text: "Big"
        onClicked: video.width = 560;
      }      
      Button {
        text: "Small"
        onClicked: video.width = 320;        
      }            
      Button {
        text: "Normal"
        onClicked: video.width = 420;        
      }            
    }

    Video {
        id: video
        width: 420
        height: 300
        anchors.centerIn: page
        source: "http://www.w3schools.com/html/mov_bbb.mp4"
        autoPlay : true
        controls: true
    }

}

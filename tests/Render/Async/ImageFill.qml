import QtQuick 2.7

Rectangle {
  width: 40
  height: 40
  color: '#fff'
  property int loaded: 0

  Image {
    x: 0
    y: 0
    height: 20
    width: 20
    source: "bg.png"
    fillMode: Image.Stretch
    smooth: false
    onStatusChanged: if (status !== Image.Loading) parent.loaded++
  }
  Image {
    x: 0
    y: 20
    height: 20
    width: 20
    source: "bg.png"
    fillMode: Image.Tile
    smooth: false
    onStatusChanged: if (status !== Image.Loading) parent.loaded++
  }
  Image {
    x: 20
    y: 0
    height: 20
    width: 20
    source: "bg.png"
    fillMode: Image.PreserveAspectCrop
    smooth: false
    onStatusChanged: if (status !== Image.Loading) parent.loaded++
  }
  Image {
    x: 20
    y: 20
    height: 20
    width: 20
    source: "bg.png"
    fillMode: Image.PreserveAspectFit
    smooth: false
    onStatusChanged: if (status !== Image.Loading) parent.loaded++
  }

  onLoadedChanged: {
    if (typeof window !== 'undefined' && loaded === 4) {
      window.onTestLoad({ framesDelay: 2 });
    }
  }
}

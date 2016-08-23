import QtQuick 2.7

Rectangle {
  width: 16
  height: 10
  color: '#fff'
  property int loaded: 0

  Image {
    x: 0
    y: 0
    height: 10
    width: 4
    source: "bg.png"
    smooth: false
    onStatusChanged: if (status !== Image.Loading) parent.loaded++
  }
  Image {
    x: 4
    y: 0
    height: 10
    width: 4
    source: "bg.png"
    fillMode: Image.Stretch
    smooth: false
    mirror: true
    onStatusChanged: if (status !== Image.Loading) parent.loaded++
  }
  Image {
    id: image3
    x: 8
    y: 0
    height: 10
    width: 4
    source: "bg.png"
    fillMode: Image.Tile
    smooth: false
    onStatusChanged: if (status !== Image.Loading) parent.loaded++
  }
  Image {
    id: image4
    x: 12
    y: 0
    height: 10
    width: 4
    source: "bg.png"
    fillMode: Image.Tile
    smooth: false
    onStatusChanged: if (status !== Image.Loading) parent.loaded++
  }

  onLoadedChanged: {
    image3.mirror = true;
    image4.mirror = true;
    image4.mirror = false;
    if (typeof window !== 'undefined' && loaded === 4) {
      window.onTestLoad({ framesDelay: 2 });
    }
  }
}

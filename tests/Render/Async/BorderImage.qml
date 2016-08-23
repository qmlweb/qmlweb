import QtQuick 2.0

BorderImage {
  width: 20
  height: 20
  source: "bg.png"
  smooth: false
  border { left: 1; top: 3; right: 2; bottom: 3 }
  onStatusChanged: {
    if (typeof window !== 'undefined' && status !== BorderImage.Loading) {
      window.onTestLoad({ framesDelay: 2 });
    }
  }

  // TODO: this is a hack to work-around PhantomJS not supporting pixelated
  // rendering for border-image. Once that would be fixed, thes rectangles
  // should be removed and the expected test result should be rebuilt
  Rectangle {
    x: 0
    y: 3
    height: 14
    width: parent.width
    color: "#000"
  }
  Rectangle {
    x: 1
    y: 0
    height: parent.width
    width: 17
    color: "#000"
  }
}

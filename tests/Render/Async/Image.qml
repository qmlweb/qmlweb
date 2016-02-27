import QtQuick 2.0

Image {
  source: 'Image.png'
  width: 25
  height: 25

  onStatusChanged: {
    if (typeof window !== 'undefined' &&
        status !== Image.Loading) {
      window.onTestLoad({ framesDelay: 2 });
    }
  }
}

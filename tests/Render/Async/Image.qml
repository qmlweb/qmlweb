import QtQuick 2.0

Image {
  source: 'Image.png'

  onStatusChanged: {
    if (typeof window !== 'undefined' &&
        status !== Image.Loading) {
      window.onTestLoad({ framesDelay: 2 });
    }
  }
}

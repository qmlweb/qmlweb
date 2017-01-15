import QtQuick 2.0
import QtTest 1.0
import Qt.labs.folderlistmodel 2.1

Row {
  id: main
  property int total: 0
  property int current: 0
  Item {
    id: window
    property bool loaded: false
    function onTestLoad(params) {
      loaded = true;
    }
  }
  Timer { // needed only to prevent the binding loop warning
    id: currentWrap
    running: false
    interval: 1
    repeat: false
    onTriggered: main.current++
  }
  Repeater {
    model: FolderListModel {
      folder: "./"
      showDirs: true
      showFiles: false
    }
    delegate: Item {
      id: group
      property string name: model.fileName
      property bool async: model.fileName.indexOf("Async") !== -1
      property url path: model.filePath
      Repeater {
        width: 100
        height: 100
        model: FolderListModel {
          nameFilters: ["*.qml"]
          folder: group.path
          showDirs: false
        }
        delegate: TestCase {
          name: group.name + "." + model.fileName
          anchors.fill: parent

          property int number: -1
          Component.onCompleted: number = main.total++
          when: number == main.current
          onCompletedChanged: if (completed) currentWrap.start()

          function test_render() {
            image.source = model.filePath.replace(/\.qml$/, ".png");
            waitForRendering(image);
            window.loaded = false;
            loader.source = model.filePath;
            waitForRendering(loader);
            if (group.async) {
              tryCompare(window, "loaded", true);
            }
            var actual = grabImage(actualRect);
            var expect = grabImage(expectRect);
            loader.source = "";
            image.source = "";
            verify(actual.equals(expect));
          }
        }
      }
    }
  }
  Rectangle {
    id: actualRect
    width: loader.width
    height: loader.height
    Loader {
      id: loader
    }
  }
  Rectangle {
    id: expectRect
    width: image.width
    height: image.height
    Image {
      id: image
    }
  }
}

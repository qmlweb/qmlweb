import QtQuick 2.0
import QtTest 1.0
import QtQuick.Window 2.0
import Qt.labs.folderlistmodel 2.1

Row {
  id: main
  property int total: 0
  property int current: 0
  property var testcases: ({})
  property var queue: 0
  Repeater {
    model: FolderListModel {
      id: dirs
      folder: "./"
      showDirs: true
      showFiles: false
      sortField: FolderListModel.Name
      onCountChanged: queue = count
    }
    delegate: Item {
      FolderListModel {
        nameFilters: ["*.qml"]
        folder: model.filePath
        showDirs: false
        showFiles: true
        sortField: FolderListModel.Name
        onCountChanged: {
          for (var i = 0; i < count; i++) {
            testcases[get(i, "filePath")] = {
              dirName: model.fileName,
              fileName: get(i, "fileName"),
              async: model.fileName.indexOf("Async") !== -1,
              dirPath: model.filePath,
              filePath: get(i, "filePath")
            };
          }
          queue--;
        }
      }
    }
  }
  TestCase {
    name: "RenderTests"
    when: dirs.count > 0 && queue === 0

    function test_render() {
      var keys = Object.keys(testcases);
      compare(
        Screen.devicePixelRatio, 1,
        "This testcase requires QT_SCREEN_SCALE_FACTORS=1 QT_AUTO_SCREEN_SCALE_FACTOR=0"
      );

      for (var i = 0; i < keys.length; i++) {
        var test = testcases[keys[i]];
        var name = test.dirName + "." + test.fileName.replace(/\.qml$/, '');
        image.source = test.filePath.replace(/\.qml$/, ".png");
        waitForRendering(image);
        window.loaded = false;
        loader.source = test.filePath;
        waitForRendering(loader);
        if (test.async) {
          tryCompare(window, "loaded", true);
        }
        var actual = grabImage(actualRect);
        var expect = grabImage(expectRect);
        loader.source = "";
        image.source = "";
        verify(actual.equals(expect), name);
      }
    }
  }
  Item {
    id: window
    property bool loaded: false
    function onTestLoad(params) {
      loaded = true;
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

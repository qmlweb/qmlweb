import QtQuick 2.0
import "importTestSimple.js" as Imported

Rectangle {
  height: 10
  width: Imported.importedTest(height)
  color: Imported.importedColor
}

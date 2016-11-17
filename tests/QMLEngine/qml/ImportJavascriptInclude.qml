import QtQuick 2.0
import "importTestInclude.js" as Imported

Item {
  property int value: Imported.includedTest
}

import QtQuick 2.0
import QtTest 1.0

TestCase {
  name: "Internationalization"

  function test_qsTr() {
    compare("Foo", qsTr("Foo"))
    compare("Foo %n!", qsTr("Foo %n!"))
    compare("Foo 10!", qsTr("Foo %n!", "", 10))
    compare("Foo 25!", qsTr("Foo %n!", "x", 25))
  }
  function test_qsTrId() {
    compare("Foo", qsTrId("Foo"))
    compare("Foo %n!", qsTrId("Foo %n!"))
    compare("Foo 10!", qsTrId("Foo %n!", 10))
    compare("Foo 25!", qsTrId("Foo %n!", 25))
  }
  function test_qsTranslate() {
    compare("Foo", qsTranslate("Bar", "Foo"))
    compare("Foo %n!", qsTranslate("Bar", "Foo %n!"))
    compare("Foo 10!", qsTranslate("Bar", "Foo %n!", "", 10))
    compare("Foo 25!", qsTranslate("Bar", "Foo %n!", "x", 25))
  }
}

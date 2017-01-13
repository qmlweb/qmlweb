import QtQuick 2.0
import QtTest 1.0

TestCase {
  name: "Math"
  width: 30 + 10
  height: width - 5

  function test_width() {
    compare(width, 40)
  }

  function test_height() {
    compare(height, 35)
  }
}

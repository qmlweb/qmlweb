import QtQuick 2.7
import QtTest 1.1

TestCase {
  name: "Simple"

  function test_one() {
    compare(1 + 2, 2 + 1, "1 + 2 = 2 + 1")
  }

  function test_two() {
    compare("abc", "ab" + "c", '"abc", "ab" + "c"')
  }

  function test_fail() {
    compare(0 + 2, 3, "0 + 2 = 3")
  }

  function test_skip() {
    skip("Let's skip")
  }
}

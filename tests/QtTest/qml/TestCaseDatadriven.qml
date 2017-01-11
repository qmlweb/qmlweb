import QtQuick 2.0
import QtTest 1.0

Item {
  TestCase {
    name: "Datadriven"

    function test_one_data() {
      return [
        { tag: "2 + 2 = 4", a: 2, b: 2, c: 4 },
        { tag: "2 + 6 = 8", a: 2, b: 6, c: 8 },
        { tag: "2 + 7 = 8", a: 2, b: 7, c: 8 }
      ]
    }

    function test_one(data) {
      compare(data.a + data.b, data.c);
    }

    function init_data() {
      return [
        { tag: "init_data_1", a_skip: false, b_fail: true },
        { tag: "init_data_2", a_skip: true, b_skip: false }
      ];
    }

    function test_a(data) {
      if (data.a_skip) {
        skip("Skipping");
      }
    }

    function test_b(data) {
      if (data.b_fail) {
        fail();
      }
    }
  }
}

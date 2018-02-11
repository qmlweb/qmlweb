// eslint-disable-next-line no-undef
class QtTest_TestCase extends QtQuick_Item {
  static versions = /^1\./;
  static properties = {
    completed: "bool",
    name: "string",
    optional: "bool",
    running: "bool",
    when: "bool",
    windowShown: "bool"
  };

  constructor(meta) {
    super(meta);
    this.Component.completed.connect(this, this.Component$onCompleted);

    const engine = QmlWeb.engine;
    if (!engine.tests) {
      QmlWeb.engine.tests = {
        name: engine.name || `Run_${Math.random().toString(36).slice(2, 10)}`,
        started: false,
        finished: false,
        duration: 0,
        total: 0,
        completed: 0,
        errors: [],
        stats: {
          pass: 0,
          fail: 0,
          skip: 0
        }
      };
    }
    QmlWeb.engine.tests.total++;

    this.console = {
      assert: (...a) => console.assert(...a),
      error: (...a) => console.error(`QSYSTEM: ${this.$testId} qml:`, ...a),
      info: (...a) => console.info(`QINFO  : ${this.$testId} qml:`, ...a),
      log: (...a) => console.log(`QDEBUG : ${this.$testId} qml:`, ...a),
      time: (...a) => console.time(...a),
      timeEnd: (...a) => console.timeEnd(...a),
      trace: (...a) => console.trace(...a),
      warn: (...a) => console.warn(`QWARN  : ${this.$testId} qml:`, ...a)
    };
  }

  Component$onCompleted() {
    const info = QmlWeb.engine.tests;
    if (!info.started) {
      console.log(`********* Start testing of ${info.name} *********`);
      console.log(`Config: Using QmlWeb, ${window.navigator.userAgent}`);
      info.started = true;
    }

    const keys = Object.keys(this);
    const tests = keys
        .filter(key => key.lastIndexOf("test_", 0) === 0)
        .filter(key => key.indexOf("_data", key.length - 5) === -1)
        .sort();

    tests.unshift("initTestCase");
    tests.push("cleanupTestCase");
    tests.forEach(test => {
      this.$testId = `${info.name}::${this.name}::${test}()`;
      const special = test === "initTestCase" || test === "cleanupTestCase";

      const dstart = performance.now();
      let data;
      if (this[`${test}_data`] && !special) {
        data = this[`${test}_data`]();
        if (!data || !data.length) {
          this.warn(`no data supplied for ${test}() by ${test}_data()`);
          data = [];
        }
      } else if (this.init_data && !special) {
        data = this.init_data();
        if (!data || !data.length) {
          data = undefined;
        }
      }
      if (!data) {
        data = [null];
      }
      const dend = performance.now();
      info.duration += dend - dstart;

      data.forEach(row => {
        const arg = row ? row.tag : "";
        this.$testId = `${info.name}::${this.name}::${test}(${arg})`;
        const start = performance.now();
        let error;
        try {
          if (!special) {
            this.init();
          }
          this[test](row);
        } catch (e) {
          error = e;
        } finally {
          if (!special) {
            this.cleanup();
          }
        }
        const end = performance.now();
        info.duration += end - start;
        if (error && error.skip) {
          info.stats.skip++;
          console.log(`SKIP   : ${this.$testId} ${error.message}`);
        } else if (error) {
          info.stats.fail++;
          info.errors.push(`${this.$testId} ${error.message}`);
          console.log(`FAIL!  : ${this.$testId} ${error.message}`);
          if ("actual" in error) {
            console.log(`   Actual   (): ${error.actual}`);
          }
          if ("expected" in error) {
            console.log(`   Expected (): ${error.expected}`);
          }
        } else {
          info.stats.pass++;
          console.log(`PASS   : ${this.$testId}`);
        }
      });

      this.$testId = `${info.name}::UnknownTestFunc()`;
    });

    // TODO: benchmarks

    info.completed++;
    if (info.completed === info.total) {
      info.finished = true;
      const { pass, fail, skip } = info.stats;
      const duration = Math.round(info.duration * 100) / 100;
      console.log(
        `Totals: ${pass} passed, ${fail} failed, ${skip} skipped, ${duration}ms`
      );
      console.log(`********* Finished testing of ${info.name} *********`);
    }
  }

  // No-ops
  init() {}
  initTestCase() {}
  cleanup() {}
  cleanupTestCase() {}

  // API
  compare(actual, expected, message = "") {
    if (actual !== expected) {
      const err = new Error(message);
      err.actual = actual;
      err.expected = expected;
      throw err;
    }
  }
  verify(condition, message = "") {
    if (!condition) {
      throw new Error(`'${message}' returned FALSE. ()`);
    }
  }
  fail(message = "") {
    throw new Error(message);
  }
  warn(message) {
    console.warn(`WARNING: ${this.$testId} ${message}`);
  }
  skip(message = "") {
    const err = new Error(message);
    err.skip = true;
    throw err;
  }
  /*
  expectFail(tag, message) {
    // TODO
  }
  expectFailContinue(tag, message) {
    // TODO
  }
  findChild(parent, objectName) {
    // TODO
    // return QtObject
  }
  fuzzyCompare(actual, expected, delta, message) {
    // TODO
  }
  grabImage(item) {
    if (!window.top || !window.top.callPhantom) {
      this.skip("Can't use TestCase::grabImage() without PhantomJS.");
    }
    // TODO
    return {
      red: (x, y) => {},
      green: (x, y) => {},
      blue: (x, y) => {},
      alpha: (x, y) => {},
      pixel: (x, y) => {},
      equals: image => false
    };
  }
  ignoreWarning(message) {
    // TODO
  }
  sleep(ms) {
    // TODO
  }
  tryCompare(obj, property, expected, timeout, message) {
    // TODO
  }
  wait(ms) {
    // TODO
  }
  waitForRendering(item, timeout = 5000) {
    // TODO
  }
  */

  // TODO
  /*
  // Events
  keyClick(key, modifiers, delay = -1) {
    // TODO
  }
  keyPress(key, modifiers, delay = -1) {
    // TODO
  }
  keyRelease(key, modifiers, delay = -1) {
    // TODO
  }
  mouseClick(item, x, y, button, modifiers, delay = -1) {
    // TODO
  }
  mouseDoubleClick(item, x, y, button, modifiers, delay = -1) {
    // TODO
  }
  mouseDoubleClickSequence(item, x, y, button, modifiers, delay = -1) {
    // TODO
  }
  mouseDrag(item, x, y, dx, dy, button, modifiers, delay = -1) {
    // TODO
  }
  mouseMove(item, x, y, delay = -1) {
    // TODO
  }
  mousePress(item, x, y, button, modifiers, delay = -1) {
    // TODO
  }
  mouseRelease(item, x, y, button, modifiers, delay = -1) {
    // TODO
  }
  mouseWheel(item, x, y, xDelta, yDelta, button, modifiers, delay = -1) {
    // button = Qt.LeftButton, modifiers = Qt.NoModifier
    // TODO
  }
  */
}

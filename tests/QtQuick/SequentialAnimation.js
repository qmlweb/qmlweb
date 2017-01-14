describe("QtQuick.Rectangle", function() {
  setupDivElement();
  var load = prefixedQmlLoader("QtQuick/qml/SequentialAnimation");

  it("Running", function(done) {
    var qml = load("Running", this.div);
    var div = this.div.children[0];
    expect(div.children[0].style.backgroundColor).toBe("rgb(255, 255, 255)");

    QmlWeb.engine.$addTicker(function onTickerStarted() {
      QmlWeb.engine.$removeTicker(onTickerStarted);

      // start running
      sendEvent(qml.area.dom, "click");

      var start_time = Date.now();
      var pre_time = start_time;
      var frame_count = 0;
      var interval = Math.floor(1000 / 60);

      function frame_info() {
        var now = Date.now();
        var acc_time = now - start_time;
        console.log("Running COLOR:",
          frame_count++,
          now - start_time,
          now - pre_time,
          div.children[0].style.backgroundColor);
        pre_time = now;
        if (acc_time <= 300 + interval) {
          requestAnimationFrame(frame_info);
        }
      }
      frame_info();

      setTimeout(function() {
        expect(div.children[0].style.backgroundColor).toBe("rgb(255, 0, 0)");
      }, 100 + interval);
      setTimeout(function() {
        expect(div.children[0].style.backgroundColor).toBe("rgb(0, 128, 0)");
        done();
      }, 300 + interval);
    });
  });
  it("Running Again", function(done) {
    var qml = load("Running", this.div);
    var div = this.div.children[0];
    expect(div.children[0].style.backgroundColor).toBe("rgb(255, 255, 255)");

    QmlWeb.engine.$addTicker(function onTickerStarted() {
      QmlWeb.engine.$removeTicker(onTickerStarted);
      var start_time = Date.now();
      var pre_time = start_time;
      var frame_count = 0;
      var interval = Math.floor(1000 / 60);

      function frame_info() {
        var now = Date.now();
        var acc_time = now - start_time;
        console.log("Running Again COLOR:",
          frame_count++,
          now - start_time,
          now - pre_time,
          div.children[0].style.backgroundColor);
        pre_time = now;
        if (acc_time <= 400 + interval) {
          requestAnimationFrame(frame_info);
        }
      }
      frame_info();

      // start running
      sendEvent(qml.area.dom, "click");
      setTimeout(function() {
        expect(div.children[0].style.backgroundColor).toBe("rgb(255, 0, 0)");
        // stop running
        sendEvent(qml.area.dom, "click");
        // restart running
        sendEvent(qml.area.dom, "click");
        setTimeout(function() {
          expect(div.children[0].style.backgroundColor).toBe("rgb(255, 0, 0)");
        }, 100 + interval);
        setTimeout(function() {
          expect(div.children[0].style.backgroundColor).toBe("rgb(0, 128, 0)");
          done();
        }, 300 + interval);
      }, 100 + interval);
    });
  });
  it("Paused", function(done) {
    var qml = load("Paused", this.div);
    var div = this.div.children[0];
    expect(div.children[0].style.backgroundColor).toBe("rgb(255, 255, 255)");

    QmlWeb.engine.$addTicker(function onTickerStarted() {
      QmlWeb.engine.$removeTicker(onTickerStarted);
      var start_time = Date.now();
      var pre_time = start_time;
      var frame_count = 0;
      var interval = Math.floor(1000 / 60);
      var is_done = false;

      function frame_info() {
        var now = Date.now();
        var acc_time = now - start_time;
        console.log("Paused COLOR:",
          frame_count++,
          now - start_time,
          now - pre_time,
          div.children[0].style.backgroundColor);
        pre_time = now;
        if (!is_done && acc_time <= 600 + interval) {
          requestAnimationFrame(frame_info);
        }
      }
      frame_info();

      // start running
      sendEvent(qml.area.dom, "click");
      setTimeout(function() {
        console.log("Paused COLOR: red animation");
        expect(div.children[0].style.backgroundColor).toBe("rgb(255, 0, 0)");
        // pause
        sendEvent(qml.area.dom, "click");
        console.log("Paused COLOR: pause");
        setTimeout(function() {
          // resume
          sendEvent(qml.area.dom, "click");
          console.log("Paused COLOR: resume");

          setTimeout(function() {
            console.log("Paused COLOR: green animation");
            expect(div.children[0].style.backgroundColor)
              .toBe("rgb(0, 128, 0)");
            done();
            is_done = true;
          }, 200);
        }, 100);
      }, 100 + interval);
    });
  });
});

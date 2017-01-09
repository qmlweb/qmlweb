describe("QtBase.QColor", function() {
  it("present", function() {
    expect(!!QmlWeb && !!QmlWeb.QColor).toBe(true);
  });

  it("construction", function() {
    var colors = [
      "#abcDEF",
      "#abcdef",
      0xabcdef
    ];
    colors.forEach(function(input) {
      var color = new QmlWeb.QColor(input);
      expect(color.toString()).toBe("#abcdef");
    });
  });

  it("toString", function() {
    var colors = [
      ["transparent", "#00000000"],
      ["#abcDEF", "#abcdef"],
      ["red", "#ff0000"],
      ["#01234567", "#01234567"],
      ["#18d", "#1188dd"]
    ];
    colors.forEach(function(input) {
      var color = new QmlWeb.QColor(input[0]);
      expect(color.toString()).toBe(input[1]);
    });
  });

  it("hsva", function() {
    var colors = [
      [[0, 0, 0], "#000000"],
      [[0, 0, 0, 0], "#00000000"],
      [[0.2, 0.3, 0.4, 0.5], "#80606647"]
    ];
    colors.forEach(function(input) {
      var color = QmlWeb.QColor.hsva.apply(undefined, input[0]);
      expect(color.toString()).toBe(input[1]);
    });
  });

  it("hsla", function() {
    var colors = [
      [[0, 0, 0], "#000000"],
      [[0, 0, 0, 0], "#00000000"],
      [[0.2, 0.3, 0.4, 0.5], "#80788547"]
    ];
    colors.forEach(function(input) {
      var color = QmlWeb.QColor.hsla.apply(undefined, input[0]);
      expect(color.toString()).toBe(input[1]);
    });
  });

  it("darker", function() {
    [
      ["gray", undefined, "#404040"],
      ["gray", 2, "#404040"],
      ["gray", 8, "#101010"],
      ["#aa8822", 2, "#554411"],
      ["#88aa22", 2, "#445511"],
      ["#8822aa", 2, "#441155"],
      ["#a52", 0.5, "#ffb588"]
    ].forEach(function(input) {
      var color = input[1] === undefined ?
        QmlWeb.QColor.darker(input[0]) :
        QmlWeb.QColor.darker(input[0], input[1]);
      expect(color.toString()).toBe(input[2]);
    });
  });

  it("lighter", function() {
    [
      ["gray", undefined, "#c0c0c0"],
      ["gray", 2, "#ffffff"],
      ["#aa8822", undefined, "#ffcc33"],
      ["#88aa22", undefined, "#ccff33"],
      ["#8822aa", undefined, "#cc33ff"],
      ["#a52", 2, "#ffb588"],
      ["#25a", 2, "#88b5ff"],
      ["#52a", 2, "#b588ff"],
      ["#aa8822", 0.5, "#554411"]
    ].forEach(function(input) {
      var color = input[1] === undefined ?
        QmlWeb.QColor.lighter(input[0]) :
        QmlWeb.QColor.lighter(input[0], input[1]);
      expect(color.toString()).toBe(input[2]);
    });
  });

  it("comparison", function() {
    var color = new QmlWeb.QColor("#abcDEF");
    expect(color.toString()).toBe("#abcdef");
    // eslint-disable-next-line eqeqeq
    expect(color == "#abcdef").toBe(true);
    // eslint-disable-next-line eqeqeq
    expect(color == "#abcDEF").toBe(false);
    expect(color === "#abcdef").toBe(false);
  });
});

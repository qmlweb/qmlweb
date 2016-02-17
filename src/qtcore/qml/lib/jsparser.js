(function() {
  var uglify_parse;

  if (typeof module !== 'undefined' && module.exports)
    uglify_parse = require("uglify-js").parse;
  else
    uglify_parse = parse;

  global.importJavascriptInContext = function (jsData, $context) {
    with(qmlEngine.rootContext()) {
      eval(jsData.source);
      for (var i = 0 ; i < jsData.exports.length ; ++i) {
        var symbolName = jsData.exports[i];
        $context[symbolName] = eval(symbolName);
      }
    }
  }

  global.jsparse = function (source) {
    var AST_Tree = uglify_parse(source);
    var obj = { exports: [], source: source };

    for (var i = 0 ; i < AST_Tree.body.length ; ++i) {
      var element = AST_Tree.body[i];

      switch (element.__proto__.TYPE) {
        case "VAR":
          obj.exports.push(element.definitions[0].name.name);
          break ;
        case "Defun":
          obj.exports.push(element.name.name);
          break ;
      }
    }
    return obj;
  }

})();

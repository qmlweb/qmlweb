(function() {
  global.importJavascriptInContext = function (jsData, $context) {
    with($context) {
      eval(jsData.source);
      for (var i = 0 ; i < jsData.exports.length ; ++i) {
        var symbolName = jsData.exports[i];
        $context[symbolName] = eval(symbolName);
      }
    }
  }

  global.jsparse = function (source) {
    var obj = { exports: [], source: source };
    var AST_Tree = qmlweb_parse(source, qmlweb_parse.JSResource);
    var main_scope = AST_Tree[1];

    for (var i = 0 ; i < main_scope.length ; ++i) {
      var item = main_scope[i];

      switch (item[0]) {
        case "var":
          obj.exports.push(item[1][0][0]);
          break ;
        case "defun":
          obj.exports.push(item[1]);
          break ;
      }
    }
    return obj;
  }

})();

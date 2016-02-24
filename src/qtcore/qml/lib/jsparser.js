var Uglify = require("uglify-js");

function importJavascriptInContext(jsData, $context) {
  with($context) {
    eval(jsData.source);
    for (var i = 0 ; i < jsData.exports.length ; ++i) {
      var symbolName = jsData.exports[i];
      $context[symbolName] = eval(symbolName);
    }
  }
}

function jsparse(source) {
  var AST_Tree = Uglify.parse(source);
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

module.exports.jsparse = jsparse;

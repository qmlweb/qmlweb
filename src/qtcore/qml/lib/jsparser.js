(function() {
  var uglify_parse;

  if (typeof module !== 'undefined' && module.exports)
    uglify_parse = require("uglify-js").parse;
  else
    uglify_parse = parse;


  global.importJavascriptInContext = function (jsData, $context) {
    var imported = eval('('+jsData.source+')');
    for (var attrname in imported) { 
      $context[attrname] = imported[attrname]; 
    }
  }

  global.jsparse = function (source) {
    return { exports: [], source: source };
  }

})();

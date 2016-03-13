(function() {
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

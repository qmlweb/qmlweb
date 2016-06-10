  global.importJavascriptInContext = function (jsData, $context) {
    /* Remove any ".pragma" statements, as they are not valid JavaScript */
    var source = jsData.source.replace(/\.pragma.*(?:\r\n|\r|\n)/, "\n");
    // TODO: pass more objects to the scope?
    (new Function('jsData', '$context', `
      with ($context) {
        ${source}
      }
      ${jsData.exports.map(sym => `$context.${sym} = ${sym};`).join('')}
    `))(jsData, $context);
  }

  global.jsparse = function (source) {
    var obj = { exports: [], source: source };
    loadParser();
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

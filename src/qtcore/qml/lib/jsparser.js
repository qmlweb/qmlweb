(function() {

global.jsGetGlobalSymbols = getGlobalSymbols;

function getGlobalSymbols(src, context) {
  eval(src);
  src = occultAllStrings(src);
  src = occultSubScopes(src);

  //var variables = getVariables(src);
  var functions = getFunctions(src);

  for (var i = 0 ; i < functions.length ; ++i) {
    context[functions[i]] = eval(functions[i]);
  }
};

function getVariables(src) {
  var findVars  = /var\s*[a-zA-Z][a-zA-Z0-9_]*/g;
  var matches   = src.match(findVars);
  var results   = [];

  if (typeof matches == 'undefined' || matches == null)
    return results;
  for (var i = 0 ; i < matches.length ; ++i) {
    var splitted = matches[i].split(' ');

    results.push(splitted[splitted.length - 1]);
  }
  return results;
}

function getFunctions(src) {
  var findFuncs = /function\s*[a-zA-Z_][a-zA-Z0-9_]*/g;
  var matches   = src.match(findFuncs);
  var results   = [];

  if (typeof matches == 'undefined' || matches == null)
    return results;
  for (var i = 0 ; i < matches.length ; ++i) {
    var splitted = matches[i].split(' ');

    results.push(splitted[splitted.length - 1]);
  }
  return results; 
}

function strReplaceAt(str, index, character) {
  return str.substr(0, index) + character + str.substr(index + character.length);
};

function occultAllStrings(src) {
  var currentSep = '';

  for (var i = 0 ; i < src.length ; ++i) {
    if (currentSep == '') {
      if (src[i] == '"' || src[i] == "'") {
        currentSep = src[i];
      }
    }
    else if (src[i] != currentSep) {
      src = strReplaceAt(src, i, '#');
    }
    else if (!isEscaped(src, i - 1)) {
      currentSep = '';
    }
  }
  return src;
}

function occultSubScopes(src) {
  var bracketCount = 0;

  for (var i = 0 ; i < src.length ; ++i) {
    if (src[i] == '{')
      bracketCount++;
    else if (src[i] == '}')
      bracketCount--;
    else if (bracketCount > 0)
      src = strReplaceAt(src, i, '#');
  }
  return src;
}

function isEscaped(src, i) {
  var escaped = false;

  while (i > 0 && src[i] == '\\') {
    escaped = !escaped;
    i--;
  }
  return escaped;
}

})();

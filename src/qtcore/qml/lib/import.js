/* @license

  Copyright (c) 2011 Lauri Paimen <lauri@paimen.info>
  Copyright (c) 2015 Pavel Vasev <pavel.vasev@gmail.com> - initial
                     and working import implementation.

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions
  are met:

      * Redistributions of source code must retain the above
        copyright notice, this list of conditions and the following
        disclaimer.

      * Redistributions in binary form must reproduce the above
        copyright notice, this list of conditions and the following
        disclaimer in the documentation and/or other materials
        provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER “AS IS” AND ANY
  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
  PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE
  LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
  OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
  PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
  THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
  TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
  THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
  SUCH DAMAGE.
*/


/*
 * Misc classes for importing files.
 *
 * Currently the file contains a lot of unused code for future
 * purposes. Most of it can be rewritten as there is now Javascript parser
 * available.
 *
 * Exports:
 *
 * - getUrlContents(url) -- get URL contents. Returns contents or false in
 *   error.
 *
 * - Some other stuff not currently used/needed.
 *
 *
 */
(function() {

/**
 * Get URL contents. EXPORTED.
 * @param url {String} Url to fetch.
 * @param skipExceptions {bool} when turned on, ignore exeptions and return false. This feature is used by readQmlDir.
 * @private
 * @return {mixed} String of contents or false in errors.
 *
 * Q1: can someone provide use-case when we need caching here?
 * A1:
 * Q2: should errors be cached? (now they aren't)
 * A2:
 
 * Q3: split getUrlContents into: getUrlContents, getUrlContentsWithCaching, getUrlContentsWithoutErrors..
 */
getUrlContents = function (url, skipExceptions) {
    if (typeof urlContentCache[url] == 'undefined') {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, false);

      if (skipExceptions)
        { try { xhr.send(null); } catch (e) { return false; } } /* it is OK to not have logging here, because DeveloperTools already will have red log record */
      else
        xhr.send(null);

      if (xhr.status != 200 && xhr.status != 0) { // 0 if accessing with file://
          console.log("Retrieving " + url + " failed: " + xhr.responseText, xhr);
          return false;
      }
      urlContentCache[url] = xhr.responseText;
    }
    return urlContentCache[url];
}
if (typeof global.urlContentCache == 'undefined')
  global.urlContentCache = {};

/**
 * Read qmldir spec file at directory. EXPORTED.
 * @param url Url of the directory
 * @return {Object} Object, where .internals lists qmldir internal references
 *                          and .externals lists qmldir external references.
 */

/*  Note on how importing works.

   * parseQML gives us `tree.$imports` variable, which contains information from `import` statements.

   * After each call to parseQML, we call engine.loadImports(tree.$imports).
     It in turn invokes readQmlDir() calls for each import, with respect to current component base path and engine.importPathList().

   * We keep all component names from all qmldir files in global variable `engine.qmldir`.
   
   * In construct() function, we use `engine.qmldir` for component url lookup.

   Reference import info: http://doc.qt.io/qt-5/qtqml-syntax-imports.html 
   Also please look at notes and TODO's in qtcore.js::loadImports() and qtcore.js::construct() methods.
*/
 
readQmlDir = function (url) {
    // in case 'url' is empty, do not attach "/"
    // Q1: when this happen?
    var qmldirFileUrl = url.length > 0 ? (url + "/qmldir") : "qmldir";

    if (!qrc.includesFile(qmldirFileUrl))
      qrc[qmldirFileUrl] = getUrlContents(qmldirFileUrl, true); // loading url contents with skipping errors
    var qmldir = qrc[qmldirFileUrl],
        lines,
        line,
        internals = {},
        externals = {},
        match,
        i;

    if (qmldir === false) {
        return false;
    }

    // we have to check for "://" 
    // In that case, item path is meant to be absolute, and we have no need to prefix it with base url
    function makeurl( path ) {
       if (path.indexOf("://") > 0) return path;
       return url + "/" + path;
    }

    lines = qmldir.split(/\r?\n/);
    for (i = 0; i < lines.length; i++) {
        // trim
        line = lines[i].replace(/^\s+|\s+$/g, "");
        if (!line.length || line[0] == "#") {
            // Empty line or comment
            continue;
        }
        match = line.split(/\s+/);
        if (match.length == 2 || match.length == 3) {
            if (match[0] == "plugin") {
                console.log(url + ": qmldir plugins are not supported!");
            } else if (match[0] == "internal") {
                internals[match[1]] = { url: makeurl( match[2] ) };
            } else {
                if (match.length == 2) {
                    externals[match[0]] = { url: makeurl( match[1] ) };
                } else {
                    externals[match[0]] = { url: makeurl( match[2] ), version: match[1] };
                }
            }
        } else {
            console.log(url + ": unmatched: " + line);
        }
    }
    return {internals: internals, externals: externals};
}


/**
 * Import and parse javascript file. EXPORTED.
 * @return {object} Object which has "var"s and functions from file as keys, or
 *         undefined if operation fails
 */
importJs = function (filename) {

    // todo: .pragma support

    // Exports as follow:
    // function a() { function b() {} } exports only a.
    // var a = function b(){} exports a and b. Not sure if b should be exported.
    //                        rare case, however.
    // var a = function(){} exports only a.

    var i,
        src = getUrlContents(filename),
        exports = [];

    if (src === false) {
        return;
    }

    // Analyse source
    exports = readExports(src);
    console.log(filename + " exports:", exports);

    // Wrap source to function to retain private scope of the variables.
    // Make that function return an object.
    // That object contains getters and setters for exported stuff.
    // Add () to execute the function.
    src += ";return {";
    for (i = 0; i < exports.length; i++) {
        // create getters and setters for properties
        // keeps variables synced better
        src += "get " + exports[i] + "(){return " + exports[i] + "},";
        src += "set " + exports[i] + "(){" + exports[i] + " = arguments[0]},";
        // without getters and setters:
        // src += exports[i] + ":" + exports[i] + ",";
    }
    src += "}";

    // evaluate source to get the object.
    return new Function(src)();
}

/**
 * Read code for variables and functions which are exported to qml
 * @private
 * @param src source code
 * @return Array Array of local variable names to export
 */
function readExports(src) {

    // Eat src until str is found. Recurse if recursive set.
    function eatUntil(src, str, recursive) {
        var i;
        if (!recursive) {
            i = src.indexOf(str);
            if (i == -1) {
                console.log("eof encountered, " + str + " expected.");
                return "";
            }
        } else {
            i = 0;
            while (i < src.length) {
                if (src.substr(i, str.length) == str) {
                    break;
                }
                switch(src[i]) {
                 case "{": // inner block
                    src = eatUntil(src.substr(i + 1), "}", true );
                    i = 0;
                    break;
                 case "(": // Parentheses
                    src = eatUntil(src.substr(i + 1), ")", true );
                    i = 0;
                    break;
                 case "/": // Possible beginning of comment
                    if (src[i + 1] == "/") {
                        src = eatUntil(src.substr(i + 1), "\n");
                        i = 0;
                    } else if (src[i + 1] == "*") {
                        src = eatUntil(src.substr(i + 1), "*/");
                        i = 0;
                    } else {
                        i++;
                    }
                    break;
                 default:
                    i++;
                }
            }
        }
        return src.substr(i + str.length);
    }

    // Strip comments and code blocks from the input source
    // This is quite similar with eatCodeBlock but still a bit different.
    // If either section has bugs, check the other section, too!
    var i = 0,
        // Code without blocks and comments
        semi = "",
        // todo: these doesn't match with exports containing "$"
        matcher = /var\s+\w+|function\s+\w+/g,
        matches,
        tmp,
        exports = [];

    while (i < src.length) {
        switch (src[i]) {
         case "{": // code block
            src = eatUntil(src.substr(i + 1), "}", true);
            i = 0;
            break;
         case "(": // parentheses
            src = eatUntil(src.substr(i + 1), ")", true);
            i = 0;
            break;
         case "/": // comment
            if (src[i + 1] == "/") {
                src = eatUntil(src.substr(i + 1), "\n");
                i = 0;
            } else if (src[i + 1] == "*") {
                src = eatUntil(src.substr(i + 1), "*/");
                i = 0;
            } else {
                semi += src[i];
                i++;
            }
            break;
        default:
            semi += src[i];
            i++;
            break;
        }
    }

    // Search exports from semi
    matches = semi.match(matcher);

    // matches now contain strings defined in matcher. Re-match these to get
    // exports. Matching can be done in one step, but I couldn't get it working
    // so bear this extra step.
    for (i = 0; i < matches.length; i++) {
        tmp = /\w+\s+(\w+)/.exec(matches[i]);
        if (tmp) {
            exports.push(tmp[1]);
        }
    }
    return exports;
}

})();

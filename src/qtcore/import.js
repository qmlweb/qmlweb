/* @license

MIT License

Copyright (c) 2011 Lauri Paimen <lauri@paimen.info>
Copyright (c) 2015 Pavel Vasev <pavel.vasev@gmail.com> - initial and working
                                                         import implementation.
Copyright (c) 2016 QmlWeb contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
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

})();

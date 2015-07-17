/* @license

  Copyright (c) 2011 Lauri Paimen <lauri@paimen.info>

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
(function () {

    function parseQML(file) {
        var contents = getUrlContents(file + ".js");
        if (contents) {
            console.log("Using pre-processed content for " + file);
            return eval("(function(){return " + contents + "})();");
        } else {
            contents = getUrlContents(file);
            if (contents) {
                // todo: use parser/compiler here
                console.log("todo: add parser to import.js " + file);
            } else {
                console.log("warn: Fetch failed for " + file);
            }
        }
    }


    /**
     * Get URL contents. EXPORTED.
     * @param url {String} Url to fetch.
     * @private
     * @return {mixed} String of contents or false in errors.
     */
    getUrlContents = function (url) {
        if (typeof urlContentCache[url] == 'undefined') {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, false);
            xhr.send(null);
            if (xhr.status != 200 && xhr.status != 0) {
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
    readQmlDir = function (url) {
        var qmldir = getUrlContents(url += "/qmldir"),
            lines,
            line,
            internals = {},
            externals = {},
            match,
            i;

        if (qmldir === false) {
            return false;
        }

        lines = qmldir.split(/\r?\n/);
        for (i = 0; i < lines.length; i++) {
            line = lines[i].replace(/^\s+|\s+$/g, "");
            if (!line.length || line[0] == "#") {
                continue;
            }
            match = line.split(/\s+/);
            if (match.length == 2 || match.length == 3) {
                if (match[0] == "plugin") {
                    console.log(url + ": qmldir plugins are not supported!");
                } else if (match[0] == "internal") {
                    internals[match[1]] = {
                        url: url + "/" + match[2]
                    };
                } else {
                    if (match.length == 2) {
                        externals[match[0]] = {
                            url: url + "/" + match[1]
                        };
                    } else {
                        externals[match[0]] = {
                            url: url + "/" + match[2],
                            version: match[1]
                        };
                    }
                }
            } else {
                console.log(url + ": unmatched: " + line);
            }
        }
        return {
            internals: internals,
            externals: externals
        };
    }


    /**
     * Import and parse javascript file. EXPORTED.
     * @return {object} Object which has "var"s and functions from file as keys, or
     *         undefined if operation fails
     */
    importJs = function (filename) {

        // todo: .pragma support

         var i,
            src = getUrlContents(filename),
            exports = [];

        if (src === false) {
            return;
        }

        exports = readExports(src);
        console.log(filename + " exports:", exports);

        src = "(function(){" + src + ";return {";
        for (i = 0; i < exports.length; i++) {
            src += "get " + exports[i] + "(){return " + exports[i] + "},";
            src += "set " + exports[i] + "(){" + exports[i] + " = arguments[0]},";
        }
        src += "}})()";

        return eval(src);
    }

    /**
     * Read code for variables and functions which are exported to qml
     * @private
     * @param src source code
     * @return Array Array of local variable names to export
     */
    function readExports(src) {

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
                    switch (src[i]) {
                    case "{":
                        src = eatUntil(src.substr(i + 1), "}", true);
                        i = 0;
                        break;
                    case "(":
                        src = eatUntil(src.substr(i + 1), ")", true);
                        i = 0;
                        break;
                    case "/":
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

        var i = 0,
            semi = "",
            // todo: these doesn't match with exports containing "$"
            matcher = /var\s+\w+|function\s+\w+/g,
            matches,
            tmp,
            exports = [];

        while (i < src.length) {
            switch (src[i]) {
            case "{":
                src = eatUntil(src.substr(i + 1), "}", true);
                i = 0;
                break;
            case "(":
                src = eatUntil(src.substr(i + 1), ")", true);
                i = 0;
                break;
            case "/":
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

        matches = semi.match(matcher);
        for (i = 0; i < matches.length; i++) {
            tmp = /\w+\s+(\w+)/.exec(matches[i]);
            if (tmp) {
                exports.push(tmp[1]);
            }
        }
        return exports;
    }

})();

(function(global){

/**
 * Create QML binding.
 * @param {Variant} val Sourcecode or function representing the binding
 * @param {Array} tree Parser tree of the binding
 * @return {Object} Object representing the binding
 */
global.QMLBinding = function(val, tree) {
    // this.function states whether the binding is a simple js statement or a function containing a
    // return statement. We decide this on whether it is a code block or not. If it is, we require a
    // return statement. If it is a code block it could though also be a object definition, so we
    // need to check that as well (it is, if the content is labels).
    this.function = tree && tree[0] == "block" && tree[1][0] && tree[1][0][0] !== "label";
    this.src = val;
}

global.QMLBinding.prototype.toJSON = function() {
    return {src: this.src,
        deps: JSON.stringify(this.deps),
        tree: JSON.stringify(this.tree) };
}

/**
 * Compile binding. Afterwards you may call binding.eval to evaluate.
 */
global.QMLBinding.prototype.compile = function() {
    var bindSrc = this.function
                    ? "(function(o, c) { with(c) with(o) " + this.src + "})"
                    : "(function(o, c) { with(c) with(o) return " + this.src + "})";
    this.eval = eval(bindSrc);
}

/***********************************************************************

  A JavaScript tokenizer / parser / beautifier / compressor.

  This version is suitable for Node.js.  With minimal changes (the
  exports stuff) it should work on any JS platform.

  This file implements some AST processors.  They work on data built
  by parse-js.

  Exported functions:

    - ast_mangle(ast, options) -- mangles the variable/function names
      in the AST.  Returns an AST.

    - ast_squeeze(ast) -- employs various optimizations to make the
      final generated code even smaller.  Returns an AST.

    - gen_code(ast, options) -- generates JS code from the AST.  Pass
      true (or an object, see the code for some options) as second
      argument to get "pretty" (indented) code.

  -------------------------------- (C) ---------------------------------

                           Author: Mihai Bazon
                         <mihai.bazon@gmail.com>
                       http://mihai.bazon.net/blog

  Distributed under the BSD license:

    Copyright 2011 (c) Lauri Paimen <lauri@paimen.info>
    Copyright 2010 (c) Mihai Bazon <mihai.bazon@gmail.com>

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

 ***********************************************************************/

/*
 * Based on Javascript parser written by Mihai Bazon for UglifyJS project.
 * That, again, is a port of Javascript parser by Marijn Haverbeke.
 * Big thanks to both of you (and others involved)!
 * UglifyJS: https://github.com/mishoo/UglifyJS
 * Marijn's parser: http://marijn.haverbeke.nl/parse-js/
 *
 * The primary goal of this file is to offer QML parsing *on top of UglifyJS
 * parser* and to change Javascript parts as little as possible. If you find
 * bugs/improvements to Javascript parsing parts, check if those are fixed to
 * UglifyJS parser first. If not, fix them there. After UglifyJS has been fixed,
 * backport the changes to this file. Less changes to Javascript, more easy it
 * will be to keep up with UglifyJS.
 * Ultimately it would be great to keep the original parser and QML additions in
 * different files but the structure of code does not support that.
 */

/*
var jsp = require("./parse-js"),
    slice = jsp.slice,
    member = jsp.member,
    PRECEDENCE = jsp.PRECEDENCE,
    OPERATORS = jsp.OPERATORS;
*/

/* -----[ helper for AST traversal ]----- */

function ast_walker(ast) {
        function _vardefs(defs) {
                return [ this[0], MAP(defs, function(def){
                        var a = [ def[0] ];
                        if (def.length > 1)
                                a[1] = walk(def[1]);
                        return a;
                }) ];
        };
        function _block(statements) {
                var out = [ this[0] ];
                if (statements != null)
                        out.push(MAP(statements, walk));
                return out;
        };
        var walkers = {
                "string": function(str) {
                        return [ this[0], str ];
                },
                "num": function(num) {
                        return [ this[0], num ];
                },
                "name": function(name) {
                        return [ this[0], name ];
                },
                "toplevel": function(statements) {
                        return [ this[0], MAP(statements, walk) ];
                },
                "block": _block,
                "splice": _block,
                "var": _vardefs,
                "const": _vardefs,
                "try": function(t, c, f) {
                        return [
                                this[0],
                                MAP(t, walk),
                                c != null ? [ c[0], MAP(c[1], walk) ] : null,
                                f != null ? MAP(f, walk) : null
                        ];
                },
                "throw": function(expr) {
                        return [ this[0], walk(expr) ];
                },
                "new": function(ctor, args) {
                        return [ this[0], walk(ctor), MAP(args, walk) ];
                },
                "switch": function(expr, body) {
                        return [ this[0], walk(expr), MAP(body, function(branch){
                                return [ branch[0] ? walk(branch[0]) : null,
                                         MAP(branch[1], walk) ];
                        }) ];
                },
                "break": function(label) {
                        return [ this[0], label ];
                },
                "continue": function(label) {
                        return [ this[0], label ];
                },
                "conditional": function(cond, t, e) {
                        return [ this[0], walk(cond), walk(t), walk(e) ];
                },
                "assign": function(op, lvalue, rvalue) {
                        return [ this[0], op, walk(lvalue), walk(rvalue) ];
                },
                "dot": function(expr) {
                        return [ this[0], walk(expr) ].concat(slice(arguments, 1));
                },
                "call": function(expr, args) {
                        return [ this[0], walk(expr), MAP(args, walk) ];
                },
                "function": function(name, args, body) {
                        return [ this[0], name, args.slice(), MAP(body, walk) ];
                },
                "defun": function(name, args, body) {
                        return [ this[0], name, args.slice(), MAP(body, walk) ];
                },
                "if": function(conditional, t, e) {
                        return [ this[0], walk(conditional), walk(t), walk(e) ];
                },
                "for": function(init, cond, step, block) {
                        return [ this[0], walk(init), walk(cond), walk(step), walk(block) ];
                },
                "for-in": function(vvar, key, hash, block) {
                        return [ this[0], walk(vvar), walk(key), walk(hash), walk(block) ];
                },
                "while": function(cond, block) {
                        return [ this[0], walk(cond), walk(block) ];
                },
                "do": function(cond, block) {
                        return [ this[0], walk(cond), walk(block) ];
                },
                "return": function(expr) {
                        return [ this[0], walk(expr) ];
                },
                "binary": function(op, left, right) {
                        return [ this[0], op, walk(left), walk(right) ];
                },
                "unary-prefix": function(op, expr) {
                        return [ this[0], op, walk(expr) ];
                },
                "unary-postfix": function(op, expr) {
                        return [ this[0], op, walk(expr) ];
                },
                "sub": function(expr, subscript) {
                        return [ this[0], walk(expr), walk(subscript) ];
                },
                "object": function(props) {
                        return [ this[0], MAP(props, function(p){
                                return p.length == 2
                                        ? [ p[0], walk(p[1]) ]
                                        : [ p[0], walk(p[1]), p[2] ]; // get/set-ter
                        }) ];
                },
                "regexp": function(rx, mods) {
                        return [ this[0], rx, mods ];
                },
                "array": function(elements) {
                        return [ this[0], MAP(elements, walk) ];
                },
                "stat": function(stat) {
                        return [ this[0], walk(stat) ];
                },
                "seq": function() {
                        return [ this[0] ].concat(MAP(slice(arguments), walk));
                },
                "label": function(name, block) {
                        return [ this[0], name, walk(block) ];
                },
                "with": function(expr, block) {
                        return [ this[0], walk(expr), walk(block) ];
                },
                "atom": function(name) {
                        return [ this[0], name ];
                }
        };

        var user = {};
        var stack = [];
        function walk(ast) {
                if (ast == null)
                        return null;
                try {
                        stack.push(ast);
                        var type = ast[0];
                        var gen = user[type];
                        if (gen) {
                                var ret = gen.apply(ast, ast.slice(1));
                                if (ret != null)
                                        return ret;
                        }
                        gen = walkers[type];
                        return gen.apply(ast, ast.slice(1));
                } finally {
                        stack.pop();
                }
        };

        function with_walkers(walkers, cont){
                var save = {}, i;
                for (i in walkers) if (HOP(walkers, i)) {
                        save[i] = user[i];
                        user[i] = walkers[i];
                }
                var ret = cont();
                for (i in save) if (HOP(save, i)) {
                        if (!save[i]) delete user[i];
                        else user[i] = save[i];
                }
                return ret;
        };

        return {
                walk: walk,
                with_walkers: with_walkers,
                parent: function() {
                        return stack[stack.length - 2]; // last one is current node
                },
                stack: function() {
                        return stack;
                }
        };
};

/* -----[ Scope and mangling ]----- */

function Scope(parent) {
        this.names = {};        // names defined in this scope
        this.mangled = {};      // mangled names (orig.name => mangled)
        this.rev_mangled = {};  // reverse lookup (mangled => orig.name)
        this.cname = -1;        // current mangled name
        this.refs = {};         // names referenced from this scope
        this.uses_with = false; // will become TRUE if with() is detected in this or any subscopes
        this.uses_eval = false; // will become TRUE if eval() is detected in this or any subscopes
        this.parent = parent;   // parent scope
        this.children = [];     // sub-scopes
        if (parent) {
                this.level = parent.level + 1;
                parent.children.push(this);
        } else {
                this.level = 0;
        }
};

var base54 = (function(){
        var DIGITS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_";
        return function(num) {
                var ret = "";
                do {
                        ret = DIGITS.charAt(num % 54) + ret;
                        num = Math.floor(num / 54);
                } while (num > 0);
                return ret;
        };
})();

Scope.prototype = {
        has: function(name) {
                for (var s = this; s; s = s.parent)
                        if (HOP(s.names, name))
                                return s;
        },
        has_mangled: function(mname) {
                for (var s = this; s; s = s.parent)
                        if (HOP(s.rev_mangled, mname))
                                return s;
        },
        toJSON: function() {
                return {
                        names: this.names,
                        uses_eval: this.uses_eval,
                        uses_with: this.uses_with
                };
        },

        next_mangled: function() {
                // we must be careful that the new mangled name:
                //
                // 1. doesn't shadow a mangled name from a parent
                //    scope, unless we don't reference the original
                //    name from this scope OR from any sub-scopes!
                //    This will get slow.
                //
                // 2. doesn't shadow an original name from a parent
                //    scope, in the event that the name is not mangled
                //    in the parent scope and we reference that name
                //    here OR IN ANY SUBSCOPES!
                //
                // 3. doesn't shadow a name that is referenced but not
                //    defined (possibly global defined elsewhere).
                for (;;) {
                        var m = base54(++this.cname), prior;

                        // case 1.
                        prior = this.has_mangled(m);
                        if (prior && this.refs[prior.rev_mangled[m]] === prior)
                                continue;

                        // case 2.
                        prior = this.has(m);
                        if (prior && prior !== this && this.refs[m] === prior && !prior.has_mangled(m))
                                continue;

                        // case 3.
                        if (HOP(this.refs, m) && this.refs[m] == null)
                                continue;

                        // I got "do" once. :-/
                        if (!is_identifier(m))
                                continue;

                        return m;
                }
        },
        set_mangle: function(name, m) {
                this.rev_mangled[m] = name;
                return this.mangled[name] = m;
        },
        get_mangled: function(name, newMangle) {
                if (this.uses_eval || this.uses_with) return name; // no mangle if eval or with is in use
                var s = this.has(name);
                if (!s) return name; // not in visible scope, no mangle
                if (HOP(s.mangled, name)) return s.mangled[name]; // already mangled in this scope
                if (!newMangle) return name;                      // not found and no mangling requested
                return s.set_mangle(name, s.next_mangled());
        },
        references: function(name) {
                return name && !this.parent || this.uses_with || this.uses_eval || this.refs[name];
        },
        define: function(name, type) {
                if (name != null) {
                        if (type == "var" || !HOP(this.names, name))
                                this.names[name] = type || "var";
                        return name;
                }
        }
};

function ast_add_scope(ast) {

        var current_scope = null;
        var w = ast_walker(), walk = w.walk;
        var having_eval = [];

        function with_new_scope(cont) {
                current_scope = new Scope(current_scope);
                var ret = current_scope.body = cont();
                ret.scope = current_scope;
                current_scope = current_scope.parent;
                return ret;
        };

        function define(name, type) {
                return current_scope.define(name, type);
        };

        function reference(name) {
                current_scope.refs[name] = true;
        };

        function _lambda(name, args, body) {
                var is_defun = this[0] == "defun";
                return [ this[0], is_defun ? define(name, "defun") : name, args, with_new_scope(function(){
                        if (!is_defun) define(name, "lambda");
                        MAP(args, function(name){ define(name, "arg") });
                        return MAP(body, walk);
                })];
        };

        function _vardefs(type) {
                return function(defs) {
                        MAP(defs, function(d){
                                define(d[0], type);
                                if (d[1]) reference(d[0]);
                        });
                };
        };

        return with_new_scope(function(){
                // process AST
                var ret = w.with_walkers({
                        "function": _lambda,
                        "defun": _lambda,
                        "label": function(name, stat) { define(name, "label") },
                        "break": function(label) { if (label) reference(label) },
                        "continue": function(label) { if (label) reference(label) },
                        "with": function(expr, block) {
                                for (var s = current_scope; s; s = s.parent)
                                        s.uses_with = true;
                        },
                        "var": _vardefs("var"),
                        "const": _vardefs("const"),
                        "try": function(t, c, f) {
                                if (c != null) return [
                                        this[0],
                                        MAP(t, walk),
                                        [ define(c[0], "catch"), MAP(c[1], walk) ],
                                        f != null ? MAP(f, walk) : null
                                ];
                        },
                        "name": function(name) {
                                if (name == "eval")
                                        having_eval.push(current_scope);
                                reference(name);
                        }
                }, function(){
                        return walk(ast);
                });

                // the reason why we need an additional pass here is
                // that names can be used prior to their definition.

                // scopes where eval was detected and their parents
                // are marked with uses_eval, unless they define the
                // "eval" name.
                MAP(having_eval, function(scope){
                        if (!scope.has("eval")) while (scope) {
                                scope.uses_eval = true;
                                scope = scope.parent;
                        }
                });

                // for referenced names it might be useful to know
                // their origin scope.  current_scope here is the
                // toplevel one.
                function fixrefs(scope, i) {
                        // do children first; order shouldn't matter
                        for (i = scope.children.length; --i >= 0;)
                                fixrefs(scope.children[i]);
                        for (i in scope.refs) if (HOP(scope.refs, i)) {
                                // find origin scope and propagate the reference to origin
                                for (var origin = scope.has(i), s = scope; s; s = s.parent) {
                                        s.refs[i] = origin;
                                        if (s === origin) break;
                                }
                        }
                };
                fixrefs(current_scope);

                return ret;
        });

};

/* -----[ mangle names ]----- */

function ast_mangle(ast, options) {
        var w = ast_walker(), walk = w.walk, scope;
        options = options || {};

        function get_mangled(name, newMangle) {
                if (!options.toplevel && !scope.parent) return name; // don't mangle toplevel
                if (options.except && member(name, options.except))
                        return name;
                return scope.get_mangled(name, newMangle);
        };

        function get_define(name) {
                if (options.defines) {
                        // we always lookup a defined symbol for the current scope FIRST, so declared
                        // vars trump a DEFINE symbol, but if no such var is found, then match a DEFINE value
                        if (!scope.has(name)) {
                                if (HOP(options.defines, name)) {
                                        return options.defines[name];
                                }
                        }
                        return null;
                }
        };

        function _lambda(name, args, body) {
                var is_defun = this[0] == "defun", extra;
                if (name) {
                        if (is_defun) name = get_mangled(name);
                        else {
                                extra = {};
                                if (!(scope.uses_eval || scope.uses_with))
                                        name = extra[name] = scope.next_mangled();
                                else
                                        extra[name] = name;
                        }
                }
                body = with_scope(body.scope, function(){
                        args = MAP(args, function(name){ return get_mangled(name) });
                        return MAP(body, walk);
                }, extra);
                return [ this[0], name, args, body ];
        };

        function with_scope(s, cont, extra) {
                var _scope = scope;
                scope = s;
                if (extra) for (var i in extra) if (HOP(extra, i)) {
                        s.set_mangle(i, extra[i]);
                }
                for (var i in s.names) if (HOP(s.names, i)) {
                        get_mangled(i, true);
                }
                var ret = cont();
                ret.scope = s;
                scope = _scope;
                return ret;
        };

        function _vardefs(defs) {
                return [ this[0], MAP(defs, function(d){
                        return [ get_mangled(d[0]), walk(d[1]) ];
                }) ];
        };

        return w.with_walkers({
                "function": _lambda,
                "defun": function() {
                        // move function declarations to the top when
                        // they are not in some block.
                        var ast = _lambda.apply(this, arguments);
                        switch (w.parent()[0]) {
                            case "toplevel":
                            case "function":
                            case "defun":
                                return MAP.at_top(ast);
                        }
                        return ast;
                },
                "label": function(label, stat) { return [ this[0], get_mangled(label), walk(stat) ] },
                "break": function(label) { if (label) return [ this[0], get_mangled(label) ] },
                "continue": function(label) { if (label) return [ this[0], get_mangled(label) ] },
                "var": _vardefs,
                "const": _vardefs,
                "name": function(name) {
                        return get_define(name) || [ this[0], get_mangled(name) ];
                },
                "try": function(t, c, f) {
                        return [ this[0],
                                 MAP(t, walk),
                                 c != null ? [ get_mangled(c[0]), MAP(c[1], walk) ] : null,
                                 f != null ? MAP(f, walk) : null ];
                },
                "toplevel": function(body) {
                        var self = this;
                        return with_scope(self.scope, function(){
                                return [ self[0], MAP(body, walk) ];
                        });
                }
        }, function() {
                return walk(ast_add_scope(ast));
        });
};

/* -----[
   - compress foo["bar"] into foo.bar,
   - remove block brackets {} where possible
   - join consecutive var declarations
   - various optimizations for IFs:
     - if (cond) foo(); else bar();  ==>  cond?foo():bar();
     - if (cond) foo();  ==>  cond&&foo();
     - if (foo) return bar(); else return baz();  ==> return foo?bar():baz(); // also for throw
     - if (foo) return bar(); else something();  ==> {if(foo)return bar();something()}
   ]----- */

var warn = function(){};

function best_of(ast1, ast2) {
        return gen_code(ast1).length > gen_code(ast2[0] == "stat" ? ast2[1] : ast2).length ? ast2 : ast1;
};

function last_stat(b) {
        if (b[0] == "block" && b[1] && b[1].length > 0)
                return b[1][b[1].length - 1];
        return b;
}

function aborts(t) {
        if (t) switch (last_stat(t)[0]) {
            case "return":
            case "break":
            case "continue":
            case "throw":
                return true;
        }
};

function boolean_expr(expr) {
        return ( (expr[0] == "unary-prefix"
                  && member(expr[1], [ "!", "delete" ])) ||

                 (expr[0] == "binary"
                  && member(expr[1], [ "in", "instanceof", "==", "!=", "===", "!==", "<", "<=", ">=", ">" ])) ||

                 (expr[0] == "binary"
                  && member(expr[1], [ "&&", "||" ])
                  && boolean_expr(expr[2])
                  && boolean_expr(expr[3])) ||

                 (expr[0] == "conditional"
                  && boolean_expr(expr[2])
                  && boolean_expr(expr[3])) ||

                 (expr[0] == "assign"
                  && expr[1] === true
                  && boolean_expr(expr[3])) ||

                 (expr[0] == "seq"
                  && boolean_expr(expr[expr.length - 1]))
               );
};

function make_conditional(c, t, e) {
    var make_real_conditional = function() {
        if (c[0] == "unary-prefix" && c[1] == "!") {
            return e ? [ "conditional", c[2], e, t ] : [ "binary", "||", c[2], t ];
        } else {
            return e ? [ "conditional", c, t, e ] : [ "binary", "&&", c, t ];
        }
    };
    // shortcut the conditional if the expression has a constant value
    return when_constant(c, function(ast, val){
        warn_unreachable(val ? e : t);
        return          (val ? t : e);
    }, make_real_conditional);
};

function empty(b) {
        return !b || (b[0] == "block" && (!b[1] || b[1].length == 0));
};

function is_string(node) {
        return (node[0] == "string" ||
                node[0] == "unary-prefix" && node[1] == "typeof" ||
                node[0] == "binary" && node[1] == "+" &&
                (is_string(node[2]) || is_string(node[3])));
};

var when_constant = (function(){

        var $NOT_CONSTANT = {};

        // this can only evaluate constant expressions.  If it finds anything
        // not constant, it throws $NOT_CONSTANT.
        function evaluate(expr) {
                switch (expr[0]) {
                    case "string":
                    case "num":
                        return expr[1];
                    case "name":
                    case "atom":
                        switch (expr[1]) {
                            case "true": return true;
                            case "false": return false;
                        }
                        break;
                    case "unary-prefix":
                        switch (expr[1]) {
                            case "!": return !evaluate(expr[2]);
                            case "typeof": return typeof evaluate(expr[2]);
                            case "~": return ~evaluate(expr[2]);
                            case "-": return -evaluate(expr[2]);
                            case "+": return +evaluate(expr[2]);
                        }
                        break;
                    case "binary":
                        var left = expr[2], right = expr[3];
                        switch (expr[1]) {
                            case "&&"         : return evaluate(left) &&         evaluate(right);
                            case "||"         : return evaluate(left) ||         evaluate(right);
                            case "|"          : return evaluate(left) |          evaluate(right);
                            case "&"          : return evaluate(left) &          evaluate(right);
                            case "^"          : return evaluate(left) ^          evaluate(right);
                            case "+"          : return evaluate(left) +          evaluate(right);
                            case "*"          : return evaluate(left) *          evaluate(right);
                            case "/"          : return evaluate(left) /          evaluate(right);
                            case "-"          : return evaluate(left) -          evaluate(right);
                            case "<<"         : return evaluate(left) <<         evaluate(right);
                            case ">>"         : return evaluate(left) >>         evaluate(right);
                            case ">>>"        : return evaluate(left) >>>        evaluate(right);
                            case "=="         : return evaluate(left) ==         evaluate(right);
                            case "==="        : return evaluate(left) ===        evaluate(right);
                            case "!="         : return evaluate(left) !=         evaluate(right);
                            case "!=="        : return evaluate(left) !==        evaluate(right);
                            case "<"          : return evaluate(left) <          evaluate(right);
                            case "<="         : return evaluate(left) <=         evaluate(right);
                            case ">"          : return evaluate(left) >          evaluate(right);
                            case ">="         : return evaluate(left) >=         evaluate(right);
                            case "in"         : return evaluate(left) in         evaluate(right);
                            case "instanceof" : return evaluate(left) instanceof evaluate(right);
                        }
                }
                throw $NOT_CONSTANT;
        };

        return function(expr, yes, no) {
                try {
                        var val = evaluate(expr), ast;
                        switch (typeof val) {
                            case "string": ast =  [ "string", val ]; break;
                            case "number": ast =  [ "num", val ]; break;
                            case "boolean": ast =  [ "name", String(val) ]; break;
                            default: throw new Error("Can't handle constant of type: " + (typeof val));
                        }
                        return yes.call(expr, ast, val);
                } catch(ex) {
                        if (ex === $NOT_CONSTANT) {
                                if (expr[0] == "binary"
                                    && (expr[1] == "===" || expr[1] == "!==")
                                    && ((is_string(expr[2]) && is_string(expr[3]))
                                        || (boolean_expr(expr[2]) && boolean_expr(expr[3])))) {
                                        expr[1] = expr[1].substr(0, 2);
                                }
                                else if (no && expr[0] == "binary"
                                         && (expr[1] == "||" || expr[1] == "&&")) {
                                    // the whole expression is not constant but the lval may be...
                                    try {
                                        var lval = evaluate(expr[2]);
                                        expr = ((expr[1] == "&&" && (lval ? expr[3] : lval))    ||
                                                (expr[1] == "||" && (lval ? lval    : expr[3])) ||
                                                expr);
                                    } catch(ex2) {
                                        // IGNORE... lval is not constant
                                    }
                                }
                                return no ? no.call(expr, expr) : null;
                        }
                        else throw ex;
                }
        };

})();

function warn_unreachable(ast) {
        if (!empty(ast))
                warn("Dropping unreachable code: " + gen_code(ast, true));
};

function prepare_ifs(ast) {
        var w = ast_walker(), walk = w.walk;
        // In this first pass, we rewrite ifs which abort with no else with an
        // if-else.  For example:
        //
        // if (x) {
        //     blah();
        //     return y;
        // }
        // foobar();
        //
        // is rewritten into:
        //
        // if (x) {
        //     blah();
        //     return y;
        // } else {
        //     foobar();
        // }
        function redo_if(statements) {
                statements = MAP(statements, walk);

                for (var i = 0; i < statements.length; ++i) {
                        var fi = statements[i];
                        if (fi[0] != "if") continue;

                        if (fi[3] && walk(fi[3])) continue;

                        var t = walk(fi[2]);
                        if (!aborts(t)) continue;

                        var conditional = walk(fi[1]);

                        var e_body = statements.slice(i + 1);
                        var e = e_body.length == 1 ? e_body[0] : [ "block", e_body ];

                        var ret = statements.slice(0, i).concat([ [
                                fi[0],          // "if"
                                conditional,    // conditional
                                t,              // then
                                e               // else
                        ] ]);

                        return redo_if(ret);
                }

                return statements;
        };

        function redo_if_lambda(name, args, body) {
                body = redo_if(body);
                return [ this[0], name, args, body ];
        };

        function redo_if_block(statements) {
                return [ this[0], statements != null ? redo_if(statements) : null ];
        };

        return w.with_walkers({
                "defun": redo_if_lambda,
                "function": redo_if_lambda,
                "block": redo_if_block,
                "splice": redo_if_block,
                "toplevel": function(statements) {
                        return [ this[0], redo_if(statements) ];
                },
                "try": function(t, c, f) {
                        return [
                                this[0],
                                redo_if(t),
                                c != null ? [ c[0], redo_if(c[1]) ] : null,
                                f != null ? redo_if(f) : null
                        ];
                }
        }, function() {
                return walk(ast);
        });
};

function for_side_effects(ast, handler) {
        var w = ast_walker(), walk = w.walk;
        var $stop = {}, $restart = {};
        function stop() { throw $stop };
        function restart() { throw $restart };
        function found(){ return handler.call(this, this, w, stop, restart) };
        function unary(op) {
                if (op == "++" || op == "--")
                        return found.apply(this, arguments);
        };
        return w.with_walkers({
                "try": found,
                "throw": found,
                "return": found,
                "new": found,
                "switch": found,
                "break": found,
                "continue": found,
                "assign": found,
                "call": found,
                "if": found,
                "for": found,
                "for-in": found,
                "while": found,
                "do": found,
                "return": found,
                "unary-prefix": unary,
                "unary-postfix": unary,
                "defun": found
        }, function(){
                while (true) try {
                        walk(ast);
                        break;
                } catch(ex) {
                        if (ex === $stop) break;
                        if (ex === $restart) continue;
                        throw ex;
                }
        });
};

function ast_lift_variables(ast) {
        var w = ast_walker(), walk = w.walk, scope;
        function do_body(body, env) {
                var _scope = scope;
                scope = env;
                body = MAP(body, walk);
                var hash = {}, names = MAP(env.names, function(type, name){
                        if (type != "var") return MAP.skip;
                        if (!env.references(name)) return MAP.skip;
                        hash[name] = true;
                        return [ name ];
                });
                if (names.length > 0) {
                        // looking for assignments to any of these variables.
                        // we can save considerable space by moving the definitions
                        // in the var declaration.
                        for_side_effects([ "block", body ], function(ast, walker, stop, restart) {
                                if (ast[0] == "assign"
                                    && ast[1] === true
                                    && ast[2][0] == "name"
                                    && HOP(hash, ast[2][1])) {
                                        // insert the definition into the var declaration
                                        for (var i = names.length; --i >= 0;) {
                                                if (names[i][0] == ast[2][1]) {
                                                        if (names[i][1]) // this name already defined, we must stop
                                                                stop();
                                                        names[i][1] = ast[3]; // definition
                                                        names.push(names.splice(i, 1)[0]);
                                                        break;
                                                }
                                        }
                                        // remove this assignment from the AST.
                                        var p = walker.parent();
                                        if (p[0] == "seq") {
                                                var a = p[2];
                                                a.unshift(0, p.length);
                                                p.splice.apply(p, a);
                                        }
                                        else if (p[0] == "stat") {
                                                p.splice(0, p.length, "block"); // empty statement
                                        }
                                        else {
                                                stop();
                                        }
                                        restart();
                                }
                                stop();
                        });
                        body.unshift([ "var", names ]);
                }
                scope = _scope;
                return body;
        };
        function _vardefs(defs) {
                var ret = null;
                for (var i = defs.length; --i >= 0;) {
                        var d = defs[i];
                        if (!d[1]) continue;
                        d = [ "assign", true, [ "name", d[0] ], d[1] ];
                        if (ret == null) ret = d;
                        else ret = [ "seq", d, ret ];
                }
                if (ret == null) {
                        if (w.parent()[0] == "for-in")
                                return [ "name", defs[0][0] ];
                        return MAP.skip;
                }
                return [ "stat", ret ];
        };
        function _toplevel(body) {
                return [ this[0], do_body(body, this.scope) ];
        };
        return w.with_walkers({
                "function": function(name, args, body){
                        for (var i = args.length; --i >= 0 && !body.scope.references(args[i]);)
                                args.pop();
                        if (!body.scope.references(name)) name = null;
                        return [ this[0], name, args, do_body(body, body.scope) ];
                },
                "defun": function(name, args, body){
                        if (!scope.references(name)) return MAP.skip;
                        for (var i = args.length; --i >= 0 && !body.scope.references(args[i]);)
                                args.pop();
                        return [ this[0], name, args, do_body(body, body.scope) ];
                },
                "var": _vardefs,
                "toplevel": _toplevel
        }, function(){
                return walk(ast_add_scope(ast));
        });
};

function ast_squeeze(ast, options) {
        options = defaults(options, {
                make_seqs   : true,
                dead_code   : true,
                keep_comps  : true,
                no_warnings : false
        });

        var w = ast_walker(), walk = w.walk, scope;

        function negate(c) {
                var not_c = [ "unary-prefix", "!", c ];
                switch (c[0]) {
                    case "unary-prefix":
                        return c[1] == "!" && boolean_expr(c[2]) ? c[2] : not_c;
                    case "seq":
                        c = slice(c);
                        c[c.length - 1] = negate(c[c.length - 1]);
                        return c;
                    case "conditional":
                        return best_of(not_c, [ "conditional", c[1], negate(c[2]), negate(c[3]) ]);
                    case "binary":
                        var op = c[1], left = c[2], right = c[3];
                        if (!options.keep_comps) switch (op) {
                            case "<="  : return [ "binary", ">", left, right ];
                            case "<"   : return [ "binary", ">=", left, right ];
                            case ">="  : return [ "binary", "<", left, right ];
                            case ">"   : return [ "binary", "<=", left, right ];
                        }
                        switch (op) {
                            case "=="  : return [ "binary", "!=", left, right ];
                            case "!="  : return [ "binary", "==", left, right ];
                            case "===" : return [ "binary", "!==", left, right ];
                            case "!==" : return [ "binary", "===", left, right ];
                            case "&&"  : return best_of(not_c, [ "binary", "||", negate(left), negate(right) ]);
                            case "||"  : return best_of(not_c, [ "binary", "&&", negate(left), negate(right) ]);
                        }
                        break;
                }
                return not_c;
        };

        function with_scope(s, cont) {
                var _scope = scope;
                scope = s;
                var ret = cont();
                ret.scope = s;
                scope = _scope;
                return ret;
        };

        function rmblock(block) {
                if (block != null && block[0] == "block" && block[1]) {
                        if (block[1].length == 1)
                                block = block[1][0];
                        else if (block[1].length == 0)
                                block = [ "block" ];
                }
                return block;
        };

        function _lambda(name, args, body) {
                var is_defun = this[0] == "defun";
                body = with_scope(body.scope, function(){
                        var ret = tighten(body, "lambda");
                        if (!is_defun && name && !scope.references(name))
                                name = null;
                        return ret;
                });
                return [ this[0], name, args, body ];
        };

        // this function does a few things:
        // 1. discard useless blocks
        // 2. join consecutive var declarations
        // 3. remove obviously dead code
        // 4. transform consecutive statements using the comma operator
        // 5. if block_type == "lambda" and it detects constructs like if(foo) return ... - rewrite like if (!foo) { ... }
        function tighten(statements, block_type) {
                statements = MAP(statements, walk);

                statements = statements.reduce(function(a, stat){
                        if (stat[0] == "block") {
                                if (stat[1]) {
                                        a.push.apply(a, stat[1]);
                                }
                        } else {
                                a.push(stat);
                        }
                        return a;
                }, []);

                statements = (function(a, prev){
                        statements.forEach(function(cur){
                                if (prev && ((cur[0] == "var" && prev[0] == "var") ||
                                             (cur[0] == "const" && prev[0] == "const"))) {
                                        prev[1] = prev[1].concat(cur[1]);
                                } else {
                                        a.push(cur);
                                        prev = cur;
                                }
                        });
                        return a;
                })([]);

                if (options.dead_code) statements = (function(a, has_quit){
                        statements.forEach(function(st){
                                if (has_quit) {
                                        if (st[0] == "function" || st[0] == "defun") {
                                                a.push(st);
                                        }
                                        else if (st[0] == "var" || st[0] == "const") {
                                                if (!options.no_warnings)
                                                        warn("Variables declared in unreachable code");
                                                st[1] = MAP(st[1], function(def){
                                                        if (def[1] && !options.no_warnings)
                                                                warn_unreachable([ "assign", true, [ "name", def[0] ], def[1] ]);
                                                        return [ def[0] ];
                                                });
                                                a.push(st);
                                        }
                                        else if (!options.no_warnings)
                                                warn_unreachable(st);
                                }
                                else {
                                        a.push(st);
                                        if (member(st[0], [ "return", "throw", "break", "continue" ]))
                                                has_quit = true;
                                }
                        });
                        return a;
                })([]);

                if (options.make_seqs) statements = (function(a, prev) {
                        statements.forEach(function(cur){
                                if (prev && prev[0] == "stat" && cur[0] == "stat") {
                                        prev[1] = [ "seq", prev[1], cur[1] ];
                                } else {
                                        a.push(cur);
                                        prev = cur;
                                }
                        });
                        if (a.length >= 2
                            && a[a.length-2][0] == "stat"
                            && (a[a.length-1][0] == "return" || a[a.length-1][0] == "throw")
                            && a[a.length-1][1])
                        {
                                a.splice(a.length - 2, 2,
                                         [ a[a.length-1][0],
                                           [ "seq", a[a.length-2][1], a[a.length-1][1] ]]);
                        }
                        return a;
                })([]);

                // this increases jQuery by 1K.  Probably not such a good idea after all..
                // part of this is done in prepare_ifs anyway.
                // if (block_type == "lambda") statements = (function(i, a, stat){
                //         while (i < statements.length) {
                //                 stat = statements[i++];
                //                 if (stat[0] == "if" && !stat[3]) {
                //                         if (stat[2][0] == "return" && stat[2][1] == null) {
                //                                 a.push(make_if(negate(stat[1]), [ "block", statements.slice(i) ]));
                //                                 break;
                //                         }
                //                         var last = last_stat(stat[2]);
                //                         if (last[0] == "return" && last[1] == null) {
                //                                 a.push(make_if(stat[1], [ "block", stat[2][1].slice(0, -1) ], [ "block", statements.slice(i) ]));
                //                                 break;
                //                         }
                //                 }
                //                 a.push(stat);
                //         }
                //         return a;
                // })(0, []);

                return statements;
        };

        function make_if(c, t, e) {
                return when_constant(c, function(ast, val){
                        if (val) {
                                warn_unreachable(e);
                                return t;
                        } else {
                                warn_unreachable(t);
                                return e;
                        }
                }, function() {
                        return make_real_if(c, t, e);
                });
        };

        function make_real_if(c, t, e) {
                c = walk(c);
                t = walk(t);
                e = walk(e);

                if (empty(t)) {
                        c = negate(c);
                        t = e;
                        e = null;
                } else if (empty(e)) {
                        e = null;
                } else {
                        // if we have both else and then, maybe it makes sense to switch them?
                        (function(){
                                var a = gen_code(c);
                                var n = negate(c);
                                var b = gen_code(n);
                                if (b.length < a.length) {
                                        var tmp = t;
                                        t = e;
                                        e = tmp;
                                        c = n;
                                }
                        })();
                }
                if (empty(e) && empty(t))
                        return [ "stat", c ];
                var ret = [ "if", c, t, e ];
                if (t[0] == "if" && empty(t[3]) && empty(e)) {
                        ret = best_of(ret, walk([ "if", [ "binary", "&&", c, t[1] ], t[2] ]));
                }
                else if (t[0] == "stat") {
                        if (e) {
                                if (e[0] == "stat") {
                                        ret = best_of(ret, [ "stat", make_conditional(c, t[1], e[1]) ]);
                                }
                        }
                        else {
                                ret = best_of(ret, [ "stat", make_conditional(c, t[1]) ]);
                        }
                }
                else if (e && t[0] == e[0] && (t[0] == "return" || t[0] == "throw") && t[1] && e[1]) {
                        ret = best_of(ret, [ t[0], make_conditional(c, t[1], e[1] ) ]);
                }
                else if (e && aborts(t)) {
                        ret = [ [ "if", c, t ] ];
                        if (e[0] == "block") {
                                if (e[1]) ret = ret.concat(e[1]);
                        }
                        else {
                                ret.push(e);
                        }
                        ret = walk([ "block", ret ]);
                }
                else if (t && aborts(e)) {
                        ret = [ [ "if", negate(c), e ] ];
                        if (t[0] == "block") {
                                if (t[1]) ret = ret.concat(t[1]);
                        } else {
                                ret.push(t);
                        }
                        ret = walk([ "block", ret ]);
                }
                return ret;
        };

        function _do_while(cond, body) {
                return when_constant(cond, function(cond, val){
                        if (!val) {
                                warn_unreachable(body);
                                return [ "block" ];
                        } else {
                                return [ "for", null, null, null, walk(body) ];
                        }
                });
        };

        return w.with_walkers({
                "sub": function(expr, subscript) {
                        if (subscript[0] == "string") {
                                var name = subscript[1];
                                if (is_identifier(name))
                                        return [ "dot", walk(expr), name ];
                                else if (/^[1-9][0-9]*$/.test(name) || name === "0")
                                        return [ "sub", walk(expr), [ "num", parseInt(name, 10) ] ];
                        }
                },
                "if": make_if,
                "toplevel": function(body) {
                        return [ "toplevel", with_scope(this.scope, function(){
                                return tighten(body);
                        }) ];
                },
                "switch": function(expr, body) {
                        var last = body.length - 1;
                        return [ "switch", walk(expr), MAP(body, function(branch, i){
                                var block = tighten(branch[1]);
                                if (i == last && block.length > 0) {
                                        var node = block[block.length - 1];
                                        if (node[0] == "break" && !node[1])
                                                block.pop();
                                }
                                return [ branch[0] ? walk(branch[0]) : null, block ];
                        }) ];
                },
                "function": _lambda,
                "defun": _lambda,
                "block": function(body) {
                        if (body) return rmblock([ "block", tighten(body) ]);
                },
                "binary": function(op, left, right) {
                        return when_constant([ "binary", op, walk(left), walk(right) ], function yes(c){
                                return best_of(walk(c), this);
                        }, function no() {
                                return this;
                        });
                },
                "conditional": function(c, t, e) {
                        return make_conditional(walk(c), walk(t), walk(e));
                },
                "try": function(t, c, f) {
                        return [
                                "try",
                                tighten(t),
                                c != null ? [ c[0], tighten(c[1]) ] : null,
                                f != null ? tighten(f) : null
                        ];
                },
                "unary-prefix": function(op, expr) {
                        expr = walk(expr);
                        var ret = [ "unary-prefix", op, expr ];
                        if (op == "!")
                                ret = best_of(ret, negate(expr));
                        return when_constant(ret, function(ast, val){
                                return walk(ast); // it's either true or false, so minifies to !0 or !1
                        }, function() { return ret });
                },
                "name": function(name) {
                        switch (name) {
                            case "true": return [ "unary-prefix", "!", [ "num", 0 ]];
                            case "false": return [ "unary-prefix", "!", [ "num", 1 ]];
                        }
                },
                "new": function(ctor, args) {
                        if (ctor[0] == "name" && ctor[1] == "Array" && !scope.has("Array")) {
                                if (args.length != 1) {
                                        return [ "array", args ];
                                } else {
                                        return [ "call", [ "name", "Array" ], args ];
                                }
                        }
                },
                "call": function(expr, args) {
                        if (expr[0] == "name" && expr[1] == "Array" && args.length != 1 && !scope.has("Array")) {
                                return [ "array", args ];
                        }
                },
                "while": _do_while
        }, function() {
                for (var i = 0; i < 2; ++i) {
                        ast = prepare_ifs(ast);
                        ast = ast_add_scope(ast);
                        ast = walk(ast);
                }
                return ast;
        });
};

/* -----[ re-generate code from the AST ]----- */

var DOT_CALL_NO_PARENS = /*jsp.*/array_to_hash([
        "name",
        "array",
        "object",
        "string",
        "dot",
        "sub",
        "call",
        "regexp"
]);

function make_string(str, ascii_only) {
        var dq = 0, sq = 0;
        str = str.replace(/[\\\b\f\n\r\t\x22\x27\u2028\u2029]/g, function(s){
                switch (s) {
                    case "\\": return "\\\\";
                    case "\b": return "\\b";
                    case "\f": return "\\f";
                    case "\n": return "\\n";
                    case "\r": return "\\r";
                    case "\t": return "\\t";
                    case "\u2028": return "\\u2028";
                    case "\u2029": return "\\u2029";
                    case '"': ++dq; return '"';
                    case "'": ++sq; return "'";
                }
                return s;
        });
        if (ascii_only) str = to_ascii(str);
        if (dq > sq) return "'" + str.replace(/\x27/g, "\\'") + "'";
        else return '"' + str.replace(/\x22/g, '\\"') + '"';
};

function to_ascii(str) {
        return str.replace(/[\u0080-\uffff]/g, function(ch) {
                var code = ch.charCodeAt(0).toString(16);
                while (code.length < 4) code = "0" + code;
                return "\\u" + code;
        });
};

var SPLICE_NEEDS_BRACKETS = /*jsp.*/array_to_hash([ "if", "while", "do", "for", "for-in", "with" ]);

function gen_code(ast, options) {
        options = defaults(options, {
                indent_start : 0,
                indent_level : 4,
                quote_keys   : false,
                space_colon  : false,
                beautify     : false,
                ascii_only   : false,
                inline_script: false
        });
        var beautify = !!options.beautify;
        var indentation = 0,
            newline = beautify ? "\n" : "",
            space = beautify ? " " : "";

        function encode_string(str) {
                var ret = make_string(str, options.ascii_only);
                if (options.inline_script)
                        ret = ret.replace(/<\x2fscript([>/\t\n\f\r ])/gi, "<\\/script$1");
                return ret;
        };

        function make_name(name) {
                name = name.toString();
                if (options.ascii_only)
                        name = to_ascii(name);
                return name;
        };

        function indent(line) {
                if (line == null)
                        line = "";
                if (beautify)
                        line = repeat_string(" ", options.indent_start + indentation * options.indent_level) + line;
                return line;
        };

        function with_indent(cont, incr) {
                if (incr == null) incr = 1;
                indentation += incr;
                try { return cont.apply(null, slice(arguments, 1)); }
                finally { indentation -= incr; }
        };

        function add_spaces(a) {
                if (beautify)
                        return a.join(" ");
                var b = [];
                for (var i = 0; i < a.length; ++i) {
                        var next = a[i + 1];
                        b.push(a[i]);
                        if (next &&
                            ((/[a-z0-9_\x24]$/i.test(a[i].toString()) && /^[a-z0-9_\x24]/i.test(next.toString())) ||
                             (/[\+\-]$/.test(a[i].toString()) && /^[\+\-]/.test(next.toString())))) {
                                b.push(" ");
                        }
                }
                return b.join("");
        };

        function add_commas(a) {
                return a.join("," + space);
        };

        function parenthesize(expr) {
                var gen = make(expr);
                for (var i = 1; i < arguments.length; ++i) {
                        var el = arguments[i];
                        if ((el instanceof Function && el(expr)) || expr[0] == el)
                                return "(" + gen + ")";
                }
                return gen;
        };

        function best_of(a) {
                if (a.length == 1) {
                        return a[0];
                }
                if (a.length == 2) {
                        var b = a[1];
                        a = a[0];
                        return a.length <= b.length ? a : b;
                }
                return best_of([ a[0], best_of(a.slice(1)) ]);
        };

        function needs_parens(expr) {
                if (expr[0] == "function" || expr[0] == "object") {
                        // dot/call on a literal function requires the
                        // function literal itself to be parenthesized
                        // only if it's the first "thing" in a
                        // statement.  This means that the parent is
                        // "stat", but it could also be a "seq" and
                        // we're the first in this "seq" and the
                        // parent is "stat", and so on.  Messy stuff,
                        // but it worths the trouble.
                        var a = slice(w.stack()), self = a.pop(), p = a.pop();
                        while (p) {
                                if (p[0] == "stat") return true;
                                if (((p[0] == "seq" || p[0] == "call" || p[0] == "dot" || p[0] == "sub" || p[0] == "conditional") && p[1] === self) ||
                                    ((p[0] == "binary" || p[0] == "assign" || p[0] == "unary-postfix") && p[2] === self)) {
                                        self = p;
                                        p = a.pop();
                                } else {
                                        return false;
                                }
                        }
                }
                return !HOP(DOT_CALL_NO_PARENS, expr[0]);
        };

        function make_num(num) {
                var str = num.toString(10), a = [ str.replace(/^0\./, ".") ], m;
                if (Math.floor(num) === num) {
                        a.push("0x" + num.toString(16).toLowerCase(), // probably pointless
                               "0" + num.toString(8)); // same.
                        if ((m = /^(.*?)(0+)$/.exec(num))) {
                                a.push(m[1] + "e" + m[2].length);
                        }
                } else if ((m = /^0?\.(0+)(.*)$/.exec(num))) {
                        a.push(m[2] + "e-" + (m[1].length + m[2].length),
                               str.substr(str.indexOf(".")));
                }
                return best_of(a);
        };

        var w = ast_walker();
        var make = w.walk;
        return w.with_walkers({
                "string": encode_string,
                "num": make_num,
                "name": make_name,
                "toplevel": function(statements) {
                        return make_block_statements(statements)
                                .join(newline + newline);
                },
                "splice": function(statements) {
                        var parent = w.parent();
                        if (HOP(SPLICE_NEEDS_BRACKETS, parent)) {
                                // we need block brackets in this case
                                return make_block.apply(this, arguments);
                        } else {
                                return MAP(make_block_statements(statements, true),
                                           function(line, i) {
                                                   // the first line is already indented
                                                   return i > 0 ? indent(line) : line;
                                           }).join(newline);
                        }
                },
                "block": make_block,
                "var": function(defs) {
                        return "var " + add_commas(MAP(defs, make_1vardef)) + ";";
                },
                "const": function(defs) {
                        return "const " + add_commas(MAP(defs, make_1vardef)) + ";";
                },
                "try": function(tr, ca, fi) {
                        var out = [ "try", make_block(tr) ];
                        if (ca) out.push("catch", "(" + ca[0] + ")", make_block(ca[1]));
                        if (fi) out.push("finally", make_block(fi));
                        return add_spaces(out);
                },
                "throw": function(expr) {
                        return add_spaces([ "throw", make(expr) ]) + ";";
                },
                "new": function(ctor, args) {
                        args = args.length > 0 ? "(" + add_commas(MAP(args, make)) + ")" : "";
                        return add_spaces([ "new", parenthesize(ctor, "seq", "binary", "conditional", "assign", function(expr){
                                var w = ast_walker(), has_call = {};
                                try {
                                        w.with_walkers({
                                                "call": function() { throw has_call },
                                                "function": function() { return this }
                                        }, function(){
                                                w.walk(expr);
                                        });
                                } catch(ex) {
                                        if (ex === has_call)
                                                return true;
                                        throw ex;
                                }
                        }) + args ]);
                },
                "switch": function(expr, body) {
                        return add_spaces([ "switch", "(" + make(expr) + ")", make_switch_block(body) ]);
                },
                "break": function(label) {
                        var out = "break";
                        if (label != null)
                                out += " " + make_name(label);
                        return out + ";";
                },
                "continue": function(label) {
                        var out = "continue";
                        if (label != null)
                                out += " " + make_name(label);
                        return out + ";";
                },
                "conditional": function(co, th, el) {
                        return add_spaces([ parenthesize(co, "assign", "seq", "conditional"), "?",
                                            parenthesize(th, "seq"), ":",
                                            parenthesize(el, "seq") ]);
                },
                "assign": function(op, lvalue, rvalue) {
                        if (op && op !== true) op += "=";
                        else op = "=";
                        return add_spaces([ make(lvalue), op, parenthesize(rvalue, "seq") ]);
                },
                "dot": function(expr) {
                        var out = make(expr), i = 1;
                        if (expr[0] == "num") {
                                if (!/\./.test(expr[1]))
                                        out += ".";
                        } else if (needs_parens(expr))
                                out = "(" + out + ")";
                        while (i < arguments.length)
                                out += "." + make_name(arguments[i++]);
                        return out;
                },
                "call": function(func, args) {
                        var f = make(func);
                        if (needs_parens(func))
                                f = "(" + f + ")";
                        return f + "(" + add_commas(MAP(args, function(expr){
                                return parenthesize(expr, "seq");
                        })) + ")";
                },
                "function": make_function,
                "defun": make_function,
                "if": function(co, th, el) {
                        var out = [ "if", "(" + make(co) + ")", el ? make_then(th) : make(th) ];
                        if (el) {
                                out.push("else", make(el));
                        }
                        return add_spaces(out);
                },
                "for": function(init, cond, step, block) {
                        var out = [ "for" ];
                        init = (init != null ? make(init) : "").replace(/;*\s*$/, ";" + space);
                        cond = (cond != null ? make(cond) : "").replace(/;*\s*$/, ";" + space);
                        step = (step != null ? make(step) : "").replace(/;*\s*$/, "");
                        var args = init + cond + step;
                        if (args == "; ; ") args = ";;";
                        out.push("(" + args + ")", make(block));
                        return add_spaces(out);
                },
                "for-in": function(vvar, key, hash, block) {
                        return add_spaces([ "for", "(" +
                                            (vvar ? make(vvar).replace(/;+$/, "") : make(key)),
                                            "in",
                                            make(hash) + ")", make(block) ]);
                },
                "while": function(condition, block) {
                        return add_spaces([ "while", "(" + make(condition) + ")", make(block) ]);
                },
                "do": function(condition, block) {
                        return add_spaces([ "do", make(block), "while", "(" + make(condition) + ")" ]) + ";";
                },
                "return": function(expr) {
                        var out = [ "return" ];
                        if (expr != null) out.push(make(expr));
                        return add_spaces(out) + ";";
                },
                "binary": function(operator, lvalue, rvalue) {
                        var left = make(lvalue), right = make(rvalue);
                        // XXX: I'm pretty sure other cases will bite here.
                        //      we need to be smarter.
                        //      adding parens all the time is the safest bet.
                        if (member(lvalue[0], [ "assign", "conditional", "seq" ]) ||
                            lvalue[0] == "binary" && PRECEDENCE[operator] > PRECEDENCE[lvalue[1]]) {
                                left = "(" + left + ")";
                        }
                        if (member(rvalue[0], [ "assign", "conditional", "seq" ]) ||
                            rvalue[0] == "binary" && PRECEDENCE[operator] >= PRECEDENCE[rvalue[1]] &&
                            !(rvalue[1] == operator && member(operator, [ "&&", "||", "*" ]))) {
                                right = "(" + right + ")";
                        }
                        else if (!beautify && options.inline_script && (operator == "<" || operator == "<<")
                                 && rvalue[0] == "regexp" && /^script/i.test(rvalue[1])) {
                                right = " " + right;
                        }
                        return add_spaces([ left, operator, right ]);
                },
                "unary-prefix": function(operator, expr) {
                        var val = make(expr);
                        if (!(expr[0] == "num" || (expr[0] == "unary-prefix" && !HOP(OPERATORS, operator + expr[1])) || !needs_parens(expr)))
                                val = "(" + val + ")";
                        return operator + (jsp.is_alphanumeric_char(operator.charAt(0)) ? " " : "") + val;
                },
                "unary-postfix": function(operator, expr) {
                        var val = make(expr);
                        if (!(expr[0] == "num" || (expr[0] == "unary-postfix" && !HOP(OPERATORS, operator + expr[1])) || !needs_parens(expr)))
                                val = "(" + val + ")";
                        return val + operator;
                },
                "sub": function(expr, subscript) {
                        var hash = make(expr);
                        if (needs_parens(expr))
                                hash = "(" + hash + ")";
                        return hash + "[" + make(subscript) + "]";
                },
                "object": function(props) {
                        if (props.length == 0)
                                return "{}";
                        return "{" + newline + with_indent(function(){
                                return MAP(props, function(p){
                                        if (p.length == 3) {
                                                // getter/setter.  The name is in p[0], the arg.list in p[1][2], the
                                                // body in p[1][3] and type ("get" / "set") in p[2].
                                                return indent(make_function(p[0], p[1][2], p[1][3], p[2]));
                                        }
                                        var key = p[0], val = parenthesize(p[1], "seq");
                                        if (options.quote_keys) {
                                                key = encode_string(key);
                                        } else if ((typeof key == "number" || !beautify && +key + "" == key)
                                                   && parseFloat(key) >= 0) {
                                                key = make_num(+key);
                                        } else if (!is_identifier(key)) {
                                                key = encode_string(key);
                                        }
                                        return indent(add_spaces(beautify && options.space_colon
                                                                 ? [ key, ":", val ]
                                                                 : [ key + ":", val ]));
                                }).join("," + newline);
                        }) + newline + indent("}");
                },
                "regexp": function(rx, mods) {
                        return "/" + rx + "/" + mods;
                },
                "array": function(elements) {
                        if (elements.length == 0) return "[]";
                        return add_spaces([ "[", add_commas(MAP(elements, function(el){
                                if (!beautify && el[0] == "atom" && el[1] == "undefined") return "";
                                return parenthesize(el, "seq");
                        })), "]" ]);
                },
                "stat": function(stmt) {
                        return make(stmt).replace(/;*\s*$/, ";");
                },
                "seq": function() {
                        return add_commas(MAP(slice(arguments), make));
                },
                "label": function(name, block) {
                        return add_spaces([ make_name(name), ":", make(block) ]);
                },
                "with": function(expr, block) {
                        return add_spaces([ "with", "(" + make(expr) + ")", make(block) ]);
                },
                "atom": function(name) {
                        return make_name(name);
                }
        }, function(){ return make(ast) });

        // The squeezer replaces "block"-s that contain only a single
        // statement with the statement itself; technically, the AST
        // is correct, but this can create problems when we output an
        // IF having an ELSE clause where the THEN clause ends in an
        // IF *without* an ELSE block (then the outer ELSE would refer
        // to the inner IF).  This function checks for this case and
        // adds the block brackets if needed.
        function make_then(th) {
                if (th[0] == "do") {
                        // https://github.com/mishoo/UglifyJS/issues/#issue/57
                        // IE croaks with "syntax error" on code like this:
                        //     if (foo) do ... while(cond); else ...
                        // we need block brackets around do/while
                        return make_block([ th ]);
                }
                var b = th;
                while (true) {
                        var type = b[0];
                        if (type == "if") {
                                if (!b[3])
                                        // no else, we must add the block
                                        return make([ "block", [ th ]]);
                                b = b[3];
                        }
                        else if (type == "while" || type == "do") b = b[2];
                        else if (type == "for" || type == "for-in") b = b[4];
                        else break;
                }
                return make(th);
        };

        function make_function(name, args, body, keyword) {
                var out = keyword || "function";
                if (name) {
                        out += " " + make_name(name);
                }
                out += "(" + add_commas(MAP(args, make_name)) + ")";
                return add_spaces([ out, make_block(body) ]);
        };

        function must_has_semicolon(node) {
                switch (node[0]) {
                    case "with":
                    case "while":
                        return empty(node[2]); // `with' or `while' with empty body?
                    case "for":
                    case "for-in":
                        return empty(node[4]); // `for' with empty body?
                    case "if":
                        if (empty(node[2]) && !node[3]) return true; // `if' with empty `then' and no `else'
                        if (node[3]) {
                                if (empty(node[3])) return true; // `else' present but empty
                                return must_has_semicolon(node[3]); // dive into the `else' branch
                        }
                        return must_has_semicolon(node[2]); // dive into the `then' branch
                }
        };

        function make_block_statements(statements, noindent) {
                for (var a = [], last = statements.length - 1, i = 0; i <= last; ++i) {
                        var stat = statements[i];
                        var code = make(stat);
                        if (code != ";") {
                                if (!beautify && i == last && !must_has_semicolon(stat)) {
                                        code = code.replace(/;+\s*$/, "");
                                }
                                a.push(code);
                        }
                }
                return noindent ? a : MAP(a, indent);
        };

        function make_switch_block(body) {
                var n = body.length;
                if (n == 0) return "{}";
                return "{" + newline + MAP(body, function(branch, i){
                        var has_body = branch[1].length > 0, code = with_indent(function(){
                                return indent(branch[0]
                                              ? add_spaces([ "case", make(branch[0]) + ":" ])
                                              : "default:");
                        }, 0.5) + (has_body ? newline + with_indent(function(){
                                return make_block_statements(branch[1]).join(newline);
                        }) : "");
                        if (!beautify && has_body && i < n - 1)
                                code += ";";
                        return code;
                }).join(newline) + newline + indent("}");
        };

        function make_block(statements) {
                if (!statements) return ";";
                if (statements.length == 0) return "{}";
                return "{" + newline + with_indent(function(){
                        return make_block_statements(statements).join(newline);
                }) + newline + indent("}");
        };

        function make_1vardef(def) {
                var name = def[0], val = def[1];
                if (val != null)
                        name = add_spaces([ make_name(name), "=", parenthesize(val, "seq") ]);
                return name;
        };

};

function split_lines(code, max_line_length) {
        var splits = [ 0 ];
        jsp.parse(function(){
                var next_token = jsp.tokenizer(code);
                var last_split = 0;
                var prev_token;
                function current_length(tok) {
                        return tok.pos - last_split;
                };
                function split_here(tok) {
                        last_split = tok.pos;
                        splits.push(last_split);
                };
                function custom(){
                        var tok = next_token.apply(this, arguments);
                        out: {
                                if (prev_token) {
                                        if (prev_token.type == "keyword") break out;
                                }
                                if (current_length(tok) > max_line_length) {
                                        switch (tok.type) {
                                            case "keyword":
                                            case "atom":
                                            case "name":
                                            case "punc":
                                                split_here(tok);
                                                break out;
                                        }
                                }
                        }
                        prev_token = tok;
                        return tok;
                };
                custom.context = function() {
                        return next_token.context.apply(this, arguments);
                };
                return custom;
        }());
        return splits.map(function(pos, i){
                return code.substring(pos, splits[i + 1] || code.length);
        }).join("\n");
};

/* -----[ Utilities ]----- */

function repeat_string(str, i) {
        if (i <= 0) return "";
        if (i == 1) return str;
        var d = repeat_string(str, i >> 1);
        d += d;
        if (i & 1) d += str;
        return d;
};

function defaults(args, defs) {
        var ret = {};
        if (args === true)
                args = {};
        for (var i in defs) if (HOP(defs, i)) {
                ret[i] = (args && HOP(args, i)) ? args[i] : defs[i];
        }
        return ret;
};

function is_identifier(name) {
        return /^[a-z_$][a-z0-9_$]*$/i.test(name)
                && name != "this"
                && !HOP(jsp.KEYWORDS_ATOM, name)
                && !HOP(jsp.RESERVED_WORDS, name)
                && !HOP(jsp.KEYWORDS, name);
};

function HOP(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
};

// some utilities

var MAP;

(function(){
        MAP = function(a, f, o) {
                var ret = [], top = [], i;
                function doit() {
                        var val = f.call(o, a[i], i);
                        if (val instanceof AtTop) {
                                val = val.v;
                                if (val instanceof Splice) {
                                        top.push.apply(top, val.v);
                                } else {
                                        top.push(val);
                                }
                        }
                        else if (val != skip) {
                                if (val instanceof Splice) {
                                        ret.push.apply(ret, val.v);
                                } else {
                                        ret.push(val);
                                }
                        }
                };
                if (a instanceof Array) for (i = 0; i < a.length; ++i) doit();
                else for (i in a) if (HOP(a, i)) doit();
                return top.concat(ret);
        };
        MAP.at_top = function(val) { return new AtTop(val) };
        MAP.splice = function(val) { return new Splice(val) };
        var skip = MAP.skip = {};
        function AtTop(val) { this.v = val };
        function Splice(val) { this.v = val };
})();

/* -----[ Exports ]----- */
/*
exports.ast_walker = ast_walker;
exports.ast_mangle = ast_mangle;
exports.ast_squeeze = ast_squeeze;
exports.ast_lift_variables = ast_lift_variables;
exports.gen_code = gen_code;
exports.ast_add_scope = ast_add_scope;
exports.set_logger = function(logger) { warn = logger };
exports.make_string = make_string;
exports.split_lines = split_lines;
exports.MAP = MAP;

// keep this last!
exports.ast_squeeze_more = require("./squeeze-more").ast_squeeze_more;
*/

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
(function() {

function parseQML(file) {
    var contents = getUrlContents(file + ".js");
    if (contents) {
        console.log("Using pre-processed content for " + file);
        return eval("(function(){return "+contents+"})();");
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
readQmlDir = function (url) {
    var qmldir = getUrlContents(url += "/qmldir"), // Modifies url here!
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
                internals[match[1]] = {url: url + "/" + match[2]};
            } else {
                if (match.length == 2) {
                    externals[match[0]] = {url: url + "/" + match[1]};
                } else {
                    externals[match[0]] = { url: url + "/" + match[2],
                                            version: match[1] };
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
    src = "(function(){"
        + src
        + ";return {";
    for (i = 0; i < exports.length; i++) {
        // create getters and setters for properties
        // keeps variables synced better
        src += "get " + exports[i] + "(){return " + exports[i] + "},";
        src += "set " + exports[i] + "(){" + exports[i] + " = arguments[0]},";
        // without getters and setters:
        // src += exports[i] + ":" + exports[i] + ",";
    }
    src += "}})()";

    // evaluate source to get the object.
    return eval(src);
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

global.qrc = {
  includesFile: function(path) {
    return typeof qrc[path] != 'undefined';
  }
};

global.Qt = {
  rgba: function(r,g,b,a) {
    return "rgba("
      + Math.round(r * 255) + ","
      + Math.round(g * 255) + ","
      + Math.round(b * 255) + ","
      + a + ")";
  },
  // Buttons masks
  LeftButton: 1,
  RightButton: 2,
  MiddleButton: 4,
  // Modifiers masks
  NoModifier: 0,
  ShiftModifier: 1,
  ControlModifier: 2,
  AltModifier: 4,
  MetaModifier: 8,
  KeypadModifier: 16, // Note: Not available in web
  // Layout directions
  LeftToRight: 0,
  RightToLeft: 1
}

/**
 * Creates and returns a signal with the parameters specified in @p params.
 *
 * @param params Array with the parameters of the signal. Each element has to be
 *               an object with the two properties "type" and "name" specifying
 *               the datatype of the parameter and its name. The type is
 *               currently ignored.
 * @param options Options that allow finetuning of the signal.
 */
global.Signal = function Signal(params, options) {
    options = options || {};
    var connectedSlots = [];
    var obj = options.obj

    var signal = function() {
        for (var i in connectedSlots)
            connectedSlots[i].slot.apply(connectedSlots[i].thisObj, arguments);
    };
    signal.parameters = params || [];
    signal.connect = function() {
        if (arguments.length == 1)
            connectedSlots.push({thisObj: global, slot: arguments[0]});
        else if (typeof arguments[1] == 'string' || arguments[1] instanceof String) {
            if (arguments[0].$tidyupList && arguments[0] !== obj)
                arguments[0].$tidyupList.push(this);
            connectedSlots.push({thisObj: arguments[0], slot: arguments[0][arguments[1]]});
        } else {
            if (arguments[0].$tidyupList && (!obj || (arguments[0] !== obj && arguments[0] !== obj.$parent)))
                arguments[0].$tidyupList.push(this);
            connectedSlots.push({thisObj: arguments[0], slot: arguments[1]});
        }
    }
    signal.disconnect = function() {
        var callType = arguments.length == 1 ? (arguments[0] instanceof Function ? 1 : 2)
                       : (typeof arguments[1] == 'string' || arguments[1] instanceof String) ? 3 : 4;
        for (var i = 0; i < connectedSlots.length; i++) {
            var item = connectedSlots[i];
            if ((callType == 1 && item.slot == arguments[0])
                || (callType == 2 && item.thisObj == arguments[0])
                || (callType == 3 && item.thisObj == arguments[0] && item.slot == arguments[0][arguments[1]])
                || (item.thisObj == arguments[0] && item.slot == arguments[1])
            ) {
                if (item.thisObj)
                    item.thisObj.$tidyupList.splice(item.thisObj.$tidyupList.indexOf(this), 1);
                connectedSlots.splice(i, 1);
                i--; // We have removed an item from the list so the indexes shifted one backwards
            }
        }
    }
    signal.isConnected = function() {
        var callType = arguments.length == 1 ? 1
                       : (typeof arguments[1] == 'string' || arguments[1] instanceof String) ? 2 : 3;
        for (var i in connectedSlots) {
            var item = connectedSlots[i];
            if ((callType == 1 && item.slot == arguments[0])
                || (callType == 2 && item.thisObj == arguments[0] && item.slot == arguments[0][arguments[1]])
                || (item.thisObj == arguments[0] && item.slot == arguments[1])
            )
                return true;
        }
        return false;
    }
    return signal;
}


global.Font = {
  // Capitalization
  MixedCase: "none",
  AllUppercase: "uppercase",
  AllLowercase: "lowercase",
  SmallCaps: "smallcaps",
  Capitalize: "capitalize",
  // Weight
  Light: "lighter",
  Normal: "normal",
  DemiBold: "600",
  Bold: "bold",
  Black: "bolder",
}

global.Easing = {
  Linear: 1,
  InQuad: 2,          OutQuad: 3,     InOutQuad: 4,           OutInQuad: 5,
  InCubic: 6,         OutCubic: 7,    InOutCubic: 8,          OutInCubic: 9,
  InQuart: 10,        OutQuart: 11,   InOutQuart: 12,         OutInQuart: 13,
  InQuint: 14,        OutQuint: 15,   InOutQuint: 16,         OutInQuint: 17,
  InSine: 18,         OutSine: 19,    InOutSine: 20,          OutInSine: 21,
  InExpo: 22,         OutExpo: 23,    InOutExpo: 24,          OutInExpo: 25,
  InCirc: 26,         OutCirc: 27,    InOutCirc: 28,          OutInCirc: 29,
  InElastic: 30,      OutElastic: 31, InOutElastic: 32,       OutInElastic: 33,
  InBack: 34,         OutBack: 35,    InOutBack: 36,          OutInBack: 37,
  InBounce: 38,       OutBounce: 39,  InOutBounce: 40,        OutInBounce: 41
}

var GETTER = "__defineGetter__",
    SETTER = "__defineSetter__",
    Undefined = undefined,
    // Property that is currently beeing evaluated. Used to get the information
    // which property called the getter of a certain other property for
    // evaluation and is thus dependant on it.
    evaluatingProperty = undefined,
    // All object constructors
    constructors = {
      int:         QMLInteger,
      real:        Number,
      double:      Number,
      string:      String,
      bool:        Boolean,
      list:        QMLList,
      color:       QMLColor,
      enum:        Number,
      url:         String,
      variant:     QMLVariant,
      'var':       QMLVariant,
      QMLDocument: QMLComponent
    };
var modules = {
    Main: constructors
  };
/**
 * Inheritance helper
 */
Object.create = function (o) {
    function F() {}
    F.prototype = o;
    return new F();
};

// Helper. Adds a type to the constructor list
global.registerGlobalQmlType = function (name, type) {
  global[type.name]  = type;
  constructors[name] = type;
  modules.Main[name] = type;
};

// Helper. Register a type to a module
global.registerQmlType = function(options) {
  if (typeof options != 'object') {
    registerGlobalQmlType(arguments[0], arguments[1]);
  } else {
    var moduleDescriptor = {
      name:        options.name,
      versions:    options.versions,
      constructor: options.constructor
    };

    if (typeof modules[options.module] == 'undefined')
      modules[options.module] = [];
    modules[options.module].push(moduleDescriptor);
  }
};

global.getConstructor = function (moduleName, version, name) {
  if (typeof modules[moduleName] != 'undefined') {
    for (var i = 0 ; i < modules[moduleName].length ; ++i) {
      var type = modules[moduleName][i];

      if (type.name == name && type.versions.test(version))
        return type.constructor;
    }
  }
  return null;
};

global.collectConstructorsForModule = function (moduleName, version) {
  var constructors = {};

  if (typeof modules[moduleName] == 'undefined') {
    console.warn("module `" + moduleName + "` not found");
    return constructors;
  }
  for (var i = 0 ; i < modules[moduleName].length ; ++i) {
    var module = modules[moduleName][i];

    if (module.versions.test(version)) {
      constructors[module.name] = module.constructor;
    }
  }
  return constructors;
};

global.mergeObjects = function (obj1, obj2) {
  var mergedObject = {};

  if (typeof obj1 != 'undefined' && obj1 != null) {
    for (var key in obj1) { mergedObject[key] = obj1[key]; }
  }
  if (typeof obj2 != 'undefined' && obj2 != null) {
    for (var key in obj2) { mergedObject[key] = obj2[key]; }
  }
  return mergedObject;
}

global.loadImports = function (imports) {
  constructors = mergeObjects(modules.Main, null);
  for (var i = 0 ; i < imports.length ; ++i) {
    var importDesc         = imports[i];
    var moduleConstructors = collectConstructorsForModule(importDesc.subject, importDesc.version);

    if (importDesc.alias != null)
      constructors[importDesc.alias] = mergeObjects(constructors[importDesc.alias], moduleConstructors);
    else
      constructors                   = mergeObjects(constructors,                   moduleConstructors);
  }
}

// Helper. Ought to do absolutely nothing.
function noop(){};

// Helper to prevent some minimization cases. Ought to do "nothing".
function tilt() {arguments.length = 0};

// Helper to clone meta-objects for dynamic element creation
function cloneObject(obj) {
    if (null == obj || typeof obj != "object")
        return obj;
    var copy = new obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) {
            if (typeof obj[attr] == "object")
                copy[attr] = cloneObject(obj[attr]);
            else
                copy[attr] = obj[attr];
        }
    }
    return copy;
}

/**
 * Helper function.
 * Prints msg and values of object. Workaround when using getter functions as
 * Chrome (at least) won't show property values for them.
 * @param {String} msg Message
 * @param {Object} obj Object to use (will be "printed", too)
 * @param {Array} vals Values to list from the object.
 */
function descr(msg, obj, vals) {
    var str = msg + ": [" + obj.id + "] ",
        i;
    for (i = 0; i < vals.length; i++) {
        str += vals[i] + "=" + obj[vals[i]] + " ";
    }
    console.log(str, obj);
}

/**
 * Compile binding. Afterwards you may call binding.eval to evaluate.
 */
QMLBinding.prototype.compile = function() {
    var bindSrc = this.function
                    ? "(function(o, c) { with(c) with(o) " + this.src + "})"
                    : "(function(o, c) { with(c) with(o) return " + this.src + "})";
    this.eval = eval(bindSrc);
}

/**
 * QML Object constructor.
 * @param {Object} meta Meta information about the object and the creation context
 * @return {Object} New qml object
 */
function construct(meta) {
    var item,
        cTree;

    if (meta.object.$class in constructors) {
        item = new constructors[meta.object.$class](meta);
    } else if (cTree = engine.loadComponent(meta.object.$class)) {
        if (cTree.$children.length !== 1)
            console.error("A QML component must only contain one root element!");
        var item = (new QMLComponent({ object: cTree, context: meta.context })).createObject(meta.parent);

        // Recall QMLBaseObject with the meta of the instance in order to get property
        // definitions, etc. from the instance
        QMLBaseObject.call(item, meta);
        if (typeof item.dom != 'undefined')
          item.dom.className += " " + meta.object.$class + (meta.object.id ? " " + meta.object.id : "");
        var dProp; // Handle default properties
    } else {
        console.log("No constructor found for " + meta.object.$class);
        return;
    }

    // id
    if (meta.object.id)
        meta.context[meta.object.id] = item;

    // Apply properties (Bindings won't get evaluated, yet)
    applyProperties(meta.object, item, item, meta.context);

    return item;
}

/**
 * Create property getters and setters for object.
 * @param {Object} obj Object for which gsetters will be set
 * @param {String} propName Property name
 * @param {Object} [options] Options that allow finetuning of the property
 */
function createSimpleProperty(type, obj, propName) {
    var prop = new QMLProperty(type, obj, propName);

    obj[propName + "Changed"] = prop.changed;
    obj.$properties[propName] = prop;
    var getter = function() {
        return obj.$properties[propName].get();
    };
    var setter = function(newVal) {
        return obj.$properties[propName].set(newVal);
    };
    setupGetterSetter(obj, propName, getter, setter);
    if (obj.$isComponentRoot)
        setupGetterSetter(obj.$context, propName, getter, setter);
}

/**
 * Set up simple getter function for property
 */
var setupGetter,
    setupSetter,
    setupGetterSetter;
(function() {

// todo: What's wrong with Object.defineProperty on some browsers?
// Object.defineProperty is the standard way to setup getters and setters.
// However, the following way to use Object.defineProperty don't work on some
// webkit-based browsers, namely Safari, iPad, iPhone and Nokia N9 browser.
// Chrome, firefox and opera still digest them fine.

// So, if the deprecated __defineGetter__ is available, use those, and if not
// use the standard Object.defineProperty (IE for example).

    var useDefineProperty = !(Object[GETTER] && Object[SETTER]);

    if (useDefineProperty) {

        if (!Object.defineProperty) {
            console.log("No __defineGetter__ or defineProperty available!");
        }

        setupGetter = function(obj, propName, func) {
            Object.defineProperty(obj, propName,
                { get: func, configurable: true, enumerable: true } );
        }
        setupSetter = function(obj, propName, func) {
            Object.defineProperty(obj, propName,
                { set: func, configurable: true, enumerable: false });
        }
        setupGetterSetter = function(obj, propName, getter, setter) {
            Object.defineProperty(obj, propName,
                {get: getter, set: setter, configurable: true, enumerable: false });
        }
    } else {
        setupGetter = function(obj, propName, func) {
            obj[GETTER](propName, func);
        }
        setupSetter = function(obj, propName, func) {
            obj[SETTER](propName, func);
        }
        setupGetterSetter = function(obj, propName, getter, setter) {
            obj[GETTER](propName, getter);
            obj[SETTER](propName, setter);
        }
    }

})();
/**
 * Apply properties from metaObject to item.
 * @param {Object} metaObject Source of properties
 * @param {Object} item Target of property apply
 * @param {Object} objectScope Scope in which properties should be evaluated
 * @param {Object} componentScope Component scope in which properties should be evaluated
 */
function applyProperties(metaObject, item, objectScope, componentScope) {
    var i;
    objectScope = objectScope || item;
    for (i in metaObject) {
        var value = metaObject[i];
        // skip global id's and internal values
        if (i == "id" || i[0] == "$") {
            continue;
        }
        // slots
        if (i.indexOf("on") == 0 && i[2].toUpperCase() == i[2]) {
            var signalName =  i[2].toLowerCase() + i.slice(3);
            if (!item[signalName]) {
                console.warn("No signal called " + signalName + " found!");
                continue;
            }
            else if (typeof item[signalName].connect != 'function') {
                console.warn(signalName + " is not a signal!");
                continue;
            }
            if (!value.eval) {
                var params = "";
                for (var j in item[signalName].parameters) {
                    params += j==0 ? "" : ", ";
                    params += item[signalName].parameters[j].name;
                }
                value.src = "(function(" + params + ") {" + value.src + "})";
                value.function = false;
                value.compile();
            }
            item[signalName].connect(item, value.eval(objectScope, componentScope));
            continue;
        }

        if (value instanceof Object) {
            if (value instanceof QMLSignalDefinition) {
                item[i] = Signal(value.parameters);
                if (item.$isComponentRoot)
                    componentScope[i] = item[i];
                continue;
            } else if (value instanceof QMLMethod) {
                value.compile();
                item[i] = value.eval(objectScope, componentScope);
                if (item.$isComponentRoot)
                    componentScope[i] = item[i];
                continue;
            } else if (value instanceof QMLAliasDefinition) {
                createSimpleProperty("alias", item, i);
                item.$properties[i].componentScope = componentScope;
                item.$properties[i].val = value;
                item.$properties[i].get = function() {
                    var obj = this.componentScope[this.val.objectName];
                    return this.val.propertyName ? obj.$properties[this.val.propertyName].get() : obj;
                }
                item.$properties[i].set = function(newVal, fromAnimation, objectScope, componentScope) {
                    if (!this.val.propertyName)
                        throw "Cannot set alias property pointing to an QML object.";
                    this.componentScope[this.val.objectName].$properties[this.val.propertyName].set(newVal, fromAnimation, objectScope, componentScope);
                }
                continue;
            } else if (value instanceof QMLPropertyDefinition) {
                createSimpleProperty(value.type, item, i);
                item.$properties[i].set(value.value, true, objectScope, componentScope);
                continue;
            } else if (item[i] && value instanceof QMLMetaPropertyGroup) {
                // Apply properties one by one, otherwise apply at once
                applyProperties(value, item[i], objectScope, componentScope);
                continue;
            }
        }
        if (item.$properties && i in item.$properties)
            item.$properties[i].set(value, true, objectScope, componentScope);
        else if (i in item)
            item[i] = value;
        else if (item.$setCustomData)
            item.$setCustomData(i, value);
        else
            console.warn("Cannot assign to non-existent property \"" + i + "\". Ignoring assignment.");
    }
    if (metaObject.$children && metaObject.$children.length !== 0) {
        if (item.$defaultProperty)
            item.$properties[item.$defaultProperty].set(metaObject.$children, true, objectScope, componentScope);
        else
            throw "Cannot assign to unexistant default property";
    }
    // We purposefully set the default property AFTER using it, in order to only have it applied for
    // instanciations of this component, but not for its internal children
    if (metaObject.$defaultProperty)
        item.$defaultProperty = metaObject.$defaultProperty;
    if (typeof item.completed != 'undefined' && item.completedAlreadyCalled == false) {
      item.completedAlreadyCalled = true;
      item.completed();
    }
}

// ItemModel. EXPORTED.
JSItemModel = function() {
    this.roleNames = [];

    this.setRoleNames = function(names) {
        this.roleNames = names;
    }

    this.dataChanged = Signal([
        {type:"int", name:"startIndex"},
        {type:"int", name:"endIndex"}
    ]);
    this.rowsInserted = Signal([
        {type:"int", name:"startIndex"},
        {type:"int", name:"endIndex"}
    ]);
    this.rowsMoved = Signal([
        {type:"int", name:"sourceStartIndex"},
        {type:"int", name:"sourceEndIndex"},
        {type:"int", name:"destinationIndex"}
    ]);
    this.rowsRemoved = Signal([
        {type:"int", name:"startIndex"},
        {type:"int", name:"endIndex"}
    ]);
    this.modelReset = Signal();
}

// -----------------------------------------------------------------------------
// Stuff below defines QML things
// -----------------------------------------------------------------------------

// Helper
function unboundMethod() {
    console.log("Unbound method for", this);
}

global.addEventListener('load', function() {
  var metaTags = document.getElementsByTagName('BODY');

  for (var i = 0 ; i < metaTags.length ; ++i) {
    var metaTag = metaTags[i];
    var source  = metaTag.getAttribute('data-qml');

    if (source != null) {
      global.qmlEngine = new QMLEngine();
      qmlEngine.loadFile(source);
      qmlEngine.start();
      break ;
    }
  }
});

// Base object for all qml elements
function QMLBaseObject(meta) {
    QObject.call(this, meta.parent);
    var i,
        prop;

    if (!this.$draw)
        this.$draw = noop;

    if (!this.$isComponentRoot)
        this.$isComponentRoot = meta.isComponentRoot;
    // scope
    this.$context = meta.context;

    // Component.onCompleted
    this.Component = new QObject(this);
    this.Component.completed = Signal([]);
    engine.completedSignals.push(this.Component.completed);
}


// TODO
function QMLColor(val) {
    return val;
}


/*
 * - QMLEngine(element, options) -- Returns new qml engine object, for which:
 *   - loadFile(file) -- Load file to the engine (.qml or .qml.js atm)
 *   - start() -- start the engine/application
 *   - stop() -- stop the engine/application. Restarting is experimental.
 *   element is HTMLCanvasElement and options are for debugging.
 *   For further reference, see testpad and qml viewer applications.
 */

// There can only be one running QMLEngine. This variable points to the currently running engine.
var engine = null;

// QML engine. EXPORTED.
QMLEngine = function (element, options) {
//----------Public Members----------
    this.fps = 60;
    this.$interval = Math.floor(1000 / this.fps); // Math.floor, causes bugs to timing?
    this.running = false;

    // Mouse Handling
    this.mouseAreas = [];
    this.oldMousePos = {x:0, y:0};

    // List of available Components
    this.components = {};

    this.rootElement = element;

    // List of Component.completed signals
    this.completedSignals = [];

    // Current operation state of the engine (Idle, init, etc.)
    this.operationState = 1;

    // List of properties whose values are bindings. For internal use only.
    this.bindedProperties = [];


//----------Public Methods----------
    // Start the engine
    this.start = function()
    {
        engine = this;
        var i;
        if (this.operationState !== QMLOperationState.Running) {
            this.operationState = QMLOperationState.Running;
            tickerId = setInterval(tick, this.$interval);
            for (i = 0; i < whenStart.length; i++) {
                whenStart[i]();
            }
        }
    }

    // Stop the engine
    this.stop = function()
    {
        var i;
        if (this.operationState == QMLOperationState.Running) {
            element.removeEventListener("touchstart", touchHandler);
            element.removeEventListener("mousemove", mousemoveHandler);
            clearInterval(tickerId);
            this.operationState = QMLOperationState.Idle;
            for (i = 0; i < whenStop.length; i++) {
                whenStop[i]();
            }
        }
    }

    this.pathFromFilepath = function(file) {
      var basePath = file.split("/");
      basePath[basePath.length - 1] = "";
      basePath = basePath.join("/");
      return basePath;
    }

    this.ensureFileIsLoadedInQrc = function(file) {
      if (!qrc.includesFile(file)) {
        var src = getUrlContents(file);

        qrc[file] = qmlparse(src);
      }
    }

    // Load file, parse and construct (.qml or .qml.js)
    this.loadFile = function(file) {
        var tree;

        basePath = this.pathFromFilepath(file);
        this.ensureFileIsLoadedInQrc(file);
        tree = convertToEngine(qrc[file]);
        this.loadQMLTree(tree);
    }

    // parse and construct qml
    this.loadQML = function(src) {
        this.loadQMLTree(parseQML(src));
    }

    this.loadQMLTree = function(tree) {
        console.log('loadQMLTree', tree);
        engine = this;
        if (options.debugTree) {
            options.debugTree(tree);
        }

        // Create and initialize objects
        var component = new QMLComponent({ object: tree, parent: null });
        doc = component.createObject(null);
        this.$initializePropertyBindings();

        this.start();

        // Call completed signals
        for (var i in this.completedSignals) {
            this.completedSignals[i]();
        }
    }

    this.rootContext = function() {
      return doc.$context;
    }

    this.registerProperty = function(obj, propName)
    {
        var dependantProperties = [];
        var value = obj[propName];

        function getter() {
            if (evaluatingProperty && dependantProperties.indexOf(evaluatingProperty) == -1)
                dependantProperties.push(evaluatingProperty);

            return value;
        }

        function setter(newVal) {
            value = newVal;

            for (i in dependantProperties)
                dependantProperties[i].update();
        }

        setupGetterSetter(obj, propName, getter, setter);
    }

//Intern

    // Load file, parse and construct as Component (.qml)
    this.loadComponent = function(name)
    {
        if (name in this.components)
            return this.components[name];

        var file = basePath + name + ".qml";

        this.ensureFileIsLoadedInQrc(file);
        tree = convertToEngine(qrc[file]);
        this.components[name] = tree;
        return tree;
    }

    this.$initializePropertyBindings = function() {
        // Initialize property bindings
        for (var i = 0; i < this.bindedProperties.length; i++) {
            var property = this.bindedProperties[i];
            property.binding.compile();
            property.update();
        }
        this.bindedProperties = [];
    }

    this.$getTextMetrics = function(text, fontCss)
    {
        canvas.save();
        canvas.font = fontCss;
        var metrics = canvas.measureText(text);
        canvas.restore();
        return metrics;
    }

    // Return a path to load the file
    this.$resolvePath = function(file)
    {
        if (file == "" || file.indexOf("://") != -1 || file.indexOf("/") == 0) {
            return file;
        }
        return basePath + file;
    }

    this.$registerStart = function(f)
    {
        whenStart.push(f);
    }

    this.$registerStop = function(f)
    {
        whenStop.push(f);
    }

    this.$addTicker = function(t)
    {
        tickers.push(t);
    }

    this.$removeTicker = function(t)
    {
        var index = tickers.indexOf(t);
        if (index != -1) {
            tickers.splice(index, 1);
        }
    }

    this.size = function()
    {
        return { width: doc.getWidth(), height: doc.getHeight() };
    }

    // Performance measurements
    this.$perfDraw = function(canvas)
    {
        doc.$draw(canvas);
    }

//----------Private Methods----------
    // In JS we cannot easily access public members from
    // private members so self acts as a bridge
    var self = this;

    // Listen also to touchstart events on supporting devices
    // Makes clicks more responsive (do not wait for click event anymore)
    function touchHandler(e)
    {
        // preventDefault also disables pinching and scrolling while touching
        // on qml application
        e.preventDefault();
        var at = {
            layerX: e.touches[0].pageX - element.offsetLeft,
            layerY: e.touches[0].pageY - element.offsetTop,
            button: 1
        }
        element.onclick(at);

    }

    function mousemoveHandler(e)
    {
        var i;
        for (i in self.mouseAreas) {
            var l = self.mouseAreas[i];
            if (l && l.hoverEnabled
                  && (self.oldMousePos.x >= l.left
                      && self.oldMousePos.x <= l.right
                      && self.oldMousePos.y >= l.top
                      && self.oldMousePos.y <= l.bottom)
                  && !(e.pageX - element.offsetLeft >= l.left
                       && e.pageX - element.offsetLeft <= l.right
                       && e.pageY - element.offsetTop >= l.top
                       && e.pageY - element.offsetTop <= l.bottom) )
                l.exited();
        }
        for (i in self.mouseAreas) {
            var l = self.mouseAreas[i];
            if (l && l.hoverEnabled
                  && (e.pageX - element.offsetLeft >= l.left
                      && e.pageX - element.offsetLeft <= l.right
                      && e.pageY - element.offsetTop >= l.top
                      && e.pageY - element.offsetTop <= l.bottom)
                  && !(self.oldMousePos.x >= l.left
                       && self.oldMousePos.x <= l.right
                       && self.oldMousePos.y >= l.top
                       && self.oldMousePos.y <= l.bottom))
                l.entered();
        }
        self.oldMousePos = { x: e.pageX - element.offsetLeft,
                            y: e.pageY - element.offsetTop };
    }

    function tick()
    {
        var i,
            now = (new Date).getTime(),
            elapsed = now - lastTick;
        lastTick = now;
        for (i = 0; i < tickers.length; i++) {
            tickers[i](now, elapsed);
        }
    }


//----------Private Members----------
    // Target canvas
    var // Root document of the engine
        doc,
        // Callbacks for stopping or starting the engine
        whenStop = [],
        whenStart = [],
        // Ticker resource id and ticker callbacks
        tickerId,
        tickers = [],
        lastTick = new Date().getTime(),
        // Base path of qml engine (used for resource loading)
        basePath,
        i;


//----------Construct----------

    options = options || {};

    if (options.debugConsole) {
        // Replace QML-side console.log
        console = {};
        console.log = function() {
            var args = Array.prototype.slice.call(arguments);
            options.debugConsole.apply(Undefined, args);
        };
    }
}


function QMLInteger(val) {
    return (val|0);
}

function QMLList(meta) {
    var list = [];
    if (meta.object instanceof Array)
        for (var i in meta.object)
            list.push(construct({object: meta.object[i], parent: meta.parent, context: meta.context }));
    else if (meta.object instanceof QMLMetaElement)
        list.push(construct({object: meta.object, parent: meta.parent, context: meta.context }));

    return list;
}

QMLOperationState = {
    Idle: 1,
    Init: 2,
    Running: 3
};

function QMLPositioner(meta) {
    QMLItem.call(this, meta);

    createSimpleProperty("int", this, "spacing");
    this.spacingChanged.connect(this, this.layoutChildren);
    this.childrenChanged.connect(this, this.layoutChildren);
    this.childrenChanged.connect(this, QMLPositioner.slotChildrenChanged);

    this.spacing = 0;
}

QMLPositioner.slotChildrenChanged = function() {
    for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        if (!child.widthChanged.isConnected(this, this.layoutChildren))
            child.widthChanged.connect(this, this.layoutChildren);
        if (!child.heightChanged.isConnected(this, this.layoutChildren))
            child.heightChanged.connect(this, this.layoutChildren);
        if (!child.visibleChanged.isConnected(this, this.layoutChildren))
            child.visibleChanged.connect(this, this.layoutChildren);
        if (!child.opacityChanged.isConnected(this, this.layoutChildren))
            child.opacityChanged.connect(this, this.layoutChildren);
    }
}


function QMLProperty(type, obj, name) {
    this.obj = obj;
    this.name = name;
    this.changed = Signal([], {obj:obj});
    this.binding = null;
    this.objectScope = null;
    this.componentScope = null;
    this.value = undefined;
    this.type = type;
    this.animation = null;

    // This list contains all signals that hold references to this object.
    // It is needed when deleting, as we need to tidy up all references to this object.
    this.$tidyupList = [];
}

// Updater recalculates the value of a property if one of the
// dependencies changed
QMLProperty.prototype.update = function() {
    if (!this.binding)
        return;

    var oldVal = this.val;
    evaluatingProperty = this;
    this.val = this.binding.eval(this.objectScope, this.componentScope);
    evaluatingProperty = undefined;

    if (this.animation) {
        this.animation.$actions = [{
            target: this.animation.target || this.obj,
            property: this.animation.property || this.name,
            from: this.animation.from || oldVal,
            to: this.animation.to || this.val
        }];
        this.animation.restart();
    }

    if (this.val !== oldVal)
        this.changed(this.val, oldVal, this.name);
}

// Define getter
QMLProperty.prototype.get = function() {
    // If this call to the getter is due to a property that is dependant on this
    // one, we need it to take track of changes
    if (evaluatingProperty && !this.changed.isConnected(evaluatingProperty, QMLProperty.prototype.update))
        this.changed.connect(evaluatingProperty, QMLProperty.prototype.update);

    return this.val;
}

// Define setter
QMLProperty.prototype.set = function(newVal, fromAnimation, objectScope, componentScope) {
    var i,
        oldVal = this.val;

    if (newVal instanceof QMLBinding) {
        if (!objectScope || !componentScope)
            throw "Internal error: binding assigned without scope";
        this.binding = newVal;
        this.objectScope = objectScope;
        this.componentScope = componentScope;

        if (engine.operationState !== QMLOperationState.Init) {
            if (!newVal.eval)
                newVal.compile();

            evaluatingProperty = this;
            newVal = this.binding.eval(objectScope, componentScope);
            evaluatingProperty = null;
        } else {
            engine.bindedProperties.push(this);
            return;
        }
    } else {
        if (!fromAnimation)
            this.binding = null;
        if (newVal instanceof Array)
            newVal = newVal.slice(); // Copies the array
    }

    if (constructors[this.type] == QMLList) {
        this.val = QMLList({ object: newVal, parent: this.obj, context: componentScope });
    } else if (newVal instanceof QMLMetaElement) {
        if (constructors[newVal.$class] == QMLComponent || constructors[this.type] == QMLComponent)
            this.val = new QMLComponent({ object: newVal, parent: this.obj, context: componentScope });
        else
            this.val = construct({ object: newVal, parent: this.obj, context: componentScope });
    } else if (newVal instanceof Object || !newVal) {
        this.val = newVal;
    } else {
        this.val = constructors[this.type](newVal);
    }

    if (this.val !== oldVal) {
        if (this.animation && !fromAnimation) {
            this.animation.running = false;
            this.animation.$actions = [{
                target: this.animation.target || this.obj,
                property: this.animation.property || this.name,
                from: this.animation.from || oldVal,
                to: this.animation.to || this.val
            }];
            this.animation.running = true;
        }
        this.changed(this.val, oldVal, this.name);
    }
}



function QMLVariant(val) {
    return val;
}

// Base object for all qml thingies
function QObject(parent) {
    this.$parent = parent;
    if (parent && parent.$tidyupList)
        parent.$tidyupList.push(this);
    // List of things to tidy up when deleting this object.
    if (!this.$tidyupList)
        this.$tidyupList = [];
    if (!this.$properties)
        this.$properties = {};

    this.$delete = function() {
        while (this.$tidyupList.length > 0) {
            var item = this.$tidyupList[0];
            if (item.$delete) // It's a QObject
                item.$delete();
            else // It must be a signal
                item.disconnect(this);
        }

        for (var i in this.$properties) {
            var prop = this.$properties[i];
            while (prop.$tidyupList.length > 0)
                prop.$tidyupList[0].disconnect(prop);
        }

        if (this.$parent && this.$parent.$tidyupList)
            this.$parent.$tidyupList.splice(this.$parent.$tidyupList.indexOf(this), 1);
    }
}

function updateHGeometry(newVal, oldVal, propName) {
    var anchors = this.anchors || this;
    if (this.$updatingGeometry)
        return;
    this.$updatingGeometry = true;

    var t, w, width, x, left, hC, right,
        lM = anchors.leftMargin || anchors.margins,
        rM = anchors.rightMargin || anchors.margins;

    // Width
    if (this.$isUsingImplicitWidth && propName == "implicitWidth")
        width = this.implicitWidth;
    else if (propName == "width")
        this.$isUsingImplicitWidth = false;

    // Position TODO: Layouts
    if ((t = anchors.fill) !== undefined) {
        if (!t.$properties.left.changed.isConnected(this, updateHGeometry))
            t.$properties.left.changed.connect(this, updateHGeometry);
        if (!t.$properties.width.changed.isConnected(this, updateHGeometry))
            t.$properties.width.changed.connect(this, updateHGeometry);

        this.$isUsingImplicitWidth = false;
        width = t.width - lM - rM;
        x = t.left - (this.parent ? this.parent.left : 0) + lM;
        left = t.left + lM;
        right = t.right - rM;
        hC = (left + right) / 2;
    } else if ((t = anchors.centerIn) !== undefined) {
        if (!t.$properties.horizontalCenter.changed.isConnected(this, updateHGeometry))
            t.$properties.horizontalCenter.changed.connect(this, updateHGeometry);

        w = width || this.width;
        hC = t.horizontalCenter;
        x = hC - w / 2 - (this.parent ? this.parent.left : 0);
        left = hC - w / 2;
        right = hC + w / 2;
    } else if ((t = anchors.left) !== undefined) {
        left = t + lM
        if ((u = anchors.right) !== undefined) {
            right = u - rM;
            this.$isUsingImplicitWidth = false;
            width = right - left;
            x = left - (this.parent ? this.parent.left : 0);
            hC = (right + left) / 2;
        } else if ((hC = anchors.horizontalCenter) !== undefined) {
            this.$isUsingImplicitWidth = false;
            width = (hC - left) * 2;
            x = left - (this.parent ? this.parent.left : 0);
            right = 2 * hC - left;
        } else {
            w = width || this.width;
            x = left - (this.parent ? this.parent.left : 0);
            right = left + w;
            hC = left + w / 2;
        }
    } else if ((t = anchors.right) !== undefined) {
        right = t - rM;
        if ((hC = anchors.horizontalCenter) !== undefined) {
            this.$isUsingImplicitWidth = false;
            width = (right - hC) * 2;
            x = 2 * hC - right - (this.parent ? this.parent.left : 0);
            left = 2 * hC - right;
        } else {
            w = width || this.width;
            x = right - w - (this.parent ? this.parent.left : 0);
            left = right - w;
            hC = right - w / 2;
        }
    } else if ((hC = anchors.horizontalCenter) !== undefined) {
        w = width || this.width;
        x = hC - w / 2 - (this.parent ? this.parent.left : 0);
        left = hC - w / 2;
        right = hC + w / 2;
    } else {
        if (this.parent && !this.parent.$properties.left.changed.isConnected(this, updateHGeometry))
            this.parent.$properties.left.changed.connect(this, updateHGeometry);

        w = width || this.width;
        left = this.x + (this.parent ? this.parent.left : 0);
        right = left + w;
        hC = left + w / 2;
    }

    if (left !== undefined)
        this.left = left;
    if (hC !== undefined)
        this.horizontalCenter = hC;
    if (right !== undefined)
        this.right = right;
    if (x !== undefined)
        this.x = x;
    if (width !== undefined)
        this.width = width;

    this.$updatingGeometry = false;
}

function updateVGeometry(newVal, oldVal, propName) {
    var anchors = this.anchors || this;
    if (this.$updatingGeometry)
        return;
    this.$updatingGeometry = true;

    var t, w, height, y, top, vC, bottom,
        tM = anchors.topMargin || anchors.margins,
        bM = anchors.bottomMargin || anchors.margins;

    // Height
    if (this.$isUsingImplicitHeight && propName == "implicitHeight")
        height = this.implicitHeight;
    else if (propName == "height")
        this.$isUsingImplicitHeight = false;

    // Position TODO: Layouts
    if ((t = anchors.fill) !== undefined) {
        if (!t.$properties.top.changed.isConnected(this, updateVGeometry))
            t.$properties.top.changed.connect(this, updateVGeometry);
        if (!t.$properties.height.changed.isConnected(this, updateVGeometry))
            t.$properties.height.changed.connect(this, updateVGeometry);

        this.$isUsingImplicitHeight = false;
        height = t.height - tM - bM;
        y = t.top - (this.parent ? this.parent.top : 0) + tM;
        top = t.top + tM;
        bottom = t.bottom - bM;
        vC = (top + bottom) / 2;
    } else if ((t = anchors.centerIn) !== undefined) {
        if (!t.$properties.verticalCenter.changed.isConnected(this, updateVGeometry))
            t.$properties.verticalCenter.changed.connect(this, updateVGeometry);

        w = height || this.height;
        vC = t.verticalCenter;
        y = vC - w / 2 - (this.parent ? this.parent.top : 0);
        top = vC - w / 2;
        bottom = vC + w / 2;
    } else if ((t = anchors.top) !== undefined) {
        top = t + tM
        if ((u = anchors.bottom) !== undefined) {
            bottom = u - bM;
            this.$isUsingImplicitHeight = false;
            height = bottom - top;
            y = top - (this.parent ? this.parent.top : 0);
            vC = (bottom + top) / 2;
        } else if ((vC = anchors.verticalCenter) !== undefined) {
            this.$isUsingImplicitHeight = false;
            height = (vC - top) * 2;
            y = top - (this.parent ? this.parent.top : 0);
            bottom = 2 * vC - top;
        } else {
            w = height || this.height;
            y = top - (this.parent ? this.parent.top : 0);
            bottom = top + w;
            vC = top + w / 2;
        }
    } else if ((t = anchors.bottom) !== undefined) {
        bottom = t - bM;
        if ((vC = anchors.verticalCenter) !== undefined) {
            this.$isUsingImplicitHeight = false;
            height = (bottom - vC) * 2;
            y = 2 * vC - bottom - (this.parent ? this.parent.top : 0);
            top = 2 * vC - bottom;
        } else {
            w = height || this.height;
            y = bottom - w - (this.parent ? this.parent.top : 0);
            top = bottom - w;
            vC = bottom - w / 2;
        }
    } else if ((vC = anchors.verticalCenter) !== undefined) {
        w = height || this.height;
        y = vC - w / 2 - (this.parent ? this.parent.top : 0);
        top = vC - w / 2;
        bottom = vC + w / 2;
    } else {
        if (this.parent && !this.parent.$properties.top.changed.isConnected(this, updateVGeometry))
            this.parent.$properties.top.changed.connect(this, updateVGeometry);

        w = height || this.height;
        top = this.y + (this.parent ? this.parent.top : 0);
        bottom = top + w;
        vC = top + w / 2;
    }

    if (top !== undefined)
        this.top = top;
    if (vC !== undefined)
        this.verticalCenter = vC;
    if (bottom !== undefined)
        this.bottom = bottom;
    if (y !== undefined)
        this.y = y;
    if (height !== undefined)
        this.height = height;

    this.$updatingGeometry = false;
}



function QMLButton(meta) {
    this.dom = document.createElement("button");
    QMLItem.call(this, meta);
    var self = this;

    this.dom.style.pointerEvents = "auto";
    this.dom.innerHTML = "<span></span>";

    createSimpleProperty("string", this, "text");
    this.clicked = Signal();

    this.Component.completed.connect(this, function() {
        this.implicitWidth = this.dom.firstChild.offsetWidth + 20;
        this.implicitHeight = this.dom.firstChild.offsetHeight + 5;
    });
    this.textChanged.connect(this, function(newVal) {
        this.dom.firstChild.innerHTML = newVal;
        //TODO: Replace those statically sized borders
        this.implicitWidth = this.dom.firstChild.offsetWidth + 20;
        this.implicitHeight = this.dom.firstChild.offsetHeight + 5;
    });

    this.dom.onclick = function(e) {
        self.clicked();
    }
}

registerQmlType('Button', QMLButton);

QMLComponent.prototype.createObject = function(parent, properties) {
    var oldState = engine.operationState;
    engine.operationState = QMLOperationState.Init;

    var item = construct({
        object: this.$metaObject,
        parent: parent,
        context: Object.create(this.$context),
        isComponentRoot: true
    });

    engine.operationState = oldState;
    return item;
}

function QMLComponent(meta) {
    if (constructors[meta.object.$class] == QMLComponent)
        this.$metaObject = meta.object.$children[0];
    else
        this.$metaObject = meta.object;
    this.$context = meta.context;

    var loadJsImport = (function(importDesc) {
      var src = importDesc.subject;
      var js;

      if (typeof qmlEngine.basePath != 'undefined')
        src = qmlEngine.basePath + src;
      js = getUrlContents(src);
      eval(js);
    });

    var loadQmlImport = (function(importDesc) {
      var src = importDesc.subject;
      var qml;

      if (typeof qmlEngine.basePath != 'undefined')
        src = qmlEngine.basePath + src;
      qml = getUrlContents(src);
      qmlEngine.loadQML(qml);
    });

    if (meta.object.$imports instanceof Array)
    {
      var moduleImports = [];
      var loadImport    = (function(importDesc) {
        if (/\.js$/.test(importDesc.subject))
          loadJsImport(importDesc);
        else if (/\.qml$/.test(importDesc.subject))
          loadQmlImport(importDesc);
        else
          moduleImports.push(importDesc);
      }).bind(this);

      for (var i = 0 ; i < meta.object.$imports.length ; ++i) {
        loadImport(meta.object.$imports[i]);
      }
      loadImports(moduleImports);
    }
}

registerQmlType('Component',   QMLComponent);
registerQmlType('QMLDocument', QMLComponent);

function QMLItem(meta) {
    QMLBaseObject.call(this, meta);
    var child,
        o, i;

    this.completed = Signal();
    this.completedAlreadyCalled = false;

    if (this.$parent === null) { // This is the root element. Initialize it.
        this.dom = engine.rootElement || document.body;
        this.dom.innerHTML = "";
        var self = this;
        if (engine.rootElement == undefined) {
            window.onresize = function() {
                self.implicitHeight = window.innerHeight;
                self.implicitWidth = window.innerWidth;
            }
        } else {
            this.implicitHeight = this.dom.offsetHeight;
            this.implicitWidth = this.dom.offsetWidth;
        }
        this.dom.style.position = "relative"; // Needed to make absolute positioning work
        this.dom.style.top = "0";
        this.dom.style.left = "0";
        this.dom.style.overflow = "hidden"; // No QML stuff should stand out the root element
    } else {
        if (!this.dom) // Create a dom element for this item.
            this.dom = document.createElement("div");
        this.dom.style.position = "absolute";
    }
    this.dom.style.pointerEvents = "none";
    this.dom.className = meta.object.$class + (this.id ? " " + this.id : "");
    this.css = this.dom.style;

    createSimpleProperty("list", this, "data");
    this.$defaultProperty = "data";
    createSimpleProperty("list", this, "children");
    createSimpleProperty("list", this, "resources");
    createSimpleProperty("Item", this, "parent");
    this.children = [];
    this.resources = [];
    this.parentChanged.connect(this, function(newParent, oldParent) {
        if (oldParent) {
            oldParent.children.splice(oldParent.children.indexOf(this), 1);
            oldParent.childrenChanged();
            oldParent.dom.removeChild(this.dom);
        }
        if (newParent && newParent.children.indexOf(this) == -1) {
            newParent.children.push(this);
            newParent.childrenChanged();
        }
        if (newParent)
            newParent.dom.appendChild(this.dom);
    });
    this.parentChanged.connect(this, updateHGeometry);
    this.parentChanged.connect(this, updateVGeometry);
    this.dataChanged.connect(this, function(newData) {
        for (var i in newData) {
            var child = newData[i];
            if (child.hasOwnProperty("parent")) // Seems to be an Item. TODO: Use real inheritance and ask using instanceof.
                child.parent = this; // This will also add it to children.
            else
                this.resources.push(child);
        }
    });

    createSimpleProperty("real", this, "x");
    createSimpleProperty("real", this, "y");
    createSimpleProperty("real", this, "width");
    createSimpleProperty("real", this, "height");
    createSimpleProperty("real", this, "implicitWidth");
    createSimpleProperty("real", this, "implicitHeight");
    createSimpleProperty("real", this, "left");
    createSimpleProperty("real", this, "right");
    createSimpleProperty("real", this, "top");
    createSimpleProperty("real", this, "bottom");
    createSimpleProperty("real", this, "horizontalCenter");
    createSimpleProperty("real", this, "verticalCenter");
    createSimpleProperty("real", this, "rotation");
    createSimpleProperty("real", this, "scale");
    createSimpleProperty("real", this, "z");
    createSimpleProperty("list", this, "transform");
    createSimpleProperty("bool", this, "visible");
    createSimpleProperty("real", this, "opacity");
    createSimpleProperty("bool", this, "clip");
    createSimpleProperty("bool", this, "focus");
    this.xChanged.connect(this, updateHGeometry);
    this.yChanged.connect(this, updateVGeometry);
    this.widthChanged.connect(this, updateHGeometry);
    this.heightChanged.connect(this, updateVGeometry);
    this.implicitWidthChanged.connect(this, updateHGeometry);
    this.implicitHeightChanged.connect(this, updateVGeometry);
    this.focus = false;

    var focusedElement = null;

    this.setupFocusOnDom = (function(element) {
      var updateFocus = (function() {
        var hasFocus = document.activeElement == this.dom.firstChild;

        if (this.focus != hasFocus)
          this.focus = hasFocus;
      }).bind(this);
      element.addEventListener("focus", updateFocus);
      element.addEventListener("blur",  updateFocus);
    }).bind(this);

    this.focusChanged.connect(this, (function(newVal) {
      if (focusedElement != null && document.activeElement == focusedElement) {
        if (newVal)
          this.dom.firstChild.focus();
        else
          document.getElementsByTagName("BODY")[0].focus();
      }
    }).bind(this));

    this.$isUsingImplicitWidth = true;
    this.$isUsingImplicitHeight = true;

    this.anchors = new QObject(this);
    createSimpleProperty("real", this.anchors, "left");
    createSimpleProperty("real", this.anchors, "right");
    createSimpleProperty("real", this.anchors, "top");
    createSimpleProperty("real", this.anchors, "bottom");
    createSimpleProperty("real", this.anchors, "horizontalCenter");
    createSimpleProperty("real", this.anchors, "verticalCenter");
    createSimpleProperty("real", this.anchors, "fill");
    createSimpleProperty("real", this.anchors, "centerIn");
    createSimpleProperty("real", this.anchors, "margins");
    createSimpleProperty("real", this.anchors, "leftMargin");
    createSimpleProperty("real", this.anchors, "rightMargin");
    createSimpleProperty("real", this.anchors, "topMargin");
    createSimpleProperty("real", this.anchors, "bottomMargin");
    this.anchors.leftChanged.connect(this, updateHGeometry);
    this.anchors.rightChanged.connect(this, updateHGeometry);
    this.anchors.topChanged.connect(this, updateVGeometry);
    this.anchors.bottomChanged.connect(this, updateVGeometry);
    this.anchors.horizontalCenterChanged.connect(this, updateHGeometry);
    this.anchors.verticalCenterChanged.connect(this, updateVGeometry);
    this.anchors.fillChanged.connect(this, updateHGeometry);
    this.anchors.fillChanged.connect(this, updateVGeometry);
    this.anchors.centerInChanged.connect(this, updateHGeometry);
    this.anchors.centerInChanged.connect(this, updateVGeometry);
    this.anchors.leftMarginChanged.connect(this, updateHGeometry);
    this.anchors.rightMarginChanged.connect(this, updateHGeometry);
    this.anchors.topMarginChanged.connect(this, updateVGeometry);
    this.anchors.bottomMarginChanged.connect(this, updateVGeometry);
    this.anchors.marginsChanged.connect(this, updateHGeometry);
    this.anchors.marginsChanged.connect(this, updateVGeometry);

    createSimpleProperty("list", this, "states");
    createSimpleProperty("string", this, "state");
    createSimpleProperty("list", this, "transitions");
    this.stateChanged.connect(this, function(newVal, oldVal) {
        var oldState, newState, i, j, k;
        for (i = 0; i < this.states.length; i++)
            if (this.states[i].name === newVal)
                newState = this.states[i];
            else if (this.states[i].name === oldVal)
                oldState = this.states[i];

        var actions = this.$revertActions.slice();

        // Get current values for revert actions
        for (i in actions) {
            var action  = actions[i];
            action.from = action.target[action.property];
        }
        if (newState) {
            var changes = newState.$getAllChanges();

            // Get all actions we need to do and create actions to revert them
            for (i = 0; i < changes.length; i++) {
                var change = changes[i];

                for (j = 0; j < change.$actions.length; j++) {
                    var item = change.$actions[j];

                    var action = {
                        target: change.target,
                        property: item.property,
                        origValue: change.target.$properties[item.property].binding
                                    || change.target.$properties[item.property].val,
                        value: item.value,
                        from: change.target[item.property],
                        to: undefined,
                        explicit: change.explicit
                    };
                    var found = false;
                    for (k in actions)
                        if (actions[k].target == action.target
                            && actions[k].property == action.property) {
                            found = true;
                            actions[k] = action;
                            break;
                        }
                    if (!found)
                        actions.push(action);

                    // Look for existing revert action, else create it
                    var found = false;
                    for (k = 0; k < this.$revertActions.length; k++)
                        if (this.$revertActions[k].target == change.target
                            && this.$revertActions[k].property == item.property) {
                            if (!change.restoreEntryValues)
                                this.$revertActions.splice(k, 1); // We don't want to revert, so remove it
                            found = true;
                            break;
                        }
                    if (!found && change.restoreEntryValues)
                        this.$revertActions.push({
                            target: change.target,
                            property: item.property,
                            value: change.target.$properties[item.property].binding
                                        || change.target.$properties[item.property].val,
                            from: undefined,
                            to: change.target[item.property]
                        });
                }
            }
        }

        // Set all property changes and fetch the actual values afterwards
        // The latter is needed for transitions. We need to set all properties
        // before we fetch the values because properties can be interdependent.
        for (i in actions) {
            var action = actions[i];
            action.target.$properties[action.property].set(action.value, false, action.target,
                                                           newState ? newState.$context: action.target.$context);
        }
        for (i in actions) {
            var action = actions[i];
            action.to = action.target[action.property];
            if (action.explicit) {
                action.target[action.property] = action.target[action.property]; //Remove binding
                action.value = action.target[action.property];
            }
        }

        // Find the best transition to use
        var transition,
            rating = 0;
        for (var i = 0; i < this.transitions.length; i++) {
            this.transitions[i].$stop(); // We need to stop running transitions, so let's do
                                        // it while iterating through the transitions anyway
            var curTransition = this.transitions[i],
                curRating = 0;
            if (curTransition.from == oldVal || curTransition.reversible && curTransition.from == newVal)
                curRating += 2;
            else if (curTransition.from == "*")
                curRating++;
            else
                continue;
            if (curTransition.to == newVal || curTransition.reversible && curTransition.to == oldVal)
                curRating += 2;
            else if (curTransition.to == "*")
                curRating++;
            else
                continue;
            if (curRating > rating) {
                rating = curRating;
                transition = curTransition;
            }
        }
        if (transition)
            transition.$start(actions);
    });

    var QMLRotation  = getConstructor('QtQuick', '2.0', 'Rotation');
    var QMLScale     = getConstructor('QtQuick', '2.0', 'Scale');
    var QMLTranslate = getConstructor('QtQuick', '2.0', 'Translate');

    this.$updateTransform = function() {
            var transform = "rotate(" + this.rotation + "deg) scale(" + this.scale + ")";
            for (var i = 0; i < this.transform.length; i++) {
                var t = this.transform[i];
                if (t instanceof QMLRotation)
                    transform += " rotate3d(" + t.axis.x + ", " + t.axis.y + ", " + t.axis.z + ", " + t.angle + "deg)";
                else if (t instanceof QMLScale)
                    transform += " scale(" + t.xScale + ", " + t.yScale + ")";
                else if (t instanceof QMLTranslate)
                    transform += " translate(" + t.x + "px, " + t.y + "px)";
                else if (typeof t == 'string')
                    transform += t;
            }
            this.dom.style.transform = transform;
            this.dom.style.MozTransform = transform;    // Firefox
            this.dom.style.webkitTransform = transform; // Chrome, Safari and Opera
            this.dom.style.OTransform = transform;      // Opera
            this.dom.style.msTransform = transform;     // IE
    }
    this.rotationChanged.connect(this, this.$updateTransform);
    this.scaleChanged.connect(this, this.$updateTransform);
    this.transformChanged.connect(this, this.$updateTransform);
    this.visibleChanged.connect(this, function(newVal) {
        this.dom.style.visibility = newVal ? "inherit" : "hidden";
    });
    this.opacityChanged.connect(this, function(newVal) {
        this.dom.style.opacity = newVal;
    });
    this.clipChanged.connect(this, function(newVal) {
        this.dom.style.overflow = newVal ? "hidden" : "visible";
    });
    this.zChanged.connect(this, function(newVal) {
        this.dom.style.zIndex = newVal;
    });
    this.xChanged.connect(this, function(newVal) {
        this.dom.style.left = newVal + "px";
    });
    this.yChanged.connect(this, function(newVal) {
        this.dom.style.top = newVal + "px";
    });
    this.widthChanged.connect(this, function(newVal) {
        this.dom.style.width = newVal ? newVal + "px" : "auto";
    });
    this.heightChanged.connect(this, function(newVal) {
        this.dom.style.height = newVal ? newVal + "px" : "auto";
    });

    this.implicitHeight = 0;
    this.implicitWidth = 0;
    this.spacing = 0;
    this.x = 0;
    this.y = 0;
    this.anchors.margins = 0;
    this.visible = true;
    this.opacity = 1;
    this.$revertActions = [];
    this.states = [];
    this.transitions = [];
    this.state = "";
    this.transform = [];
    this.rotation = 0;
    this.scale = 1;

    // Init size of root element
    if (this.$parent === null && engine.rootElement == undefined) {
        window.onresize();
    }

    this.$draw = function(c) {
        var i;
        if (this.visible !== false) { // Undefined means inherit, means true
            if (this.$drawItem ) {
                var rotRad = (this.rotation || 0) / 180 * Math.PI,
                    rotOffsetX = Math.sin(rotRad) * this.width,
                    rotOffsetY = Math.sin(rotRad) * this.height;
                c.save();

                // Handle rotation
                // todo: implement transformOrigin
                c.globalAlpha = this.opacity;
                c.translate(this.left + rotOffsetX, this.top + rotOffsetY);
                c.rotate(rotRad);
                c.translate(-this.left, -this.top);
                // Leave offset for drawing...
                this.$drawItem(c);
                c.translate(-rotOffsetX, -rotOffsetY);
                c.restore();
            }
            for (i = 0; i < this.children.length; i++) {
                if (this.children[i]
                    && this.children[i].$draw) {
                    this.children[i].$draw(c);
                }
            }
        }
    }
}

constructors['Item'] = QMLItem;

function QMLPropertyChanges(meta) {
    QMLBaseObject.call(this, meta);

    createSimpleProperty("QtObject", this, "target");
    createSimpleProperty("bool", this, "explicit");
    createSimpleProperty("bool", this, "restoreEntryValues");

    this.explicit = false;
    this.restoreEntryValues = true;
    this.$actions = [];

    this.$setCustomData = function(propName, value) {
        this.$actions.push({
            property: propName,
            value: value
        });
    }
}

registerQmlType('PropertyChanges', QMLPropertyChanges);

registerQmlType({
  module:   'QtMobility',
  name:     'GeoLocation',
  versions: /.*/,
  constructor: function QMLGeoLocation(meta) {
    var self = this;
    QMLItem.call(this, meta);

    createSimpleProperty("double", this, "accuracy");
    createSimpleProperty("double", this, "altitude");
    createSimpleProperty("double", this, "altitudeAccuracy");
    createSimpleProperty("double", this, "heading");
    createSimpleProperty("string", this, "label");
    createSimpleProperty("double", this, "latitude");
    createSimpleProperty("double", this, "longitude");
    createSimpleProperty("double", this, "speed");
    createSimpleProperty("date",   this, "timestamp");

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition
    }

    var updatePosition = (function(position) {
      this.accuracy         = position.coords.accuracy;
      this.altitude         = position.coords.altitude;
      this.altitudeAccuracy = position.coords.altitudeAccuracy;
      this.heading          = position.coords.heading;
      this.speed            = position.coords.speed;
      this.timestamp        = position.timestamp;
    }).bind(this);

    navigator.geolocation.getCurrentPosition(updatePosition);
    navigator.geolocation.watchPosition(updatePosition);
  }
});

global.MediaPlayer = {
  NoError: 0, ResourceError: 1, FormatError: 2, NetworkError: 4, AccessDenied: 8, ServiceMissing: 16,
  StoppedState: 0, PlayingState: 1, PausedState: 2,
  NoMedia: 0, Loading: 1, Loaded: 2, Buffering: 4, Stalled: 8, EndOfMedia: 16, InvalidMedia: 32, UnknownStatus: 64
};

global.VideoOutput = {
  PreserveAspectFit: 0, PreserveAspectCrop: 1, Stretch: 2
};

registerQmlType({
  module: 'QtMultimedia',
  name:   'Video',
  versions: /^5\./,
  constructor: function QMLVideo(meta) {
    var domVideo;
    var runningEventListener = 0;
    var volumeBackup;

    QMLItem.call(this, meta);

    this.dom.innerHTML = "<video></video>";
    domVideo = this.dom.firstChild;
    this.dom.firstChild.style.width = this.dom.firstChild.style.height = "100%";
    this.dom.firstChild.style.margin = "0";

    createSimpleProperty("bool",   this, "autoPlay");
    createSimpleProperty("enum",   this, "fillMode");
    createSimpleProperty("int",    this, "duration");
    createSimpleProperty("int",    this, "position");
    createSimpleProperty("bool",   this, "muted");
    createSimpleProperty("real",   this, "playbackRate");
    createSimpleProperty("enum",   this, "playbackState");
    createSimpleProperty("string", this, "source");
    createSimpleProperty("real",   this, "volume");
    createSimpleProperty("enum",   this, "status");
    createSimpleProperty("enum",   this, "error");
    this.status = MediaPlayer.NoMedia;
    this.error = MediaPlayer.NoError;
    this.fillMode = VideoOutput.PreserveAspectFit;
    this.volume = domVideo.volume;
    this.duration = domVideo.duration;
    this.playbackState = MediaPlayer.StoppedState;
    this.muted = false;

    this.paused  = Signal();
    this.playing = Signal();
    this.stopped = Signal();

    this.autoPlayChanged.connect(this, (function(newVal) {
      domVideo.autoplay = newVal;
    }).bind(this));

    domVideo.addEventListener("play", (function() {
      this.playing();
      this.playbackState = MediaPlayer.PlayingState;
    }).bind(this));

    domVideo.addEventListener("pause", (function() {
      this.paused();
      this.playbackState = MediaPlayer.PausedState;
    }).bind(this));

    domVideo.addEventListener("timeupdate", (function() {
      runningEventListener++;
      this.position = domVideo.currentTime * 1000;
      runningEventListener--;
    }).bind(this));

    domVideo.addEventListener("ended", (function() {
      this.stopped();
      this.playbackState = MediaPlayer.StoppedState;
    }).bind(this));

    domVideo.addEventListener("progress", (function() {
      if (domVideo.buffered.length > 0) {
        this.progress = domVideo.buffered.end(0) / domVideo.duration;
        this.status   = this.progress < 1 ? MediaPlayer.Buffering : MediaPlayer.Buffered;
      }
    }).bind(this));

    domVideo.addEventListener("stalled", (function() {
      this.status = MediaPlayer.Stalled;
    }).bind(this));

    domVideo.addEventListener("canplaythrough", (function() {
      this.status = MediaPlayer.Buffered;
    }).bind(this));

    domVideo.addEventListener("loadstart", (function() {
      this.status = MediaPlayer.Loading;
    }).bind(this));

    domVideo.addEventListener("durationchanged", (function() {
      this.duration = domVideo.duration;
    }).bind(this));

    domVideo.addEventListener("volumechanged", (function() {
      runningEventListener++;
      this.volume = demoVideo.volume;
      runningEventListener--;
    }).bind(this));

    domVideo.addEventListener("suspend", (function() {
      this.error |= MediaPlayer.NetworkError;
    }).bind(this));

    domVideo.addEventListener("error", (function() {
      this.error |= MediaPlayer.ResourceError;
    }).bind(this));

    domVideo.addEventListener("ratechange", (function() {
      runningEventListener++;
      this.playbackRate = domVideo.playbackRate;
      runningEventListener--;
    }).bind(this));

    this.pause = (function() {
      domVideo.pause();
    }).bind(this);

    this.play = (function() {
      domVideo.play();
    }).bind(this);

    this.seek = (function(offset) {
      domVideo.currentTime = offset * 1000;
    }).bind(this);

    this.stop = (function() {
    }).bind(this);

    this.mimetypeFromExtension = function(extension) {
      var mimetypes = {
        ogg: 'video/ogg',
        ogv: 'video/ogg',
        ogm: 'video/ogg',
        mp4: 'video/mp4',
        webm: 'video/webm'
      };

      if (typeof mimetypes[extension] == 'undefined')
        return "";
      return mimetypes[extension];
    };

    this.addSource = (function(src) {
      var domSource = document.createElement("SOURCE");
      var parts = src.split('.');
      var extension = parts[parts.length - 1];

      domSource.src  = src;
      domSource.type = this.mimetypeFromExtension(extension.toLowerCase());
      this.dom.firstChild.appendChild(domSource);
      if (domVideo.canPlayType(domSource.type) == "")
        this.error |= MediaPlayer.FormatError;
    }).bind(this);

    this.removeSource = (function() {
      while (domVideo.childNodes.length)
        domVideo.removeChild(video.childNodes.item(0));
    }).bind(this);

    this.sourceChanged.connect(this, (function(source) {
      this.removeSource();
      this.addSource(source);
    }).bind(this));

    this.positionChanged.connect(this, (function(currentTime) {
      if (runningEventListener == 0)
        domVideo.currentTime = currentTime / 1000;
    }).bind(this));

    this.volumeChanged.connect(this, (function(volume) {
      if (runningEventListener == 0)
        domVideo.volume = volume;
    }).bind(this));

    this.playbackRateChanged.connect(this, (function(playbackRate) {
      if (runningEventListener == 0)
        domVideo.playbackRate = playbackRate;
    }).bind(this));

    this.mutedChanged.connect(this, (function(newValue) {
      if (newValue == true) {
        volulmeBackup = domVideo.volume;
        this.volume = 0;
      } else {
        this.volume = volumeBackup;
      }
    }).bind(this));

    this.fillModeChanged.connect(this, (function(newValue) {
      switch (newValue) {
        case VideoOutput.Stretch:
          domVideo.style.objectFit = 'fill';
          break ;
        case VideoOutput.PreserveAspectFit:
          domVideo.style.objectFit = '';
          break ;
        case VideoOutput.PreserveAspectCrop:
          domVideo.style.objectFit = 'cover';
          break ;
      }
    }).bind(this));
  }
});

registerQmlType({
  module:   'QtQuick',
  name:     'AnimatedImage',
  versions: /.*/,
  constructors: function QMLAnimatedImage(meta) {
    QMLImage.call(this, meta);
  }
});

registerQmlType({
  module:   'QtQuick',
  name:     'Animation',
  versions: /.*/,
  constructor: function QMLAnimation(meta) {
    QMLBaseObject.call(this, meta);

    // Exports
    this.Animation = {
        Infinite: -1
    };

    createSimpleProperty("bool", this, "alwaysRunToEnd");
    createSimpleProperty("int", this, "loops");
    createSimpleProperty("bool", this, "paused");
    createSimpleProperty("bool", this, "running");

    this.alwaysRunToEnd = false;
    this.loops = 1;
    this.paused = false;
    this.running = false;

    // Methods
    this.restart = function() {
        this.stop();
        this.start();
    };
    this.start = function() {
        this.running = true;
    }
    this.stop = function() {
        this.running = false;
    }
    this.pause = function() {
        this.paused = true;
    }
    this.resume = function() {
        this.paused = false;
    }

    // To be overridden
    this.complete = unboundMethod;
  }
});


registerQmlType({
  module: 'QtQuick',
  name:   'Behavior',
  versions: /.*/,
  constructor: function QMLBehavior(meta) {
    QMLBaseObject.call(this, meta);

    createSimpleProperty("Animation", this, "animation");
    this.$defaultProperty = "animation";
    createSimpleProperty("bool", this, "enabled");

    this.animationChanged.connect(this, function(newVal) {
        newVal.target = this.$parent;
        newVal.property = meta.object.$on;
        this.$parent.$properties[meta.object.$on].animation = newVal;
    });
    this.enabledChanged.connect(this, function(newVal) {
        this.$parent.$properties[meta.object.$on].animation = newVal ? this.animation : null;
    });
  }
});

registerQmlType({
  module:   'QtQuick',
  name:     'BorderImage',
  versions: /.*/,
  constructor: function QMLBorderImage(meta) {
    QMLItem.call(this, meta);
    var self = this;

    this.BorderImage = {
        // tileMode
        Stretch: "stretch",
        Repeat: "repeat",
        Round: "round",
        // status
        Null: 1,
        Ready: 2,
        Loading: 3,
        Error: 4
    }

    createSimpleProperty("url", this, "source");
    createSimpleProperty("enum", this, "status");
    this.border = new QObject(this);
    createSimpleProperty("int", this.border, "left");
    createSimpleProperty("int", this.border, "right");
    createSimpleProperty("int", this.border, "top");
    createSimpleProperty("int", this.border, "bottom");
    createSimpleProperty("enum", this, "horizontalTileMode");
    createSimpleProperty("enum", this, "verticalTileMode");

    this.source = "";
    this.status = this.BorderImage.Null;
    this.border.left = 0;
    this.border.right = 0;
    this.border.top = 0;
    this.border.bottom = 0;
    this.horizontalTileMode = this.BorderImage.Stretch;
    this.verticalTileMode = this.BorderImage.Stretch;

    this.sourceChanged.connect(this, function() {
        this.dom.style.borderImageSource = "url(" + engine.$resolvePath(this.source) + ")";
    });
    this.border.leftChanged.connect(this, updateBorder);
    this.border.rightChanged.connect(this, updateBorder);
    this.border.topChanged.connect(this, updateBorder);
    this.border.bottomChanged.connect(this, updateBorder);
    this.horizontalTileModeChanged.connect(this, updateBorder);
    this.verticalTileModeChanged.connect(this, updateBorder);

    function updateBorder() {
        this.dom.style.MozBorderImageSource = "url(" + engine.$resolvePath(this.source) + ")";
        this.dom.style.MozBorderImageSlice = this.border.top + " "
                                                + this.border.right + " "
                                                + this.border.bottom + " "
                                                + this.border.left;
        this.dom.style.MozBorderImageRepeat = this.horizontalTileMode + " "
                                                    + this.verticalTileMode;
        this.dom.style.MozBorderImageWidth = this.border.top + " "
                                                + this.border.right + " "
                                                + this.border.bottom + " "
                                                + this.border.left;

        this.dom.style.webkitBorderImageSource = "url(" + engine.$resolvePath(this.source) + ")";
        this.dom.style.webkitBorderImageSlice = this.border.top + " "
                                                + this.border.right + " "
                                                + this.border.bottom + " "
                                                + this.border.left;
        this.dom.style.webkitBorderImageRepeat = this.horizontalTileMode + " "
                                                    + this.verticalTileMode;
        this.dom.style.webkitBorderImageWidth = this.border.top + " "
                                                + this.border.right + " "
                                                + this.border.bottom + " "
                                                + this.border.left;

        this.dom.style.OBorderImageSource = "url(" + engine.$resolvePath(this.source) + ")";
        this.dom.style.OBorderImageSlice = this.border.top + " "
                                                + this.border.right + " "
                                                + this.border.bottom + " "
                                                + this.border.left;
        this.dom.style.OBorderImageRepeat = this.horizontalTileMode + " "
                                                    + this.verticalTileMode;
        this.dom.style.OBorderImageWidth = this.border.top + "px "
                                                + this.border.right + "px "
                                                + this.border.bottom + "px "
                                                + this.border.left + "px";

        this.dom.style.borderImageSlice = this.border.top + " "
                                                + this.border.right + " "
                                                + this.border.bottom + " "
                                                + this.border.left;
        this.dom.style.borderImageRepeat = this.horizontalTileMode + " "
                                                    + this.verticalTileMode;
        this.dom.style.borderImageWidth = this.border.top + "px "
                                                + this.border.right + "px "
                                                + this.border.bottom + "px "
                                                + this.border.left + "px";
    }
  }
});

function QMLColumn(meta) {
    QMLPositioner.call(this, meta);
}

QMLColumn.prototype.layoutChildren = function() {
    var curPos = 0,
        maxWidth = 0;
    for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        if (!(child.visible && child.opacity && child.width && child.height))
            continue;
        maxWidth = child.width > maxWidth ? child.width : maxWidth;

        child.y = curPos;
        curPos += child.height + this.spacing;
    }
    this.implicitWidth = maxWidth;
    this.implicitHeight = curPos - this.spacing; // We want no spacing at the bottom side
}

registerQmlType({
  module: 'QtQuick',
  name:   'Column',
  versions: /.*/,
  constructor: QMLColumn
});

function QMLFlow(meta) {
    QMLPositioner.call(this, meta);

    this.Flow = {
        LeftToRight: 0,
        TopToBottom: 1
    }

    createSimpleProperty("enum", this, "flow");
    createSimpleProperty("enum", this, "layoutDirection");
    this.flowChanged.connect(this, this.layoutChildren);
    this.layoutDirectionChanged.connect(this, this.layoutChildren);
    this.widthChanged.connect(this, this.layoutChildren);

    this.flow = 0;
    this.layoutDirection = 0;
}

QMLFlow.prototype.layoutChildren = function() {
    var curHPos = 0,
        curVPos = 0,
        rowSize = 0;
    for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        if (!(child.visible && child.opacity && child.width && child.height))
            continue;

        if (this.flow == 0) {
            if (curHPos + child.width > this.width) {
                curHPos = 0;
                curVPos += rowSize + this.spacing;
                rowSize = 0;
            }
            rowSize = child.height > rowSize ? child.height : rowSize;

            child.x = this.layoutDirection == 1
                    ? this.width - curHPos - child.width : curHPos;
            child.y = curVPos;
            curHPos += child.width + this.spacing;
        } else {
            if (curVPos + child.height > this.height) {
                curVPos = 0;
                curHPos += rowSize + this.spacing;
                rowSize = 0;
            }
            rowSize = child.width > rowSize ? child.width : rowSize;

            child.x = this.layoutDirection == 1
                    ? this.width - curHPos - child.width : curHPos;
            child.y = curVPos;
            curVPos += child.height + this.spacing;
        }
    }
    if (this.flow == 0)
        this.implicitHeight = curVPos + rowSize;
    else
        this.implicitWidth = curHPos + rowSize;
}

registerQmlType({
  module:      'QtQuick',
  name:        'Flow',
  versions:    /.*/,
  constructor: QMLFlow
});

registerQmlType({
  module: 'QtQuick',
  name:   'Font',
  versions: /.*/,
  constructor: function QMLFont(parent) {
    QObject.call(this);
    createSimpleProperty("bool", this, "bold");
    createSimpleProperty("enum", this, "capitalization");
    createSimpleProperty("string", this, "family");
    createSimpleProperty("bool", this, "italic");
    createSimpleProperty("real", this, "letterSpacing");
    createSimpleProperty("int", this, "pixelSize");
    createSimpleProperty("real", this, "pointSize");
    createSimpleProperty("bool", this, "strikeout");
    createSimpleProperty("bool", this, "underline");
    createSimpleProperty("enum", this, "weight");
    createSimpleProperty("real", this, "wordSpacing");

        this.pointSizeChanged.connect(function(newVal) {
            parent.dom.firstChild.style.fontSize = newVal + "pt";
        });
        this.boldChanged.connect(function(newVal) {
            parent.dom.firstChild.style.fontWeight =
                parent.font.weight !== Undefined ? parent.font.weight :
                newVal ? "bold" : "normal";
        });
        this.capitalizationChanged.connect(function(newVal) {
            parent.dom.firstChild.style.fontVariant =
                newVal == "smallcaps" ? "small-caps" : "normal";
            newVal = newVal == "smallcaps" ? "none" : newVal;
            parent.dom.firstChild.style.textTransform = newVal;
        });
        this.familyChanged.connect(function(newVal) {
            parent.dom.firstChild.style.fontFamily = newVal;
        });
        this.italicChanged.connect(function(newVal) {
            parent.dom.firstChild.style.fontStyle = newVal ? "italic" : "normal";
        });
        this.letterSpacingChanged.connect(function(newVal) {
            parent.dom.firstChild.style.letterSpacing = newVal !== Undefined ? newVal + "px" : "";
        });
        this.pixelSizeChanged.connect(function(newVal) {
            var val = newVal !== Undefined ? newVal + "px "
                : (parent.font.pointSize || 10) + "pt";
            parent.dom.style.fontSize = val;
            parent.dom.firstChild.style.fontSize = val;
        });
        this.pointSizeChanged.connect(function(newVal) {
            var val = parent.font.pixelSize !== Undefined ? parent.font.pixelSize + "px "
                : (newVal || 10) + "pt";
            parent.dom.style.fontSize = val;
            parent.dom.firstChild.style.fontSize = val;
        });
        this.strikeoutChanged.connect(function(newVal) {
            parent.dom.firstChild.style.textDecoration = newVal
                ? "line-through"
                : parent.font.underline
                ? "underline"
                : "none";
        });
        this.underlineChanged.connect(function(newVal) {
            parent.dom.firstChild.style.textDecoration = parent.font.strikeout
                ? "line-through"
                : newVal
                ? "underline"
                : "none";
        });
        this.weightChanged.connect(function(newVal) {
            parent.dom.firstChild.style.fontWeight =
                newVal !== Undefined ? newVal :
                parent.font.bold ? "bold" : "normal";
        });
        this.wordSpacingChanged.connect(function(newVal) {
            parent.dom.firstChild.style.wordSpacing = newVal !== Undefined ? newVal + "px" : "";
        });
  }
});


registerQmlType({
  module:   'QtQuick',
  name:     'FontLoader',
  versions: /.*/,
  constructor: function QMLFontLoader(meta) {
    QMLBaseObject.call(this, meta);

    // Exports.
    this.FontLoader = {
        // status
        Null: 0,
        Ready: 1,
        Loading: 2,
        Error: 3
    }

    createSimpleProperty("string", this, "name");
    createSimpleProperty("url", this, "source");
    createSimpleProperty("enum", this, "status");

    this.status = this.FontLoader.Null;

    var self = this,
        domStyle = document.createElement('style'),
        lastName = '',
        inTouchName = false;

    // Maximum timeout is the maximum time for a font to load. If font isn't loaded in this time, the status is set to Error.
    // For both cases (with and without FontLoader.js) if the font takes more than the maximum timeout to load,
    // dimensions recalculations for elements that are using this font will not be triggered or will have no effect.

    // FontLoader.js uses only the last timeout. The state and name properties are set immediately when the font loads.
    // If the font could not be loaded, the Error status will be set only when this timeout expires.
    // If the font loading takes more than the timeout, the name property is set, but the status is set to Error.

    // Fallback sets the font name immediately and touches it several times to trigger dimensions recalcuations.
    // The status is set to Error and should not be used.
    var timeouts = [20, 50, 100, 300, 500, 1000, 3000, 5000, 10000, 15000]; // 15 seconds maximum

    function cycleTouchName(fontName, i) {
        if (lastName !== fontName)
            return;
        if (i > 0) {
            var name = self.name;
            inTouchName = true;
            // Calling self.nameChanged() is not enough, we have to actually change the value to flush the bindings.
            self.name = 'sans-serif';
            self.name = name;
            inTouchName = false;
        }
        if (i < timeouts.length) {
            setTimeout(function() {
                cycleTouchName(fontName, i + 1);
            }, timeouts[i] - (i > 0 ? timeouts[i - 1] : 0));
        }
    }

    function loadFont(fontName) {
        if ((lastName === fontName) || inTouchName)
           return;
        lastName = fontName;

        if (!fontName) {
            self.status = self.FontLoader.Null;
            return;
        }
        self.status = self.FontLoader.Loading;
        if (typeof FontLoader !== 'undefined') {
            var fontLoader = new FontLoader([fontName], {
                "fontsLoaded": function(error) {
                    if (error !== null) {
                        if ((lastName === fontName) && (error.notLoadedFontFamilies[0] === fontName)) {
                            self.name = fontName; // Set the name for the case of font loading after the timeout.
                            self.status = self.FontLoader.Error;
                        }
                    }
                },
                "fontLoaded": function(fontFamily) {
                    if ((lastName === fontName) && (fontFamily == fontName)) {
                        self.name = fontName;
                        self.status = self.FontLoader.Ready;
                    }
                }
            }, timeouts[timeouts.length - 1]);
            FontLoader.testDiv = null; // Else I get problems loading multiple fonts (FontLoader.js bug?)
            fontLoader.loadFonts();
        } else {
            console.warn('FontLoader.js library is not loaded.\nYou should load https://github.com/smnh/FontLoader if you want to use QtQuick FontLoader elements.')
            self.status = self.FontLoader.Error; // You should not rely on 'status' property without FontLoader.js.
            self.name = fontName;
            cycleTouchName(fontName, 0)
        }
    }

    this.sourceChanged.connect(this, function(font_src) {
        var fontName = 'font_' + ((new Date()).getTime()).toString(36) + '_' + (Math.round(Math.random() * 1e15)).toString(36);
        domStyle.innerHTML = '@font-face { font-family: \'' + fontName + '\'; src: url(\'' + engine.$resolvePath(font_src) + '\'); }';
        document.getElementsByTagName('head')[0].appendChild(domStyle);
        loadFont(fontName);
    });

    this.nameChanged.connect(this, loadFont);
  }
});

registerQmlType({
  module: 'QtQuick',
  name: 'Grid',
  versions: /.*/,
  constructor: QMLGrid
});

function QMLGrid(meta) {
    QMLPositioner.call(this, meta);

    this.Grid = {
        LeftToRight: 0,
        TopToBottom: 1
    }

    createSimpleProperty("int", this, "columns");
    createSimpleProperty("int", this, "rows");
    createSimpleProperty("enum", this, "flow");
    createSimpleProperty("enum", this, "layoutDirection");
    this.columnsChanged.connect(this, this.layoutChildren);
    this.rowsChanged.connect(this, this.layoutChildren);
    this.flowChanged.connect(this, this.layoutChildren);
    this.layoutDirectionChanged.connect(this, this.layoutChildren);

    this.flow = 0;
    this.layoutDirection = 0;
}

QMLGrid.prototype.layoutChildren = function() {
    var visibleItems = [],
        r = 0, c = 0,
        colWidth = [],
        rowHeight = [],
        gridWidth = -this.spacing,
        gridHeight = -this.spacing,
        curHPos = 0,
        curVPos = 0;

    // How many items are actually visible?
    for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        if (child.visible && child.opacity && child.width && child.height)
            visibleItems.push(this.children[i]);
    }

    // How many rows and columns do we need?
    if (!this.columns && !this.rows) {
        c = 4;
        r = Math.ceil(visibleItems.length / 4);
    } else if (!this.columns) {
        r = this.rows;
        c = Math.ceil(visibleItems.length / r);
    } else {
        c = this.columns;
        r = Math.ceil(visibleItems.length / c);
    }

    // How big are the colums/rows?
    if (this.flow == 0)
        for (var i = 0; i < r; i++) {
            for (var j = 0; j < c; j++) {
                var item = visibleItems[i*c+j];
                if (!item)
                    break;
                if (!colWidth[j] || item.width > colWidth[j])
                    colWidth[j] = item.width;
                if (!rowHeight[i] || item.height > rowHeight[i])
                    rowHeight[i] = item.height;
            }
        }
    else
        for (var i = 0; i < c; i++) {
            for (var j = 0; j < r; j++) {
                var item = visibleItems[i*r+j];
                if (!item)
                    break;
                if (!rowHeight[j] || item.height > rowHeight[j])
                    rowHeight[j] = item.height;
                if (!colWidth[i] || item.width > colWidth[i])
                    colWidth[i] = item.width;
            }
        }

    for (var i in colWidth)
        gridWidth += colWidth[i] + this.spacing;
    for (var i in rowHeight)
        gridHeight += rowHeight[i] + this.spacing;

    // Do actual positioning
    // When layoutDirection is RightToLeft we need oposite order of coumns
    var step = this.layoutDirection == 1 ? -1 : 1,
        startingPoint = this.layoutDirection == 1 ? c - 1 : 0,
        endPoint = this.layoutDirection == 1 ? -1 : c;
    if (this.flow == 0)
        for (var i = 0; i < r; i++) {
            for (var j = startingPoint; j !== endPoint; j += step) {
                var item = visibleItems[i*c+j];
                if (!item)
                    break;
                item.x = curHPos;
                item.y = curVPos;

                curHPos += colWidth[j] + this.spacing;
            }
            curVPos += rowHeight[i] + this.spacing;
            curHPos = 0;
        }
    else
        for (var i = startingPoint; i !== endPoint; i += step) {
            for (var j = 0; j < r; j++) {
                var item = visibleItems[i*r+j];
                if (!item)
                    break;
                item.x = curHPos;
                item.y = curVPos;

                curVPos += rowHeight[j] + this.spacing;
            }
            curHPos += colWidth[i] + this.spacing;
            curVPos = 0;
        }

    this.implicitWidth = gridWidth;
    this.implicitHeight = gridHeight;
}

registerQmlType({
  module: 'QtQuick',
  name:   'Image',
  versions: /.*/,
  constructor: function QMLImage(meta) {
    QMLItem.call(this, meta);
    var img = new Image(),
        self = this;

    // Exports.
    this.Image = {
        // fillMode
        Stretch: 1,
        PreserveAspectFit: 2,
        PreserveAspectCrop: 3,
        Tile: 4,
        TileVertically: 5,
        TileHorizontally: 6,
        // status
        Null: 1,
        Ready: 2,
        Loading: 3,
        Error: 4
    }

    // no-op properties
    createSimpleProperty("bool", this, "asynchronous");
    createSimpleProperty("bool", this, "cache");
    createSimpleProperty("bool", this, "smooth");

    createSimpleProperty("enum", this, "fillMode");
    createSimpleProperty("bool", this, "mirror");
    createSimpleProperty("real", this, "progress");
    createSimpleProperty("url", this, "source");
    createSimpleProperty("enum", this, "status");

    this.sourceSize = new QObject(this);

    createSimpleProperty("int", this.sourceSize, "width");
    createSimpleProperty("int", this.sourceSize, "height");

    this.asynchronous = true;
    this.cache = true;
    this.smooth = true;
    this.fillMode = this.Image.Stretch;
    this.mirror = false;
    this.progress = 0;
    this.source = "";
    this.status = this.Image.Null;
    this.sourceSize.width = 0;
    this.sourceSize.height = 0;

    // Bind status to img element
    img.onload = function() {
        self.progress = 1;
        self.status = self.Image.Ready;

        var w = img.naturalWidth;
        var h = img.naturalHeight;
        self.sourceSize.width = w;
        self.sourceSize.height = h;
        self.implicitWidth = w;
        self.implicitHeight = h;
    }
    img.onerror = function() {
        self.status = self.Image.Error;
    }

    var updateFillMode = function(val) {
      if (typeof val == 'undefined')
        val = this.fillMode;
      switch (val) {
        default:
        case this.Image.Stretch:
          this.dom.style.backgroundRepeat   = 'auto';
          this.dom.style.backgroundSize     = '100% 100%';
          this.dom.style.backgroundPosition = 'auto';
          break ;
        case this.Image.Tile:
          this.dom.style.backgroundRepeat   = 'auto';
          this.dom.style.backgroundSize     = 'auto';
          this.dom.style.backgroundPosition = 'auto';
          break ;
        case this.Image.PreserveAspectFit:
          this.dom.style.backgroundRepeat   = 'no-repeat';
          this.dom.style.backgroundSize     = 'contain';
          this.dom.style.backgroundPosition = 'center';
          break ;
        case this.Image.PreserveAspectCrop:
          this.dom.style.backgroundRepeat   = 'no-repeat';
          this.dom.style.backgroundSize     = 'cover';
          this.dom.style.backgroundPosition = 'center';
          break ;
        case this.Image.TileVertically:
          this.dom.style.backgroundRepeat   = 'repeat-y';
          this.dom.style.backgroundSize     = '100% auto';
          this.dom.style.backgroundPosition = 'auto';
          break ;
        case this.Image.TileHorizontally:
          this.dom.style.backgroundRepeat   = 'repeat-x';
          this.dom.style.backgroundSize     = 'auto 100%';
          this.dom.style.backgroundPosition = 'auto';
          break ;
      }
    }
    updateFillMode = updateFillMode.bind(this);

    var updateMirroring = (function(val) {
      var transformRule = 'scale(-1,1)';
      if (!val)
      {
        var index = this.transform.indexOf(transformRule);

        if (index >= 0)
          this.transform.splice(index, 1);
      }
      else
        this.transform.push(transformRule);
      this.$updateTransform();
    }).bind(this);

    this.sourceChanged.connect(this, function(val) {
        this.progress = 0;
        this.status = this.Image.Loading;
        this.dom.style.backgroundImage="url('" + engine.$resolvePath(val) + "')";
        img.src = engine.$resolvePath(val);
        updateFillMode();
    });

    this.mirrorChanged.connect  (this, updateMirroring);
    this.fillModeChanged.connect(this, updateFillMode);
    this.$drawItem = function(c) {
        //descr("draw image", this, ["left", "top", "width", "height", "source"]);

        updateFillMode();

        if (this.status == this.Image.Ready) {
            c.save();
            c.drawImage(img, this.left, this.top, this.width, this.height);
            c.restore();
        } else {
            console.log("Waiting for image to load");
        }
    }
  }
});

registerQmlType({
  module: 'QtQuick',
  name:   'ListElement',
  versions: /.*/,
  constructor: function QMLListElement(meta) {
    QMLBaseObject.call(this, meta);

    for (var i in meta.object) {
        if (i[0] != "$") {
            createSimpleProperty("variant", this, i);
        }
    }
    applyProperties(meta.object, this, this, this.$context);
  }
});

registerQmlType({
  module: 'QtQuick',
  name:   'ListModel',
  versions: /.*/,
  constructor: function QMLListModel(meta) {
    QMLBaseObject.call(this, meta);
    var self = this,
    firstItem = true;

    createSimpleProperty("int", this, "count");
    createSimpleProperty("list", this, "$items");
    this.$defaultProperty = "$items";
    this.$items = [];
    this.$model = new JSItemModel();
    this.count = 0;

    this.$itemsChanged.connect(this, function(newVal) {
        if (firstItem) {
            firstItem = false;
            var roleNames = [];
            var dict = newVal[0];
            for (var i in (dict instanceof QMLListElement) ? dict.$properties : dict) {
                if (i != "index")
                    roleNames.push(i);
            }
            this.$model.setRoleNames(roleNames);
        }
        this.count = this.$items.length;
    });

    this.$model.data = function(index, role) {
        return self.$items[index][role];
    }
    this.$model.rowCount = function() {
        return self.$items.length;
    }

    this.append = function(dict) {
        this.insert(this.$items.length, dict);
    }
    this.clear = function() {
        this.$items = [];
        this.$model.modelReset();
        this.count = 0;
    }
    this.get = function(index) {
        return this.$items[index];
    }
    this.insert = function(index, dict) {
        this.$items.splice(index, 0, dict);
        this.$itemsChanged(this.$items);
        this.$model.rowsInserted(index, index+1);
    }
    this.move = function(from, to, n) {
        var vals = this.$items.splice(from, n);
        for (var i = 0; i < vals.length; i++) {
            this.$items.splice(to + i, 0, vals[i]);
        }
        this.$model.rowsMoved(from, from+n, to);
    }
    this.remove = function(index) {
        this.$items.splice(index, 1);
        this.$model.rowsRemoved(index, index+1);
        this.count = this.$items.length;
    }
    this.set = function(index, dict) {
        this.$items[index] = dict;
    }
    this.setProperty = function(index, property, value) {
        this.$items[index][property] = value;
    }
  }
});

registerQmlType({
  module: 'QtQuick',
  name:   'MouseArea',
  versions: /.*/,
  constructor: function QMLMouseArea(meta) {
    QMLItem.call(this, meta);
    var self = this;

    this.dom.style.pointerEvents = "all";

    // IE does not handle mouse clicks to transparent divs, so we have
    // to set a background color and make it invisible using opacity
    // as that doesn't affect the mouse handling.
    this.dom.style.backgroundColor = "white";
    this.dom.style.opacity = 0;

    createSimpleProperty("variant", this, "acceptedButtons");
    createSimpleProperty("bool", this, "enabled");
    createSimpleProperty("bool", this, "hoverEnabled");
    createSimpleProperty("real", this, "mouseX");
    createSimpleProperty("real", this, "mouseY");
    createSimpleProperty("bool", this, "pressed");
    createSimpleProperty("bool", this, "containsMouse");
    this.clicked = Signal([{type: "variant", name: "mouse"}]);
    this.entered = Signal();
    this.exited = Signal();
    this.positionChanged = Signal([{type: "variant", name: "mouse"}]);

    this.acceptedButtons = Qt.LeftButton;
    this.enabled = true;
    this.hoverEnabled = false;
    this.containsMouse = false;

    function eventToMouse(e) {
        return {
            accepted: true,
            button: e.button == 0 ? Qt.LeftButton :
                    e.button == 1 ? Qt.MiddleButton :
                    e.button == 2 ? Qt.RightButton :
                    0,
            modifiers: (e.ctrlKey * Qt.CtrlModifier)
                    | (e.altKey * Qt.AltModifier)
                    | (e.shiftKey * Qt.ShiftModifier)
                    | (e.metaKey * Qt.MetaModifier),
            x: (e.offsetX || e.layerX),
            y: (e.offsetY || e.layerY)
        };
    }
    function handleClick(e) {
        var mouse = eventToMouse(e);

        if (self.enabled && self.acceptedButtons & mouse.button) {
            self.clicked(mouse);
        }
        // This decides whether to show the browser's context menu on right click or not
        return !(self.acceptedButtons & Qt.RightButton);
    }
    this.dom.onclick = handleClick;
    this.dom.oncontextmenu = handleClick;
    this.dom.onmousedown = function(e) {
        if (self.enabled) {
            var mouse = eventToMouse(e);
            self.mouseX = mouse.x;
            self.mouseY = mouse.y;
            self.pressed = true;
        }
    }
    this.dom.onmouseup = function(e) {
        self.pressed = false;
    }
    this.dom.onmouseover = function(e) {
        if (self.hoverEnabled) {
            self.containsMouse = true;
            self.entered();
        }
    }
    this.dom.onmouseout = function(e) {
        if (self.hoverEnabled) {
            self.containsMouse = false;
            self.exited();
        }
    }
    this.dom.onmousemove = function(e) {
        if (self.enabled && (self.hoverEnabled || self.pressed)) {
            var mouse = eventToMouse(e);
            self.positionChanged(mouse);
            self.mouseX = mouse.x;
            self.mouseY = mouse.y;
        }
    }
  }
});

registerQmlType({
  module: 'QtQuick',
  name:   'NumberAnimation',
  versions: /.*/,
  constructor: function QMLNumberAnimation(meta) {
    QMLPropertyAnimation.call(this, meta);
    var at = 0,
        loop = 0,
        self = this;

    engine.$addTicker(ticker);

    function ticker(now, elapsed) {
        if ((self.running || loop === -1) && !self.paused) { // loop === -1 is a marker to just finish this run
            if (at == 0 && loop == 0 && !self.$actions.length)
                self.$redoActions();
            at += elapsed / self.duration;
            if (at >= 1)
                self.complete();
            else
                for (var i in self.$actions) {
                    var action = self.$actions[i],
                        value = self.easing.$valueForProgress(at) * (action.to - action.from) + action.from;
                    action.target.$properties[action.property].set(value, true);
                }
        }
    }

    function startLoop() {
        for (var i in this.$actions) {
            var action = this.$actions[i];
            action.from = action.from !== Undefined ? action.from : action.target[action.property];
        }
        at = 0;
    }

    this.runningChanged.connect(this, function(newVal) {
        if (newVal) {
            startLoop.call(this);
            this.paused = false;
        } else if (this.alwaysRunToEnd && at < 1) {
            loop = -1; // -1 is used as a marker to stop
        } else {
            loop = 0;
            this.$actions = [];
        }
    });

    this.complete = function() {
        for (var i in this.$actions) {
            var action = this.$actions[i];
            action.target.$properties[action.property].set(action.to, true);
        }

        if (++loop == this.loops)
            this.running = false;
        else if (!this.running)
            this.$actions = [];
        else
            startLoop.call(this);
    }
  }
});

registerQmlType({
  module:   'QtQuick',
  name:     'ParallelAnimation',
  versions: /.*/,
  constructor: function QMLParallelAnimation(meta) {
    QMLAnimation.call(this, meta);
    var curIndex,
        passedLoops,
        i;

    this.Animation = { Infinite: Math.Infinite }
    createSimpleProperty("list", this, "animations");
    this.$defaultProperty = "animations";
    this.animations = [];
    this.$runningAnimations = 0;

    this.animationsChanged.connect(this, function() {
        for (i = 0; i < this.animations.length; i++) {
            if (!this.animations[i].runningChanged.isConnected(this, animationFinished))
                this.animations[i].runningChanged.connect(this, animationFinished);
        }
    });

    function animationFinished(newVal) {
        this.$runningAnimations += newVal ? 1 : -1;
        if (this.$runningAnimations === 0)
            this.running = false;
    }

    this.start = function() {
        if (!this.running) {
            this.running = true;
            for (i = 0; i < this.animations.length; i++)
                this.animations[i].start();
        }
    }
    this.stop = function() {
        if (this.running) {
            for (i = 0; i < this.animations.length; i++)
                this.animations[i].stop();
            this.running = false;
        }
    }
    this.complete = this.stop;

    engine.$registerStart(function() {
        if (self.running) {
            self.running = false; // toggled back by start();
            self.start();
        }
    });
    engine.$registerStop(function() {
        self.stop();
    });
  }
});

registerQmlType({
  module:   'QtQuick',
  name:     'PropertyAnimation',
  versions: /.*/,
  constructor: function QMLPropertyAnimation(meta) {
    QMLAnimation.call(this, meta);

    createSimpleProperty("int", this, "duration");
    createSimpleProperty("real", this, "from");
    createSimpleProperty("string", this, "properties");
    createSimpleProperty("string", this, "property");
    createSimpleProperty("QtObject", this, "target");
    createSimpleProperty("list", this, "targets");
    createSimpleProperty("real", this, "to");

    this.easing = new QObject(this);
    createSimpleProperty("enum", this.easing, "type");
    createSimpleProperty("real", this.easing, "amplitude");
    createSimpleProperty("real", this.easing, "overshoot");
    createSimpleProperty("real", this.easing, "period");

    this.easing.$valueForProgress = function(t) {
        switch(this.type) {
            // Quad
            case Easing.InQuad: return Math.pow(t, 2);
            case Easing.OutQuad: return -Math.pow(t - 1, 2) + 1;
            case Easing.InOutQuad:
                if (t < 0.5)
                    return 2 * Math.pow(t, 2);
                return -2 * Math.pow(t - 1, 2) + 1;
            case Easing.OutInQuad:
                if (t < 0.5)
                    return -2 * Math.pow(t - 0.5, 2) + 0.5;
                return 2 * Math.pow(t - 0.5, 2) + 0.5;
            // Cubic
            case Easing.InCubic: return Math.pow(t, 3);
            case Easing.OutCubic: return Math.pow(t - 1, 3) + 1;
            case Easing.InOutCubic:
                if (t < 0.5)
                    return 4 * Math.pow(t, 3);
                return 4 * Math.pow(t - 1, 3) + 1;
            case Easing.OutInCubic:
                return 4 * Math.pow(t - 0.5, 3) + 0.5;
            // Quart
            case Easing.InQuart: return Math.pow(t, 4);
            case Easing.OutQuart: return -Math.pow(t - 1, 4) + 1;
            case Easing.InOutQuart:
                if (t < 0.5)
                    return 8 * Math.pow(t, 4);
                return -8 * Math.pow(t - 1, 4) + 1;
            case Easing.OutInQuart:
                if (t < 0.5)
                    return -8 * Math.pow(t - 0.5, 4) + 0.5;
                return 8 * Math.pow(t - 0.5, 4) + 0.5;
            // Quint
            case Easing.InQuint: return Math.pow(t, 5);
            case Easing.OutQuint: return Math.pow(t - 1, 5) + 1;
            case Easing.InOutQuint:
                if (t < 0.5)
                    return 16 * Math.pow(t, 5);
                return 16 * Math.pow(t - 1, 5) + 1;
            case Easing.OutInQuint:
                if (t < 0.5)
                    return 16 * Math.pow(t - 0.5, 5) + 0.5;
                return 16 * Math.pow(t - 0.5, 5) + 0.5;
            // Sine
            case Easing.InSine: return -Math.cos(0.5 * Math.PI * t) + 1;
            case Easing.OutSine: return Math.sin(0.5 * Math.PI * t);
            case Easing.InOutSine: return -0.5 * Math.cos(Math.PI * t) + 0.5;
            case Easing.OutInSine:
                if (t < 0.5)
                    return 0.5 * Math.sin(Math.PI * t);
                return -0.5 * Math.sin(Math.PI * t) + 1;
            // Expo
            case Easing.InExpo: return (1/1023) * (Math.pow(2, 10*t) - 1);
            case Easing.OutExpo: return -(1024/1023) * (Math.pow(2, -10*t) - 1);
            case Easing.InOutExpo:
                if (t < 0.5)
                    return (1/62) * (Math.pow(2, 10*t) - 1);
                return -(512/31) * Math.pow(2, -10*t) + (63/62);
            case Easing.OutInExpo:
                if (t < 0.5)
                    return -(16/31) * (Math.pow(2, -10*t) - 1);
                return (1/1984) * Math.pow(2, 10*t) + (15/31);
            // Circ
            case Easing.InCirc: return 1 - Math.sqrt(1 - t*t);
            case Easing.OutCirc: return Math.sqrt(1 - Math.pow(t - 1, 2));
            case Easing.InOutCirc:
                if (t < 0.5)
                    return 0.5 * (1 - Math.sqrt(1 - 4*t*t));
                return 0.5 * (Math.sqrt(1 - 4 * Math.pow(t - 1, 2)) + 1);
            case Easing.OutInCirc:
                if (t < 0.5)
                    return 0.5 * Math.sqrt(1 - Math.pow(2 * t - 1, 2));
                return 0.5 * (2 - Math.sqrt(1 - Math.pow(2 * t - 1, 2)));
            // Elastic
            case Easing.InElastic:
                return -this.amplitude * Math.pow(2, 10 * t - 10)
                        * Math.sin(2 * t * Math.PI / this.period - Math.asin(1 / this.amplitude));
            case Easing.OutElastic:
                return this.amplitude * Math.pow(2, -10 * t)
                        * Math.sin(2 * t * Math.PI / this.period - Math.asin(1 / this.amplitude))
                        + 1;
            case Easing.InOutElastic:
                if (t < 0.5)
                    return -0.5 * this.amplitude * Math.pow(2, 20 * t - 10)
                            * Math.sin(4 * t * Math.PI / this.period - Math.asin(1 / this.amplitude));
                return -0.5 * this.amplitude * Math.pow(2, -20 * t + 10)
                        * Math.sin(4 * t * Math.PI / this.period + Math.asin(1 / this.amplitude))
                        + 1;
            case Easing.OutInElastic:
                if (t < 0.5)
                    return 0.5 * this.amplitude * Math.pow(2, -20 * t)
                            * Math.sin(4 * t * Math.PI / this.period - Math.asin(1 / this.amplitude))
                            + 0.5;
                return -0.5 * this.amplitude * Math.pow(2, 20 * t - 20)
                        * Math.sin(4 * t * Math.PI / this.period - Math.asin(1 / this.amplitude))
                        + 0.5;
            // Back
            case Easing.InBack: return (this.overshoot + 1) * Math.pow(t, 3) - this.overshoot * Math.pow(t, 2);
            case Easing.OutBack: return (this.overshoot + 1) * Math.pow(t - 1, 3) + this.overshoot * Math.pow(t - 1, 2) + 1;
            case Easing.InOutBack:
                if (t < 0.5)
                    return 4 * (this.overshoot + 1) * Math.pow(t, 3) - 2 * this.overshoot * Math.pow(t, 2);
                return 0.5 * (this.overshoot + 1) * Math.pow(2 * t - 2, 3) + this.overshoot/2 * Math.pow(2 * t - 2, 2) + 1;
            case Easing.OutInBack:
                if (t < 0.5)
                    return 0.5 * ((this.overshoot + 1) * Math.pow(2 * t - 1, 3) + this.overshoot * Math.pow(2 * t - 1, 2) + 1);
                return 4 * (this.overshoot + 1) * Math.pow( t - 0.5, 3) - 2 * this.overshoot * Math.pow(t - 0.5, 2) + 0.5;
            // Bounce
            case Easing.InBounce:
                if (t < 1/11) return -this.amplitude * (121/16) * (t*t - (1/11)*t);
                if (t < 3/11) return -this.amplitude * (121/16) * (t*t - (4/11)*t + (3/121));
                if (t < 7/11) return -this.amplitude * (121/16) * (t*t - (10/11)*t + (21/121));
                return -(121/16) * (t*t - 2*t + 1) + 1;
            case Easing.OutBounce:
                if (t < 4/11) return (121/16) * t*t;
                if (t < 8/11) return this.amplitude * (121/16) * (t*t - (12/11)*t + (32/121)) + 1;
                if (t < 10/11) return this.amplitude * (121/16) * (t*t - (18/11)*t + (80/121)) + 1;
                return this.amplitude * (121/16) * (t*t - (21/11)*t + (10/11)) + 1;
            case Easing.InOutBounce:
                if (t < 1/22) return -this.amplitude * (121/8) * (t*t - (1/22)*t);
                if (t < 3/22) return -this.amplitude * (121/8) * (t*t - (2/11)*t + (3/484));
                if (t < 7/22) return -this.amplitude * (121/8) * (t*t - (5/11)*t + (21/484));
                if (t < 11/22) return -(121/8) * (t*t - t + 0.25) + 0.5;
                if (t < 15/22) return (121/8) * (t*t - t) + (137/32);
                if (t < 19/22) return this.amplitude * (121/8) * (t*t - (17/11)*t + (285/484)) + 1;
                if (t < 21/22) return this.amplitude * (121/8) * (t*t - (20/11)*t + (399/484)) + 1;
                return this.amplitude * (121/8) * (t*t - (43/22)*t + (21/22)) + 1;
            case Easing.OutInBounce:
                if (t < 4/22) return (121/8) * t*t;
                if (t < 8/22) return -this.amplitude * (121/8) * (t*t - (6/11)*t + (8/121)) + 0.5;
                if (t < 10/22) return -this.amplitude * (121/8) * (t*t - (9/11)*t + (20/121)) + 0.5;
                if (t < 11/22) return -this.amplitude * (121/8) * (t*t - (21/22)*t + (5/22)) + 0.5;
                if (t < 12/22) return this.amplitude * (121/8) * (t*t - (23/22)*t + (3/11)) + 0.5;
                if (t < 14/22) return this.amplitude * (121/8) * (t*t - (13/11)*t + (42/121)) + 0.5;
                if (t < 18/22) return this.amplitude * (121/8) * (t*t - (16/11)*t + (63/121)) + 0.5;
                return -(121/8) * (t*t - 2*t + (117/121)) + 0.5;
            // Default
            default:
                console.log("Unsupported animation type: ", this.type);
            // Linear
            case Easing.Linear:
                return t;
        }
    }

    this.$redoActions = function() {
        this.$actions = [];
        for (var i = 0; i < this.$targets.length; i++) {
            for (var j in this.$props) {
                this.$actions.push({
                    target: this.$targets[i],
                    property: this.$props[j],
                    from: this.from,
                    to: this.to
                });
            }
        }
    }
    function redoProperties() {
        this.$props = this.properties.split(",");

        // Remove whitespaces
        for (var i = 0; i < this.$props.length; i++) {
            var matches = this.$props[i].match(/\w+/);
            if (matches) {
                this.$props[i] = matches[0];
            } else {
                this.$props.splice(i, 1);
                i--;
            }
        }
        // Merge properties and property
        if (this.property && this.$props.indexOf(this.property) === -1)
            this.$props.push(this.property);
    }
    function redoTargets() {
        this.$targets = this.targets.slice();

        if (this.target && this.$targets.indexOf(this.target) === -1)
            this.$targets.push(this.target);
    }

    this.duration = 250;
    this.easing.type = Easing.Linear;
    this.easing.amplitude = 1;
    this.easing.period = 0.3;
    this.easing.overshoot = 1.70158;
    this.$props = [];
    this.$targets = [];
    this.$actions = [];
    this.properties = "";
    this.targets = [];

    this.targetChanged.connect(this, redoTargets);
    this.targetsChanged.connect(this, redoTargets);
    this.propertyChanged.connect(this, redoProperties);
    this.propertiesChanged.connect(this, redoProperties);

    if (meta.object.$on !== undefined) {
        this.property = meta.object.$on;
        this.target = this.$parent;
    }
  }
});


registerQmlType({
  module: 'QtQuick',
  name:   'Rectangle',
  versions: /.*/,
  constructor: function QMLRectangle(meta) {
    QMLItem.call(this, meta);

    createSimpleProperty("color", this, "color");
    createSimpleProperty("real", this, "radius");

    this.border = new QObject(this);
    createSimpleProperty("color", this.border, "color");
    createSimpleProperty("int", this.border, "width");

    this.colorChanged.connect(this, function(newVal) {
        this.dom.style.backgroundColor = newVal;
    });
    this.radiusChanged.connect(this, function(newVal) {
        this.dom.style.borderRadius = newVal + "px";
    });
    this.border.colorChanged.connect(this, function(newVal) {
        this.dom.style.borderColor = newVal;
        this.dom.style.borderStyle = this.border.width == 0 || newVal == "transparent"
                                            ? "none" : "solid";
    });
    this.border.widthChanged.connect(this, function(newVal) {
        this.dom.style.borderWidth = newVal + "px";
        this.dom.style.borderStyle = newVal == 0 || this.border.color == "transparent"
                                            ? "none" : "solid";
    });

    this.color = "white";
    this.border.color = "transparent";
    this.border.width = 1;
    this.radius = 0;

    this.$drawItem = function(c) {
        //descr("draw rect", this, ["x", "y", "width", "height", "color"]);
        //descr("draw rect.border", this.border, ["color", "width"]);
        c.save();
        c.fillStyle = this.color;
        c.strokeStyle = this.border.color;
        c.lineWidth = this.border.width;

        if (!this.radius) {
            c.fillRect(this.left, this.top, this.width, this.height);
            c.strokeRect(this.left, this.top, this.width, this.height);
        } else {
            var r = this.left + this.width;
            var b = this.top + this.height;
            c.beginPath();
            c.moveTo(this.left + this.radius, this.top);
            c.lineTo(r - this.radius, this.top);
            c.quadraticCurveTo(r, this.top, r, this.top + this.radius);
            c.lineTo(r, this.top + this.height - this.radius);
            c.quadraticCurveTo(r, b, r - this.radius, b);
            c.lineTo(this.left + this.radius, b);
            c.quadraticCurveTo(this.left, b, this.left, b - this.radius);
            c.lineTo(this.left, this.top + this.radius);
            c.quadraticCurveTo(this.left, this.top, this.left + this.radius, this.top);
            c.stroke();
            c.fill();
        }
        c.restore();
    }
  }
});

registerQmlType({
  module:   'QtQuick',
  name:     'RegExpValidator',
  versions: /.*/,
  constructor: function QMLRegExpValidator(meta) {
    QMLItem.call(this, meta);

    createSimpleProperty("var", this, "regExp");

    this.validate = (function(string) {
      if (typeof this.regExp == 'undefined' || this.regExp == null)
        return true;
      return this.regExp.test(string);
    }).bind(this);
  }
});

registerQmlType({
  module:   'QtQuick',
  name:     'Repeater',
  versions: /.*/,
  constructor: function QMLRepeater(meta) {
    QMLItem.call(this, meta);
    var self = this;

    createSimpleProperty("Component", this, "delegate");
    this.$defaultProperty = "delegate";
    createSimpleProperty("variant", this, "model");
    createSimpleProperty("int", this, "count");
    this.$completed = false;
    this.$items = []; // List of created items

    this.modelChanged.connect(applyModel);
    this.delegateChanged.connect(applyModel);

    this.model = 0;
    this.count = 0;

    this.itemAt = function(index) {
        return this.$items[index];
    }

    function callOnCompleted(child) {
        child.Component.completed();
        for (var i = 0; i < child.children.length; i++)
            callOnCompleted(child.children[i]);
    }
    function insertChildren(startIndex, endIndex) {
        for (var index = startIndex; index < endIndex; index++) {
            var newItem = self.delegate.createObject(self);

            createSimpleProperty("int", newItem, "index");
            var model = self.model instanceof QMLListModel ? self.model.$model : self.model;
            for (var i in model.roleNames) {
                createSimpleProperty("variant", newItem, model.roleNames[i]);
                newItem.$properties[model.roleNames[i]].set(model.data(index, model.roleNames[i]), true, newItem, self.model.$context);
            }

            self.parent.children.splice(self.parent.children.indexOf(self) - self.$items.length + index, 0, newItem);
            newItem.parent = self.parent;
            self.parent.childrenChanged();
            self.$items.splice(index, 0, newItem);

            newItem.index = index;

            if (engine.operationState !== QMLOperationState.Init) {
                // We don't call those on first creation, as they will be called
                // by the regular creation-procedures at the right time.
                engine.$initializePropertyBindings();
                callOnCompleted(newItem);
            }
        }
        for (var i = endIndex; i < self.$items.length; i++)
            self.$items[i].index = i;

        self.count = self.$items.length;
    }

    function applyModel() {
        if (!self.delegate)
            return;
        var model = self.model instanceof QMLListModel ? self.model.$model : self.model;
        if (model instanceof JSItemModel) {
            model.dataChanged.connect(function(startIndex, endIndex) {
                //TODO
            });
            model.rowsInserted.connect(insertChildren);
            model.rowsMoved.connect(function(sourceStartIndex, sourceEndIndex, destinationIndex) {
                var vals = self.$items.splice(sourceStartIndex, sourceEndIndex-sourceStartIndex);
                for (var i = 0; i < vals.length; i++) {
                    self.$items.splice(destinationIndex + i, 0, vals[i]);
                }
                var smallestChangedIndex = sourceStartIndex < destinationIndex
                                        ? sourceStartIndex : destinationIndex;
                for (var i = smallestChangedIndex; i < self.$items.length; i++) {
                    self.$items[i].index = i;
                }
            });
            model.rowsRemoved.connect(function(startIndex, endIndex) {
                removeChildren(startIndex, endIndex);
                for (var i = startIndex; i < self.$items.length; i++) {
                    self.$items[i].index = i;
                }
                self.count = self.$items.length;
            });
            model.modelReset.connect(function() {
                removeChildren(0, self.$items.length);
                insertChildren(0, model.rowCount());
            });

            insertChildren(0, model.rowCount());
        } else if (typeof model == "number") {
            removeChildren(0, self.$items.length);
            insertChildren(0, model);
        }
    }

    function removeChildren(startIndex, endIndex) {
        var removed = self.$items.splice(startIndex, endIndex - startIndex);
        for (var index in removed) {
            removed[index].$delete();
            removed[index].parent = undefined;
            removeChildProperties(removed[index]);
        }
    }
    function removeChildProperties(child) {
        engine.completedSignals.splice(engine.completedSignals.indexOf(child.Component.completed), 1);
        for (var i = 0; i < child.children.length; i++)
            removeChildProperties(child.children[i])
    }
  }
});

registerQmlType({
  module: 'QtQuick',
  name:   'Rotation',
  versions: /.*/,
  constructor: function QMLRotation(meta) {
    QMLBaseObject.call(this, meta);

    createSimpleProperty("real", this, "angle");

    this.axis = new QObject(this);
    createSimpleProperty("real", this.axis, "x");
    createSimpleProperty("real", this.axis, "y");
    createSimpleProperty("real", this.axis, "z");

    this.origin = new QObject(this);
    createSimpleProperty("real", this.origin, "x");
    createSimpleProperty("real", this.origin, "y");

    function updateOrigin() {
        this.$parent.dom.style.transformOrigin = this.origin.x + "px " + this.origin.y + "px";
        this.$parent.dom.style.MozTransformOrigin = this.origin.x + "px " + this.origin.y + "px";    // Firefox
        this.$parent.dom.style.webkitTransformOrigin = this.origin.x + "px " + this.origin.y + "px"; // Chrome, Safari and Opera
    }
    this.angleChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.axis.xChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.axis.yChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.axis.zChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.origin.xChanged.connect(this, updateOrigin);
    this.origin.yChanged.connect(this, updateOrigin);

    this.angle = 0;
    this.axis.x = 0;
    this.axis.y = 0;
    this.axis.z = 1;
    this.origin.x = 0;
    this.origin.y = 0;
  }
});

registerQmlType({
  module:   'QtQuick',
  name:     'Row',
  versions: /.*/,
  constructor: QMLRow
});

function QMLRow(meta) {
    QMLPositioner.call(this, meta);

    createSimpleProperty("enum", this, "layoutDirection");
    this.layoutDirectionChanged.connect(this, this.layoutChildren);
    this.layoutDirection = 0;
}

QMLRow.prototype.layoutChildren = function() {
    var curPos = 0,
        maxHeight = 0,
        // When layoutDirection is RightToLeft we need oposite order
        i = this.layoutDirection == 1 ? this.children.length - 1 : 0,
        endPoint = this.layoutDirection == 1 ? -1 : this.children.length,
        step = this.layoutDirection == 1 ? -1 : 1;
    for (; i !== endPoint; i += step) {
        var child = this.children[i];
        if (!(child.visible && child.opacity && child.width && child.height))
            continue;
        maxHeight = child.height > maxHeight ? child.height : maxHeight;

        child.x = curPos;
        curPos += child.width + this.spacing;
    }
    this.implicitHeight = maxHeight;
    this.implicitWidth = curPos - this.spacing; // We want no spacing at the right side
}

registerQmlType({
  module:   'QtQuick',
  name:     'Scale',
  versions: /.*/,
  constructor: function QMLScale(meta) {
    QMLBaseObject.call(this, meta);

    createSimpleProperty("real", this, "xScale");
    createSimpleProperty("real", this, "yScale");

    this.origin = new QObject(this);
    createSimpleProperty("real", this.origin, "x");
    createSimpleProperty("real", this.origin, "y");

    function updateOrigin() {
        this.$parent.dom.style.transformOrigin = this.origin.x + "px " + this.origin.y + "px";
        this.$parent.dom.style.MozTransformOrigin = this.origin.x + "px " + this.origin.y + "px";    // Firefox
        this.$parent.dom.style.webkitTransformOrigin = this.origin.x + "px " + this.origin.y + "px"; // Chrome, Safari and Opera
    }
    this.xScaleChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.yScaleChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.origin.xChanged.connect(this, updateOrigin);
    this.origin.yChanged.connect(this, updateOrigin);

    this.xScale = 0;
    this.yScale = 0;
    this.origin.x = 0;
    this.origin.y = 0;
  }
});

registerQmlType({
  module:   'QtQuick',
  name:     'SequentialAnimation',
  versions: /.*/,
  constructor: function QMLSequentialAnimation(meta) {
    QMLAnimation.call(this, meta);
    var curIndex,
        passedLoops,
        i,
        self = this;

    createSimpleProperty("list", this, "animations");
    this.$defaultProperty = "animations";
    this.animations = [];

    function nextAnimation(proceed) {
        var anim;
        if (self.running && !proceed) {
            curIndex++;
            if (curIndex < self.animations.length) {
                anim = self.animations[curIndex];
                console.log("nextAnimation", self, curIndex, anim);
                descr("", anim, ["target"]);
                anim.start();
            } else {
                passedLoops++;
                if (passedLoops >= self.loops) {
                    self.complete();
                } else {
                    curIndex = -1;
                    nextAnimation();
                }
            }
        }
    }

    this.animationsChanged.connect(this, function() {
        for (i = 0; i < this.animations.length; i++) {
            if (!this.animations[i].runningChanged.isConnected(nextAnimation))
                this.animations[i].runningChanged.connect(nextAnimation);
        }
    });

    this.start = function() {
        if (!this.running) {
            this.running = true;
            curIndex = -1;
            passedLoops = 0;
            nextAnimation();
        }
    }
    this.stop = function() {
        if (this.running) {
            this.running = false;
            if (curIndex < this.animations.length) {
                this.animations[curIndex].stop();
            }
        }
    }

    this.complete = function() {
        if (this.running) {
            if (curIndex < this.animations.length) {
                // Stop current animation
                this.animations[curIndex].stop();
            }
            this.running = false;
        }
    }

    engine.$registerStart(function() {
        if (self.running) {
            self.running = false; // toggled back by start();
            self.start();
        }
    });
    engine.$registerStop(function() {
        self.stop();
    });
  }
});

registerQmlType({
  module:   'QtQuick',
  name:     'State',
  versions: /.*/,
  constructor: function QMLState(meta) {
    QMLBaseObject.call(this, meta);

    createSimpleProperty("string", this, "name");
    createSimpleProperty("list", this, "changes");
    this.$defaultProperty = "changes";
    createSimpleProperty("string", this, "extend");
    createSimpleProperty("bool", this, "when");
    this.changes = [];
    this.$item = this.$parent;

    this.whenChanged.connect(this, function(newVal) {
        if (newVal)
            this.$item.state = this.name;
        else if (this.$item.state == this.name)
            this.$item.state = "";
    });

    this.$getAllChanges = function() {
        if (this.extend) {
            for (var i = 0; i < this.$item.states.length; i++)
                if (this.$item.states[i].name == this.extend)
                    return this.$item.states[i].$getAllChanges().concat(this.changes);
        } else
            return this.changes;
    }
  }
});

registerQmlType({
  module:   'QtQuick',
  name:     'Text',
  versions: /.*/,
  constructor: function QMLText(meta) {
    QMLItem.call(this, meta);

    // We create another span inside the text to distinguish the actual
    // (possibly html-formatted) text from child elements
    this.dom.innerHTML = "<span></span>";
    this.dom.style.pointerEvents = "auto";
    this.dom.firstChild.style.width = "100%";
    this.dom.firstChild.style.height = "100%";

    // Creates font css description
    function fontCss(font) {
        var css = "";
        css += font.italic ? "italic " : "normal ";
        css += font.capitalization == "smallcaps" ? "small-caps " : "normal ";
        // Canvas seems to only support bold yes or no
        css += (font.weight == Font.Bold
            || font.weight == Font.DemiBold
            || font.weight == Font.Black
            || font.bold) ? "bold " : "normal ";
        css += font.pixelSize !== Undefined
            ? font.pixelSize + "px "
            : (font.pointSize || 10) + "pt ";
        css += this.lineHeight !== Undefined ? this.lineHeight + "px " : " ";
        css += (font.family || "sans-serif") + " ";
        return css;
    }

    this.Text = {
        // Wrap Mode
        NoWrap: 0,
        WordWrap: 1,
        WrapAnywhere: 2,
        Wrap: 3,
        WrapAtWordBoundaryOrAnywhere: 3, // COMPAT
        // Horizontal-Alignment
        AlignLeft: "left",
        AlignRight: "right",
        AlignHCenter: "center",
        AlignJustify: "justify",
        // Style
        Normal: 0,
        Outline: 1,
        Raised: 2,
        Sunken: 3
    }

    this.font = new QMLFont(this);

    createSimpleProperty("color", this, "color");
    createSimpleProperty("string", this, "text");
    createSimpleProperty("real", this, "lineHeight");
    createSimpleProperty("enum", this, "wrapMode");
    createSimpleProperty("enum", this, "horizontalAlignment");
    createSimpleProperty("enum", this, "style");
    createSimpleProperty("color", this, "styleColor");

    this.colorChanged.connect(this, function(newVal) {
        this.dom.firstChild.style.color = newVal;
    });
    this.textChanged.connect(this, function(newVal) {
        this.dom.firstChild.innerHTML = newVal;
    });
    this.lineHeightChanged.connect(this, function(newVal) {
        this.dom.firstChild.style.lineHeight = newVal + "px";
    });
    this.wrapModeChanged.connect(this, function(newVal) {
        switch (newVal) {
            case 0:
                this.dom.firstChild.style.whiteSpace = "pre";
                break;
            case 1:
                this.dom.firstChild.style.whiteSpace = "pre-wrap";
                break;
            case 2:
                this.dom.firstChild.style.whiteSpace = "pre-wrap";
                this.dom.firstChild.style.wordBreak = "break-all";
                break;
            case 3:
                this.dom.firstChild.style.whiteSpace = "pre-wrap";
                this.dom.firstChild.style.wordWrap = "break-word";
        };
        // AlignJustify doesn't work with pre/pre-wrap, so we decide the
        // lesser of the two evils to be ignoring "\n"s inside the text.
        if (this.horizontalAlignment == "justify")
            this.dom.firstChild.style.whiteSpace = "normal";
    });
    this.horizontalAlignmentChanged.connect(this, function(newVal) {
        this.dom.style.textAlign = newVal;
        // AlignJustify doesn't work with pre/pre-wrap, so we decide the
        // lesser of the two evils to be ignoring "\n"s inside the text.
        if (newVal == "justify")
            this.dom.firstChild.style.whiteSpace = "normal";
    });
    this.styleChanged.connect(this, function(newVal) {
        switch (newVal) {
            case 0:
                this.dom.firstChild.style.textShadow = "none";
                break;
            case 1:
                var color = this.styleColor;
                this.dom.firstChild.style.textShadow = "1px 0 0 " + color
                    + ", -1px 0 0 " + color
                    + ", 0 1px 0 " + color
                    + ", 0 -1px 0 " + color;
                break;
            case 2:
                this.dom.firstChild.style.textShadow = "1px 1px 0 " + this.styleColor;
                break;
            case 3:
                this.dom.firstChild.style.textShadow = "-1px -1px 0 " + this.styleColor;
        };
    });
    this.styleColorChanged.connect(this, function(newVal) {
        switch (this.style) {
            case 0:
                this.dom.firstChild.style.textShadow = "none";
                break;
            case 1:
                this.dom.firstChild.style.textShadow = "1px 0 0 " + newVal
                    + ", -1px 0 0 " + newVal
                    + ", 0 1px 0 " + newVal
                    + ", 0 -1px 0 " + newVal;
                break;
            case 2:
                this.dom.firstChild.style.textShadow = "1px 1px 0 " + newVal;
                break;
            case 3:
                this.dom.firstChild.style.textShadow = "-1px -1px 0 " + newVal;
        };
    });

    this.font.family = "sans-serif";
    this.font.pointSize = 10;
    this.wrapMode = this.Text.NoWrap;
    this.color = "black";
    this.text = "";

    this.textChanged.connect(this, updateImplicitHeight);
    this.textChanged.connect(this, updateImplicitWidth);
    this.font.boldChanged.connect(this, updateImplicitHeight);
    this.font.boldChanged.connect(this, updateImplicitWidth);
    this.font.pixelSizeChanged.connect(this, updateImplicitHeight);
    this.font.pixelSizeChanged.connect(this, updateImplicitWidth);
    this.font.pointSizeChanged.connect(this, updateImplicitHeight);
    this.font.pointSizeChanged.connect(this, updateImplicitWidth);
    this.font.familyChanged.connect(this, updateImplicitHeight);
    this.font.familyChanged.connect(this, updateImplicitWidth);
    this.font.letterSpacingChanged.connect(this, updateImplicitHeight);
    this.font.wordSpacingChanged.connect(this, updateImplicitWidth);

    this.Component.completed.connect(this, updateImplicitHeight);
    this.Component.completed.connect(this, updateImplicitWidth);

    function updateImplicitHeight() {
        var height;

        if (this.text === Undefined || this.text === "") {
            height = 0;
        } else {
            height = this.dom ? this.dom.firstChild.offsetHeight : 0;
        }

        this.implicitHeight = height;
    }

    function updateImplicitWidth() {
        var width;

        if (this.text === Undefined || this.text === "")
            width = 0;
        else
            width = this.dom ? this.dom.firstChild.offsetWidth : 0;

        this.implicitWidth = width;
    }

    this.$drawItem = function(c) {
        //descr("draw text", this, ["x", "y", "text",
        //                          "implicitWidth", "implicitHeight"]);
        c.save();
        c.font = fontCss(this.font);
        c.fillStyle = this.color;
        c.textAlign = "left";
        c.textBaseline = "top";
        c.fillText(this.text, this.left, this.top);
        c.restore();
    }
  }
});

registerQmlType({
  module:   'QtQuick',
  name:     'TextInput',
  versions: /.*/,
  constructor: function QMLTextInput(meta) {
    QMLItem.call(this, meta);

    var self = this;

    this.font = new getConstructor('QtQuick', '2.0', 'Font')(this);

    this.dom.innerHTML = "<input type=\"text\" disabled/>"
    this.dom.firstChild.style.pointerEvents = "auto";
    // In some browsers text-inputs have a margin by default, which distorts
    // the positioning, so we need to manually set it to 0.
    this.dom.firstChild.style.margin = "0";
    this.dom.firstChild.style.width = "100%";

    this.setupFocusOnDom(this.dom.firstChild);

    createSimpleProperty("string", this, "text", "");
    createSimpleProperty("int",    this, "maximumLength");
    createSimpleProperty("bool",   this, "readOnly");
    createSimpleProperty("var",    this, "validator");
    this.accepted = Signal();
    this.readOnly = false;
    this.maximumLength = -1;
    this.dom.firstChild.disabled = false;

    this.Component.completed.connect(this, function() {
        this.implicitWidth = this.dom.firstChild.offsetWidth;
        this.implicitHeight = this.dom.firstChild.offsetHeight;
    });

    this.textChanged.connect(this, function(newVal) {
        this.dom.firstChild.value = newVal;
    });

    this.maximumLengthChanged.connect(this, function(newVal) {
        if (newVal < 0)
          newVal = null;
        this.dom.firstChild.maxLength = newVal;
    });

    this.readOnlyChanged.connect(this, function(newVal) {
        this.dom.firstChild.disabled = newVal;
    });

    this.dom.firstChild.onkeydown = function(e) {
        if (e.keyCode == 13 && testValidator()) //Enter pressed
            self.accepted();
    }

    function testValidator() {
      if (typeof self.validator != 'undefined' && self.validator != null)
        return self.validator.validate(self.text);
      return true;
    }

    function updateValue(e) {
        if (self.text != self.dom.firstChild.value) {
            self.text = self.dom.firstChild.value;
        }
    }

    this.dom.firstChild.oninput = updateValue;
    this.dom.firstChild.onpropertychanged = updateValue;
  }
});

registerQmlType({
  module:   'QtQuick',
  name:     'Timer',
  versions: /.*/,
  constructor: function QMLTimer(meta) {
    QMLBaseObject.call(this, meta);
    var prevTrigger,
        self = this;

    createSimpleProperty("int", this, "interval");
    createSimpleProperty("bool", this, "repeat");
    createSimpleProperty("bool", this, "running");
    createSimpleProperty("bool", this, "triggeredOnStart");

    this.interval = 1000;
    this.repeat = false;
    this.running = false;
    this.triggeredOnStart = false;

    // Create trigger as simple property. Reading the property triggers
    // the function!
    this.triggered = Signal();

    engine.$addTicker(ticker);
    function ticker(now, elapsed) {
        if (self.running) {
            if (now - prevTrigger >= self.interval) {
                prevTrigger = now;
                trigger();
            }
        }
    }

    this.start = function() {
        if (!this.running) {
            this.running = true;
            prevTrigger = (new Date).getTime();
            if (this.triggeredOnStart) {
                trigger();
            }
        }
    }
    this.stop = function() {
        if (this.running) {
            this.running = false;
        }
    }
    this.restart = function() {
        this.stop();
        this.start();
    }

    function trigger() {
        if (!self.repeat)
            // We set the value directly in order to be able to emit the runningChanged
            // signal after triggered, like Qt does it.
            self.$properties.running.val = false;

        // Trigger this.
        self.triggered();

        if (!self.repeat)
            // Emit changed signal manually after setting the value manually above.
            self.runningChanged();
    }

    engine.$registerStart(function() {
        if (self.running) {
            self.running = false; // toggled back by self.start();
            self.start();
        }
    });

    engine.$registerStop(function() {
        self.stop();
    });
  }
});

registerQmlType({
  module:   'QtQuick',
  name:     'Transition',
  versions: /.*/,
  constructor: function QMLTransition(meta) {
    QMLBaseObject.call(this, meta);

    createSimpleProperty("list", this, "animations");
    this.$defaultProperty = "animations";
    createSimpleProperty("string", this, "from");
    createSimpleProperty("string", this, "to");
    createSimpleProperty("bool", this, "reversible");
    this.animations = [];
    this.$item = this.$parent;
    this.from = "*";
    this.to = "*";

    this.$start = function(actions) {
        for (var i = 0; i < this.animations.length; i++) {
            var animation = this.animations[i];
            animation.$actions = [];
            for (var j in actions) {
                var action = actions[j];
                if ((animation.$targets.length === 0 || animation.$targets.indexOf(action.target) !== -1)
                    && (animation.$props.length === 0 || animation.$props.indexOf(action.property) !== -1))
                    animation.$actions.push(action);
            }
            animation.start();
        }
    }
    this.$stop = function() {
        for (var i = 0; i < this.animations.length; i++)
            this.animations[i].stop();
    }
  }
});

registerQmlType({
  module:   'QtQuick',
  name:     'Translate',
  versions: /.*/,
  constructor: function QMLTranslate(meta) {
    QMLBaseObject.call(this, meta);

    createSimpleProperty("real", this, "x");
    createSimpleProperty("real", this, "y");

    this.xChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.yChanged.connect(this.$parent, this.$parent.$updateTransform);

    this.x = 0;
    this.y = 0;
  }
});

registerQmlType({
  module:   'QtQuick.Controls',
  name:     'CheckBox',
  versions: /.*/,
  constructor: function QMLCheckbox(meta) {
    this.dom = document.createElement("label");
    QMLItem.call(this, meta);
    var self = this;

    this.font = new QMLFont(this);

    this.dom.innerHTML = "<input type=\"checkbox\"><span></span>";
    this.dom.style.pointerEvents = "auto";
    this.dom.firstChild.style.verticalAlign = "text-bottom";

    createSimpleProperty("string", this, "text");
    createSimpleProperty("bool", this, "checked");
    createSimpleProperty("color", this, "color");

    this.Component.completed.connect(this, function() {
        this.implicitHeight = this.dom.offsetHeight;
        this.implicitWidth = this.dom.offsetWidth;
    });
    this.textChanged.connect(this, function(newVal) {
        this.dom.children[1].innerHTML = newVal;
        this.implicitHeight = this.dom.offsetHeight;
        this.implicitWidth = this.dom.offsetWidth;
    });
    this.colorChanged.connect(this, function(newVal) {
        this.dom.children[1].style.color = newVal;
    });

    this.dom.firstChild.onchange = function() {
        self.checked = this.checked;
    };
  }
});

registerQmlType({
  module:   'QtQuick.Controls',
  name:     'TextArea',
  versions: /^[1-2]\./,
  constructor: function QMLTextArea(meta) {
    QMLItem.call(this, meta);

    var self = this;

    this.font = new QMLFont(this);

    this.dom.innerHTML = "<textarea></textarea>"
    this.dom.firstChild.style.pointerEvents = "auto";
    this.dom.firstChild.style.width = "100%";
    this.dom.firstChild.style.height = "100%";
    // In some browsers text-areas have a margin by default, which distorts
    // the positioning, so we need to manually set it to 0.
    this.dom.firstChild.style.margin = "0";

    createSimpleProperty("string", this, "text", "");

    this.Component.completed.connect(this, function() {
        this.implicitWidth = this.dom.firstChild.offsetWidth;
        this.implicitHeight = this.dom.firstChild.offsetHeight;
    });

    this.textChanged.connect(this, function(newVal) {
        this.dom.firstChild.value = newVal;
    });

    function updateValue(e) {
        if (self.text != self.dom.firstChild.value) {
            self.text = self.dom.firstChild.value;
        }
    }

    this.dom.firstChild.oninput = updateValue;
    this.dom.firstChild.onpropertychanged = updateValue;
  }
});

registerQmlType({
  module:   'QmlWeb',
  name:     'RestModel',
  versions: /.*/,
  constructor: function QMLRestModel(meta) {
    var self = this;
    var attributes = [];

    for (var key in meta.object) {
      if (meta.object.hasOwnProperty(key) &&
          typeof meta.object[key] != 'undefined' &&
          meta.object[key].__proto__.constructor.name == 'QMLPropertyDefinition') {
        attributes.push(key);
      }
    }

    QMLItem.call(this, meta);

    createSimpleProperty("string", this, "url");
    createSimpleProperty("bool",   this, "isLoading");
    createSimpleProperty("string", this, "mimeType");
    createSimpleProperty("string", this, "queryMimeType");

    this.mimeType      = "application/json";
    this.queryMimeType = "application/x-www-urlencoded";
    this.isLoading     = false;
    this.attributes    = attributes;

    this.fetched = Signal();
    this.saved   = Signal();

    this.runningRequests = 0;

    this.fetch = function() {
      ajax({
        method:   'GET',
        mimeType: self.mimetype,
        success: function(xhr) {
          xhrReadResponse(xhr);
          self.fetched();
        }
      });
    };

    this.create = function() {
      sendToServer('POST');
    };

    this.save = function() {
      sendToServer('PUT');
    };

    function sendToServer(method) {
      var body = generateBodyForPostQuery();

      ajax({
        method:   method,
        mimeType: self.queryMimeType,
        body:     body,
        success:  function(xhr) {
          xhrReadResponse(xhr);
          self.saved();
        }
      });
    }

    this.remove = function() {
      ajax({
        method: 'DELETE',
        success: function(xhr) {
          self.destroy();
        }
      });
    };

    function generateBodyForPostQuery() {
      var object     = {};
      var body;

      for (var i = 0 ; i < self.attributes.length ; ++i)
        object[self.attributes[i]] = self.$properties[self.attributes[i]].get();
      console.log(object);
      if (self.queryMimeType == 'application/json' || self.queryMimeType == 'text/json')
        body = JSON.stringify(object);
      else if (self.queryMimeType == 'application/x-www-urlencoded')
        body = objectToUrlEncoded(object);
      return body;
    }

    function myEncodeURIComponent(str) {
      return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
        return '%' + c.charCodeAt(0).toString(16);
      });
    }

    function objectToUrlEncoded(object, prefix) {
      var str = '';
      for (var key in object) {
        if (object.hasOwnProperty(key)) {
          var value = object[key];
          if (str != '')
            str += '&';
          if (typeof prefix != 'undefined')
            key  = prefix + '[' + key + ']';
          if (typeof value == 'object')
            str += objectToUrlEncoded(value, key);
          else
            str += myEncodeURIComponent(key) + '=' + myEncodeURIComponent(value);
        }
      }
      return str;
    }

    function ajax(options) {
      var xhr = new XMLHttpRequest();

      xhr.overrideMimeType(self.mimeType);
      xhr.onreadystatechange = function() {
        if (xhr.readyState == XMLHttpRequest.DONE) {
          if (xhr.status == 200)
            options.success(xhr);
          else
            options.failure(xhr);
          self.runningRequests -= 1;
          if (self.runningRequests <= 0)
            self.isLoading = false;
        }
      }
      xhr.open(options.method, self.url, true);
      if (typeof options.body != 'undefined') {
        xhr.setRequestHeader('Content-Type', self.queryMimeType);
        xhr.send(options.body);
      }
      else
        xhr.send(null);
      self.runningRequests += 1;
      self.isLoading = true;
    }

    function xhrReadResponse(xhr) {
      var responseObject;

      if (self.mimeType == 'application/json' || self.mimeType == 'text/json') {
        responseObject = JSON.parse(xhr.responseText);
      }
      updatePropertiesFromResponseObject(responseObject);
    }

    function updatePropertiesFromResponseObject(responseObject) {
      for (var key in responseObject) {
        if (responseObject.hasOwnProperty(key) && self.$hasProperty(key)) {
          self.$properties[key].set(responseObject[key]);
        }
      }
    }

    this.$hasProperty = function(name) {
      return (typeof self.$properties[name] != 'undefined');
    }
  }
});

}).bind(this)(typeof global != 'undefined' ? global : window);

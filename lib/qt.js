(function(global){
  // Polyfills
  Function.prototype.bind=(function(){}).bind||function(b){if(typeof this!=="function"){throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");}function c(){}var a=[].slice,f=a.call(arguments,1),e=this,d=function(){return e.apply(this instanceof c?this:b||window,f.concat(a.call(arguments)));};c.prototype=this.prototype;d.prototype=new c();return d;};

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
  https://github.com/mishoo/UglifyJS2

  -------------------------------- (C) ---------------------------------

                           Author: Mihai Bazon
                         <mihai.bazon@gmail.com>
                       http://mihai.bazon.net/blog

  Distributed under the BSD license:

    Copyright 2012 (c) Mihai Bazon <mihai.bazon@gmail.com>

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

"use strict";

function DEFNODE(type, props, methods, base) {
    if (arguments.length < 4) base = AST_Node;
    if (!props) props = [];
    else props = props.split(/\s+/);
    var self_props = props;
    if (base && base.PROPS)
        props = props.concat(base.PROPS);
    var code = "return function AST_" + type + "(props){ if (props) { ";
    for (var i = props.length; --i >= 0;) {
        code += "this." + props[i] + " = props." + props[i] + ";";
    }
    var proto = base && new base;
    if (proto && proto.initialize || (methods && methods.initialize))
        code += "this.initialize();";
    code += "}}";
    var ctor = new Function(code)();
    if (proto) {
        ctor.prototype = proto;
        ctor.BASE = base;
    }
    if (base) base.SUBCLASSES.push(ctor);
    ctor.prototype.CTOR = ctor;
    ctor.PROPS = props || null;
    ctor.SELF_PROPS = self_props;
    ctor.SUBCLASSES = [];
    if (type) {
        ctor.prototype.TYPE = ctor.TYPE = type;
    }
    if (methods) for (i in methods) if (methods.hasOwnProperty(i)) {
        if (/^\$/.test(i)) {
            ctor[i.substr(1)] = methods[i];
        } else {
            ctor.prototype[i] = methods[i];
        }
    }
    ctor.DEFMETHOD = function(name, method) {
        this.prototype[name] = method;
    };
    return ctor;
};

var AST_Token = DEFNODE("Token", "type value line col pos endline endcol endpos nlb comments_before file", {
}, null);

var AST_Node = DEFNODE("Node", "start end", {
    clone: function() {
        return new this.CTOR(this);
    },
    $documentation: "Base class of all AST nodes",
    $propdoc: {
        start: "[AST_Token] The first token of this node",
        end: "[AST_Token] The last token of this node"
    },
    _walk: function(visitor) {
        return visitor._visit(this);
    },
    walk: function(visitor) {
        return this._walk(visitor); // not sure the indirection will be any help
    }
}, null);

AST_Node.warn_function = null;
AST_Node.warn = function(txt, props) {
    if (AST_Node.warn_function)
        AST_Node.warn_function(string_template(txt, props));
};

/* -----[ statements ]----- */

var AST_Statement = DEFNODE("Statement", null, {
    $documentation: "Base class of all statements",
});

var AST_Debugger = DEFNODE("Debugger", null, {
    $documentation: "Represents a debugger statement",
}, AST_Statement);

var AST_Directive = DEFNODE("Directive", "value scope quote", {
    $documentation: "Represents a directive, like \"use strict\";",
    $propdoc: {
        value: "[string] The value of this directive as a plain string (it's not an AST_String!)",
        scope: "[AST_Scope/S] The scope that this directive affects",
        quote: "[string] the original quote character"
    },
}, AST_Statement);

var AST_SimpleStatement = DEFNODE("SimpleStatement", "body", {
    $documentation: "A statement consisting of an expression, i.e. a = 1 + 2",
    $propdoc: {
        body: "[AST_Node] an expression node (should not be instanceof AST_Statement)"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.body._walk(visitor);
        });
    }
}, AST_Statement);

function walk_body(node, visitor) {
    if (node.body instanceof AST_Statement) {
        node.body._walk(visitor);
    }
    else node.body.forEach(function(stat){
        stat._walk(visitor);
    });
};

var AST_Block = DEFNODE("Block", "body", {
    $documentation: "A body of statements (usually bracketed)",
    $propdoc: {
        body: "[AST_Statement*] an array of statements"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            walk_body(this, visitor);
        });
    }
}, AST_Statement);

var AST_BlockStatement = DEFNODE("BlockStatement", null, {
    $documentation: "A block statement",
}, AST_Block);

var AST_EmptyStatement = DEFNODE("EmptyStatement", null, {
    $documentation: "The empty statement (empty block or simply a semicolon)",
    _walk: function(visitor) {
        return visitor._visit(this);
    }
}, AST_Statement);

var AST_StatementWithBody = DEFNODE("StatementWithBody", "body", {
    $documentation: "Base class for all statements that contain one nested body: `For`, `ForIn`, `Do`, `While`, `With`",
    $propdoc: {
        body: "[AST_Statement] the body; this should always be present, even if it's an AST_EmptyStatement"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.body._walk(visitor);
        });
    }
}, AST_Statement);

var AST_LabeledStatement = DEFNODE("LabeledStatement", "label", {
    $documentation: "Statement with a label",
    $propdoc: {
        label: "[AST_Label] a label definition"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.label._walk(visitor);
            this.body._walk(visitor);
        });
    }
}, AST_StatementWithBody);

var AST_IterationStatement = DEFNODE("IterationStatement", null, {
    $documentation: "Internal class.  All loops inherit from it."
}, AST_StatementWithBody);

var AST_DWLoop = DEFNODE("DWLoop", "condition", {
    $documentation: "Base class for do/while statements",
    $propdoc: {
        condition: "[AST_Node] the loop condition.  Should not be instanceof AST_Statement"
    }
}, AST_IterationStatement);

var AST_Do = DEFNODE("Do", null, {
    $documentation: "A `do` statement",
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.body._walk(visitor);
            this.condition._walk(visitor);
        });
    }
}, AST_DWLoop);

var AST_While = DEFNODE("While", null, {
    $documentation: "A `while` statement",
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.condition._walk(visitor);
            this.body._walk(visitor);
        });
    }
}, AST_DWLoop);

var AST_For = DEFNODE("For", "init condition step", {
    $documentation: "A `for` statement",
    $propdoc: {
        init: "[AST_Node?] the `for` initialization code, or null if empty",
        condition: "[AST_Node?] the `for` termination clause, or null if empty",
        step: "[AST_Node?] the `for` update clause, or null if empty"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            if (this.init) this.init._walk(visitor);
            if (this.condition) this.condition._walk(visitor);
            if (this.step) this.step._walk(visitor);
            this.body._walk(visitor);
        });
    }
}, AST_IterationStatement);

var AST_ForIn = DEFNODE("ForIn", "init name object", {
    $documentation: "A `for ... in` statement",
    $propdoc: {
        init: "[AST_Node] the `for/in` initialization code",
        name: "[AST_SymbolRef?] the loop variable, only if `init` is AST_Var",
        object: "[AST_Node] the object that we're looping through"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.init._walk(visitor);
            this.object._walk(visitor);
            this.body._walk(visitor);
        });
    }
}, AST_IterationStatement);

var AST_With = DEFNODE("With", "expression", {
    $documentation: "A `with` statement",
    $propdoc: {
        expression: "[AST_Node] the `with` expression"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.expression._walk(visitor);
            this.body._walk(visitor);
        });
    }
}, AST_StatementWithBody);

/* -----[ scope and functions ]----- */

var AST_Scope = DEFNODE("Scope", "directives variables functions uses_with uses_eval parent_scope enclosed cname", {
    $documentation: "Base class for all statements introducing a lexical scope",
    $propdoc: {
        directives: "[string*/S] an array of directives declared in this scope",
        variables: "[Object/S] a map of name -> SymbolDef for all variables/functions defined in this scope",
        functions: "[Object/S] like `variables`, but only lists function declarations",
        uses_with: "[boolean/S] tells whether this scope uses the `with` statement",
        uses_eval: "[boolean/S] tells whether this scope contains a direct call to the global `eval`",
        parent_scope: "[AST_Scope?/S] link to the parent scope",
        enclosed: "[SymbolDef*/S] a list of all symbol definitions that are accessed from this scope or any subscopes",
        cname: "[integer/S] current index for mangling variables (used internally by the mangler)",
    },
}, AST_Block);

var AST_Toplevel = DEFNODE("Toplevel", "globals", {
    $documentation: "The toplevel scope",
    $propdoc: {
        globals: "[Object/S] a map of name -> SymbolDef for all undeclared names",
    },
    wrap_enclose: function(arg_parameter_pairs) {
        var self = this;
        var args = [];
        var parameters = [];

        arg_parameter_pairs.forEach(function(pair) {
            var splitAt = pair.lastIndexOf(":");

            args.push(pair.substr(0, splitAt));
            parameters.push(pair.substr(splitAt + 1));
        });

        var wrapped_tl = "(function(" + parameters.join(",") + "){ '$ORIG'; })(" + args.join(",") + ")";
        wrapped_tl = parse(wrapped_tl);
        wrapped_tl = wrapped_tl.transform(new TreeTransformer(function before(node){
            if (node instanceof AST_Directive && node.value == "$ORIG") {
                return MAP.splice(self.body);
            }
        }));
        return wrapped_tl;
    },
    wrap_commonjs: function(name, export_all) {
        var self = this;
        var to_export = [];
        if (export_all) {
            self.figure_out_scope();
            self.walk(new TreeWalker(function(node){
                if (node instanceof AST_SymbolDeclaration && node.definition().global) {
                    if (!find_if(function(n){ return n.name == node.name }, to_export))
                        to_export.push(node);
                }
            }));
        }
        var wrapped_tl = "(function(exports, global){ global['" + name + "'] = exports; '$ORIG'; '$EXPORTS'; }({}, (function(){return this}())))";
        wrapped_tl = parse(wrapped_tl);
        wrapped_tl = wrapped_tl.transform(new TreeTransformer(function before(node){
            if (node instanceof AST_SimpleStatement) {
                node = node.body;
                if (node instanceof AST_String) switch (node.getValue()) {
                  case "$ORIG":
                    return MAP.splice(self.body);
                  case "$EXPORTS":
                    var body = [];
                    to_export.forEach(function(sym){
                        body.push(new AST_SimpleStatement({
                            body: new AST_Assign({
                                left: new AST_Sub({
                                    expression: new AST_SymbolRef({ name: "exports" }),
                                    property: new AST_String({ value: sym.name }),
                                }),
                                operator: "=",
                                right: new AST_SymbolRef(sym),
                            }),
                        }));
                    });
                    return MAP.splice(body);
                }
            }
        }));
        return wrapped_tl;
    }
}, AST_Scope);

var AST_Lambda = DEFNODE("Lambda", "name argnames uses_arguments", {
    $documentation: "Base class for functions",
    $propdoc: {
        name: "[AST_SymbolDeclaration?] the name of this function",
        argnames: "[AST_SymbolFunarg*] array of function arguments",
        uses_arguments: "[boolean/S] tells whether this function accesses the arguments array"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            if (this.name) this.name._walk(visitor);
            this.argnames.forEach(function(arg){
                arg._walk(visitor);
            });
            walk_body(this, visitor);
        });
    }
}, AST_Scope);

var AST_Accessor = DEFNODE("Accessor", null, {
    $documentation: "A setter/getter function.  The `name` property is always null."
}, AST_Lambda);

var AST_Function = DEFNODE("Function", null, {
    $documentation: "A function expression"
}, AST_Lambda);

var AST_Defun = DEFNODE("Defun", null, {
    $documentation: "A function definition"
}, AST_Lambda);

/* -----[ JUMPS ]----- */

var AST_Jump = DEFNODE("Jump", null, {
    $documentation: "Base class for “jumps” (for now that's `return`, `throw`, `break` and `continue`)"
}, AST_Statement);

var AST_Exit = DEFNODE("Exit", "value", {
    $documentation: "Base class for “exits” (`return` and `throw`)",
    $propdoc: {
        value: "[AST_Node?] the value returned or thrown by this statement; could be null for AST_Return"
    },
    _walk: function(visitor) {
        return visitor._visit(this, this.value && function(){
            this.value._walk(visitor);
        });
    }
}, AST_Jump);

var AST_Return = DEFNODE("Return", null, {
    $documentation: "A `return` statement"
}, AST_Exit);

var AST_Throw = DEFNODE("Throw", null, {
    $documentation: "A `throw` statement"
}, AST_Exit);

var AST_LoopControl = DEFNODE("LoopControl", "label", {
    $documentation: "Base class for loop control statements (`break` and `continue`)",
    $propdoc: {
        label: "[AST_LabelRef?] the label, or null if none",
    },
    _walk: function(visitor) {
        return visitor._visit(this, this.label && function(){
            this.label._walk(visitor);
        });
    }
}, AST_Jump);

var AST_Break = DEFNODE("Break", null, {
    $documentation: "A `break` statement"
}, AST_LoopControl);

var AST_Continue = DEFNODE("Continue", null, {
    $documentation: "A `continue` statement"
}, AST_LoopControl);

/* -----[ IF ]----- */

var AST_If = DEFNODE("If", "condition alternative", {
    $documentation: "A `if` statement",
    $propdoc: {
        condition: "[AST_Node] the `if` condition",
        alternative: "[AST_Statement?] the `else` part, or null if not present"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.condition._walk(visitor);
            this.body._walk(visitor);
            if (this.alternative) this.alternative._walk(visitor);
        });
    }
}, AST_StatementWithBody);

/* -----[ SWITCH ]----- */

var AST_Switch = DEFNODE("Switch", "expression", {
    $documentation: "A `switch` statement",
    $propdoc: {
        expression: "[AST_Node] the `switch` “discriminant”"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.expression._walk(visitor);
            walk_body(this, visitor);
        });
    }
}, AST_Block);

var AST_SwitchBranch = DEFNODE("SwitchBranch", null, {
    $documentation: "Base class for `switch` branches",
}, AST_Block);

var AST_Default = DEFNODE("Default", null, {
    $documentation: "A `default` switch branch",
}, AST_SwitchBranch);

var AST_Case = DEFNODE("Case", "expression", {
    $documentation: "A `case` switch branch",
    $propdoc: {
        expression: "[AST_Node] the `case` expression"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.expression._walk(visitor);
            walk_body(this, visitor);
        });
    }
}, AST_SwitchBranch);

/* -----[ EXCEPTIONS ]----- */

var AST_Try = DEFNODE("Try", "bcatch bfinally", {
    $documentation: "A `try` statement",
    $propdoc: {
        bcatch: "[AST_Catch?] the catch block, or null if not present",
        bfinally: "[AST_Finally?] the finally block, or null if not present"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            walk_body(this, visitor);
            if (this.bcatch) this.bcatch._walk(visitor);
            if (this.bfinally) this.bfinally._walk(visitor);
        });
    }
}, AST_Block);

var AST_Catch = DEFNODE("Catch", "argname", {
    $documentation: "A `catch` node; only makes sense as part of a `try` statement",
    $propdoc: {
        argname: "[AST_SymbolCatch] symbol for the exception"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.argname._walk(visitor);
            walk_body(this, visitor);
        });
    }
}, AST_Block);

var AST_Finally = DEFNODE("Finally", null, {
    $documentation: "A `finally` node; only makes sense as part of a `try` statement"
}, AST_Block);

/* -----[ VAR/CONST ]----- */

var AST_Definitions = DEFNODE("Definitions", "definitions", {
    $documentation: "Base class for `var` or `const` nodes (variable declarations/initializations)",
    $propdoc: {
        definitions: "[AST_VarDef*] array of variable definitions"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.definitions.forEach(function(def){
                def._walk(visitor);
            });
        });
    }
}, AST_Statement);

var AST_Var = DEFNODE("Var", null, {
    $documentation: "A `var` statement"
}, AST_Definitions);

var AST_Const = DEFNODE("Const", null, {
    $documentation: "A `const` statement"
}, AST_Definitions);

var AST_VarDef = DEFNODE("VarDef", "name value", {
    $documentation: "A variable declaration; only appears in a AST_Definitions node",
    $propdoc: {
        name: "[AST_SymbolVar|AST_SymbolConst] name of the variable",
        value: "[AST_Node?] initializer, or null of there's no initializer"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.name._walk(visitor);
            if (this.value) this.value._walk(visitor);
        });
    }
});

/* -----[ OTHER ]----- */

var AST_Call = DEFNODE("Call", "expression args", {
    $documentation: "A function call expression",
    $propdoc: {
        expression: "[AST_Node] expression to invoke as function",
        args: "[AST_Node*] array of arguments"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.expression._walk(visitor);
            this.args.forEach(function(arg){
                arg._walk(visitor);
            });
        });
    }
});

var AST_New = DEFNODE("New", null, {
    $documentation: "An object instantiation.  Derives from a function call since it has exactly the same properties"
}, AST_Call);

var AST_Seq = DEFNODE("Seq", "car cdr", {
    $documentation: "A sequence expression (two comma-separated expressions)",
    $propdoc: {
        car: "[AST_Node] first element in sequence",
        cdr: "[AST_Node] second element in sequence"
    },
    $cons: function(x, y) {
        var seq = new AST_Seq(x);
        seq.car = x;
        seq.cdr = y;
        return seq;
    },
    $from_array: function(array) {
        if (array.length == 0) return null;
        if (array.length == 1) return array[0].clone();
        var list = null;
        for (var i = array.length; --i >= 0;) {
            list = AST_Seq.cons(array[i], list);
        }
        var p = list;
        while (p) {
            if (p.cdr && !p.cdr.cdr) {
                p.cdr = p.cdr.car;
                break;
            }
            p = p.cdr;
        }
        return list;
    },
    to_array: function() {
        var p = this, a = [];
        while (p) {
            a.push(p.car);
            if (p.cdr && !(p.cdr instanceof AST_Seq)) {
                a.push(p.cdr);
                break;
            }
            p = p.cdr;
        }
        return a;
    },
    add: function(node) {
        var p = this;
        while (p) {
            if (!(p.cdr instanceof AST_Seq)) {
                var cell = AST_Seq.cons(p.cdr, node);
                return p.cdr = cell;
            }
            p = p.cdr;
        }
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.car._walk(visitor);
            if (this.cdr) this.cdr._walk(visitor);
        });
    }
});

var AST_PropAccess = DEFNODE("PropAccess", "expression property", {
    $documentation: "Base class for property access expressions, i.e. `a.foo` or `a[\"foo\"]`",
    $propdoc: {
        expression: "[AST_Node] the “container” expression",
        property: "[AST_Node|string] the property to access.  For AST_Dot this is always a plain string, while for AST_Sub it's an arbitrary AST_Node"
    }
});

var AST_Dot = DEFNODE("Dot", null, {
    $documentation: "A dotted property access expression",
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.expression._walk(visitor);
        });
    }
}, AST_PropAccess);

var AST_Sub = DEFNODE("Sub", null, {
    $documentation: "Index-style property access, i.e. `a[\"foo\"]`",
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.expression._walk(visitor);
            this.property._walk(visitor);
        });
    }
}, AST_PropAccess);

var AST_Unary = DEFNODE("Unary", "operator expression", {
    $documentation: "Base class for unary expressions",
    $propdoc: {
        operator: "[string] the operator",
        expression: "[AST_Node] expression that this unary operator applies to"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.expression._walk(visitor);
        });
    }
});

var AST_UnaryPrefix = DEFNODE("UnaryPrefix", null, {
    $documentation: "Unary prefix expression, i.e. `typeof i` or `++i`"
}, AST_Unary);

var AST_UnaryPostfix = DEFNODE("UnaryPostfix", null, {
    $documentation: "Unary postfix expression, i.e. `i++`"
}, AST_Unary);

var AST_Binary = DEFNODE("Binary", "left operator right", {
    $documentation: "Binary expression, i.e. `a + b`",
    $propdoc: {
        left: "[AST_Node] left-hand side expression",
        operator: "[string] the operator",
        right: "[AST_Node] right-hand side expression"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.left._walk(visitor);
            this.right._walk(visitor);
        });
    }
});

var AST_Conditional = DEFNODE("Conditional", "condition consequent alternative", {
    $documentation: "Conditional expression using the ternary operator, i.e. `a ? b : c`",
    $propdoc: {
        condition: "[AST_Node]",
        consequent: "[AST_Node]",
        alternative: "[AST_Node]"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.condition._walk(visitor);
            this.consequent._walk(visitor);
            this.alternative._walk(visitor);
        });
    }
});

var AST_Assign = DEFNODE("Assign", null, {
    $documentation: "An assignment expression — `a = b + 5`",
}, AST_Binary);

/* -----[ LITERALS ]----- */

var AST_Array = DEFNODE("Array", "elements", {
    $documentation: "An array literal",
    $propdoc: {
        elements: "[AST_Node*] array of elements"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.elements.forEach(function(el){
                el._walk(visitor);
            });
        });
    }
});

var AST_Object = DEFNODE("Object", "properties", {
    $documentation: "An object literal",
    $propdoc: {
        properties: "[AST_ObjectProperty*] array of properties"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.properties.forEach(function(prop){
                prop._walk(visitor);
            });
        });
    }
});

var AST_ObjectProperty = DEFNODE("ObjectProperty", "key value", {
    $documentation: "Base class for literal object properties",
    $propdoc: {
        key: "[string] the property name converted to a string for ObjectKeyVal.  For setters and getters this is an arbitrary AST_Node.",
        value: "[AST_Node] property value.  For setters and getters this is an AST_Function."
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.value._walk(visitor);
        });
    }
});

var AST_ObjectKeyVal = DEFNODE("ObjectKeyVal", "quote", {
    $documentation: "A key: value object property",
    $propdoc: {
        quote: "[string] the original quote character"
    }
}, AST_ObjectProperty);

var AST_ObjectSetter = DEFNODE("ObjectSetter", null, {
    $documentation: "An object setter property",
}, AST_ObjectProperty);

var AST_ObjectGetter = DEFNODE("ObjectGetter", null, {
    $documentation: "An object getter property",
}, AST_ObjectProperty);

var AST_Symbol = DEFNODE("Symbol", "scope name thedef", {
    $propdoc: {
        name: "[string] name of this symbol",
        scope: "[AST_Scope/S] the current scope (not necessarily the definition scope)",
        thedef: "[SymbolDef/S] the definition of this symbol"
    },
    $documentation: "Base class for all symbols",
});

var AST_SymbolAccessor = DEFNODE("SymbolAccessor", null, {
    $documentation: "The name of a property accessor (setter/getter function)"
}, AST_Symbol);

var AST_SymbolDeclaration = DEFNODE("SymbolDeclaration", "init", {
    $documentation: "A declaration symbol (symbol in var/const, function name or argument, symbol in catch)",
    $propdoc: {
        init: "[AST_Node*/S] array of initializers for this declaration."
    }
}, AST_Symbol);

var AST_SymbolVar = DEFNODE("SymbolVar", null, {
    $documentation: "Symbol defining a variable",
}, AST_SymbolDeclaration);

var AST_SymbolConst = DEFNODE("SymbolConst", null, {
    $documentation: "A constant declaration"
}, AST_SymbolDeclaration);

var AST_SymbolFunarg = DEFNODE("SymbolFunarg", null, {
    $documentation: "Symbol naming a function argument",
}, AST_SymbolVar);

var AST_SymbolDefun = DEFNODE("SymbolDefun", null, {
    $documentation: "Symbol defining a function",
}, AST_SymbolDeclaration);

var AST_SymbolLambda = DEFNODE("SymbolLambda", null, {
    $documentation: "Symbol naming a function expression",
}, AST_SymbolDeclaration);

var AST_SymbolCatch = DEFNODE("SymbolCatch", null, {
    $documentation: "Symbol naming the exception in catch",
}, AST_SymbolDeclaration);

var AST_Label = DEFNODE("Label", "references", {
    $documentation: "Symbol naming a label (declaration)",
    $propdoc: {
        references: "[AST_LoopControl*] a list of nodes referring to this label"
    },
    initialize: function() {
        this.references = [];
        this.thedef = this;
    }
}, AST_Symbol);

var AST_SymbolRef = DEFNODE("SymbolRef", null, {
    $documentation: "Reference to some symbol (not definition/declaration)",
}, AST_Symbol);

var AST_LabelRef = DEFNODE("LabelRef", null, {
    $documentation: "Reference to a label symbol",
}, AST_Symbol);

var AST_This = DEFNODE("This", null, {
    $documentation: "The `this` symbol",
}, AST_Symbol);

var AST_Constant = DEFNODE("Constant", null, {
    $documentation: "Base class for all constants",
    getValue: function() {
        return this.value;
    }
});

var AST_String = DEFNODE("String", "value quote", {
    $documentation: "A string literal",
    $propdoc: {
        value: "[string] the contents of this string",
        quote: "[string] the original quote character"
    }
}, AST_Constant);

var AST_Number = DEFNODE("Number", "value", {
    $documentation: "A number literal",
    $propdoc: {
        value: "[number] the numeric value"
    }
}, AST_Constant);

var AST_RegExp = DEFNODE("RegExp", "value", {
    $documentation: "A regexp literal",
    $propdoc: {
        value: "[RegExp] the actual regexp"
    }
}, AST_Constant);

var AST_Atom = DEFNODE("Atom", null, {
    $documentation: "Base class for atoms",
}, AST_Constant);

var AST_Null = DEFNODE("Null", null, {
    $documentation: "The `null` atom",
    value: null
}, AST_Atom);

var AST_NaN = DEFNODE("NaN", null, {
    $documentation: "The impossible value",
    value: 0/0
}, AST_Atom);

var AST_Undefined = DEFNODE("Undefined", null, {
    $documentation: "The `undefined` value",
    value: (function(){}())
}, AST_Atom);

var AST_Hole = DEFNODE("Hole", null, {
    $documentation: "A hole in an array",
    value: (function(){}())
}, AST_Atom);

var AST_Infinity = DEFNODE("Infinity", null, {
    $documentation: "The `Infinity` value",
    value: 1/0
}, AST_Atom);

var AST_Boolean = DEFNODE("Boolean", null, {
    $documentation: "Base class for booleans",
}, AST_Atom);

var AST_False = DEFNODE("False", null, {
    $documentation: "The `false` atom",
    value: false
}, AST_Boolean);

var AST_True = DEFNODE("True", null, {
    $documentation: "The `true` atom",
    value: true
}, AST_Boolean);

/* -----[ TreeWalker ]----- */

function TreeWalker(callback) {
    this.visit = callback;
    this.stack = [];
};
TreeWalker.prototype = {
    _visit: function(node, descend) {
        this.stack.push(node);
        var ret = this.visit(node, descend ? function(){
            descend.call(node);
        } : noop);
        if (!ret && descend) {
            descend.call(node);
        }
        this.stack.pop();
        return ret;
    },
    parent: function(n) {
        return this.stack[this.stack.length - 2 - (n || 0)];
    },
    push: function (node) {
        this.stack.push(node);
    },
    pop: function() {
        return this.stack.pop();
    },
    self: function() {
        return this.stack[this.stack.length - 1];
    },
    find_parent: function(type) {
        var stack = this.stack;
        for (var i = stack.length; --i >= 0;) {
            var x = stack[i];
            if (x instanceof type) return x;
        }
    },
    has_directive: function(type) {
        return this.find_parent(AST_Scope).has_directive(type);
    },
    in_boolean_context: function() {
        var stack = this.stack;
        var i = stack.length, self = stack[--i];
        while (i > 0) {
            var p = stack[--i];
            if ((p instanceof AST_If           && p.condition === self) ||
                (p instanceof AST_Conditional  && p.condition === self) ||
                (p instanceof AST_DWLoop       && p.condition === self) ||
                (p instanceof AST_For          && p.condition === self) ||
                (p instanceof AST_UnaryPrefix  && p.operator == "!" && p.expression === self))
            {
                return true;
            }
            if (!(p instanceof AST_Binary && (p.operator == "&&" || p.operator == "||")))
                return false;
            self = p;
        }
    },
    loopcontrol_target: function(label) {
        var stack = this.stack;
        if (label) for (var i = stack.length; --i >= 0;) {
            var x = stack[i];
            if (x instanceof AST_LabeledStatement && x.label.name == label.name) {
                return x.body;
            }
        } else for (var i = stack.length; --i >= 0;) {
            var x = stack[i];
            if (x instanceof AST_Switch || x instanceof AST_IterationStatement)
                return x;
        }
    }
};

/***********************************************************************

  A JavaScript tokenizer / parser / beautifier / compressor.
  https://github.com/mishoo/UglifyJS2

  -------------------------------- (C) ---------------------------------

                           Author: Mihai Bazon
                         <mihai.bazon@gmail.com>
                       http://mihai.bazon.net/blog

  Distributed under the BSD license:

    Copyright 2012 (c) Mihai Bazon <mihai.bazon@gmail.com>
    Parser based on parse-js (http://marijn.haverbeke.nl/parse-js/).

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

"use strict";

var KEYWORDS = 'break case catch const continue debugger default delete do else finally for function if in instanceof new return switch throw try typeof var void while with';
var KEYWORDS_ATOM = 'false null true';
var RESERVED_WORDS = 'abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized this throws transient volatile yield'
    + " " + KEYWORDS_ATOM + " " + KEYWORDS;
var KEYWORDS_BEFORE_EXPRESSION = 'return new delete throw else case';

KEYWORDS = makePredicate(KEYWORDS);
RESERVED_WORDS = makePredicate(RESERVED_WORDS);
KEYWORDS_BEFORE_EXPRESSION = makePredicate(KEYWORDS_BEFORE_EXPRESSION);
KEYWORDS_ATOM = makePredicate(KEYWORDS_ATOM);

var OPERATOR_CHARS = makePredicate(characters("+-*&%=<>!?|~^"));

var RE_HEX_NUMBER = /^0x[0-9a-f]+$/i;
var RE_OCT_NUMBER = /^0[0-7]+$/;
var RE_DEC_NUMBER = /^\d*\.?\d*(?:e[+-]?\d*(?:\d\.?|\.?\d)\d*)?$/i;

var OPERATORS = makePredicate([
    "in",
    "instanceof",
    "typeof",
    "new",
    "void",
    "delete",
    "++",
    "--",
    "+",
    "-",
    "!",
    "~",
    "&",
    "|",
    "^",
    "*",
    "/",
    "%",
    ">>",
    "<<",
    ">>>",
    "<",
    ">",
    "<=",
    ">=",
    "==",
    "===",
    "!=",
    "!==",
    "?",
    "=",
    "+=",
    "-=",
    "/=",
    "*=",
    "%=",
    ">>=",
    "<<=",
    ">>>=",
    "|=",
    "^=",
    "&=",
    "&&",
    "||"
]);

var WHITESPACE_CHARS = makePredicate(characters(" \u00a0\n\r\t\f\u000b\u200b\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\uFEFF"));

var PUNC_BEFORE_EXPRESSION = makePredicate(characters("[{(,.;:"));

var PUNC_CHARS = makePredicate(characters("[]{}(),;:"));

var REGEXP_MODIFIERS = makePredicate(characters("gmsiy"));

/* -----[ Tokenizer ]----- */

// regexps adapted from http://xregexp.com/plugins/#unicode
var UNICODE = {
    letter: new RegExp("[\\u0041-\\u005A\\u0061-\\u007A\\u00AA\\u00B5\\u00BA\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02C1\\u02C6-\\u02D1\\u02E0-\\u02E4\\u02EC\\u02EE\\u0370-\\u0374\\u0376\\u0377\\u037A-\\u037D\\u037F\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03F5\\u03F7-\\u0481\\u048A-\\u052F\\u0531-\\u0556\\u0559\\u0561-\\u0587\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0620-\\u064A\\u066E\\u066F\\u0671-\\u06D3\\u06D5\\u06E5\\u06E6\\u06EE\\u06EF\\u06FA-\\u06FC\\u06FF\\u0710\\u0712-\\u072F\\u074D-\\u07A5\\u07B1\\u07CA-\\u07EA\\u07F4\\u07F5\\u07FA\\u0800-\\u0815\\u081A\\u0824\\u0828\\u0840-\\u0858\\u08A0-\\u08B2\\u0904-\\u0939\\u093D\\u0950\\u0958-\\u0961\\u0971-\\u0980\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BD\\u09CE\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AD0\\u0AE0\\u0AE1\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B35-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B71\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB9\\u0BD0\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C39\\u0C3D\\u0C58\\u0C59\\u0C60\\u0C61\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBD\\u0CDE\\u0CE0\\u0CE1\\u0CF1\\u0CF2\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D3A\\u0D3D\\u0D4E\\u0D60\\u0D61\\u0D7A-\\u0D7F\\u0D85-\\u0D96\\u0D9A-\\u0DB1\\u0DB3-\\u0DBB\\u0DBD\\u0DC0-\\u0DC6\\u0E01-\\u0E30\\u0E32\\u0E33\\u0E40-\\u0E46\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD-\\u0EB0\\u0EB2\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EDC-\\u0EDF\\u0F00\\u0F40-\\u0F47\\u0F49-\\u0F6C\\u0F88-\\u0F8C\\u1000-\\u102A\\u103F\\u1050-\\u1055\\u105A-\\u105D\\u1061\\u1065\\u1066\\u106E-\\u1070\\u1075-\\u1081\\u108E\\u10A0-\\u10C5\\u10C7\\u10CD\\u10D0-\\u10FA\\u10FC-\\u1248\\u124A-\\u124D\\u1250-\\u1256\\u1258\\u125A-\\u125D\\u1260-\\u1288\\u128A-\\u128D\\u1290-\\u12B0\\u12B2-\\u12B5\\u12B8-\\u12BE\\u12C0\\u12C2-\\u12C5\\u12C8-\\u12D6\\u12D8-\\u1310\\u1312-\\u1315\\u1318-\\u135A\\u1380-\\u138F\\u13A0-\\u13F4\\u1401-\\u166C\\u166F-\\u167F\\u1681-\\u169A\\u16A0-\\u16EA\\u16EE-\\u16F8\\u1700-\\u170C\\u170E-\\u1711\\u1720-\\u1731\\u1740-\\u1751\\u1760-\\u176C\\u176E-\\u1770\\u1780-\\u17B3\\u17D7\\u17DC\\u1820-\\u1877\\u1880-\\u18A8\\u18AA\\u18B0-\\u18F5\\u1900-\\u191E\\u1950-\\u196D\\u1970-\\u1974\\u1980-\\u19AB\\u19C1-\\u19C7\\u1A00-\\u1A16\\u1A20-\\u1A54\\u1AA7\\u1B05-\\u1B33\\u1B45-\\u1B4B\\u1B83-\\u1BA0\\u1BAE\\u1BAF\\u1BBA-\\u1BE5\\u1C00-\\u1C23\\u1C4D-\\u1C4F\\u1C5A-\\u1C7D\\u1CE9-\\u1CEC\\u1CEE-\\u1CF1\\u1CF5\\u1CF6\\u1D00-\\u1DBF\\u1E00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u2071\\u207F\\u2090-\\u209C\\u2102\\u2107\\u210A-\\u2113\\u2115\\u2119-\\u211D\\u2124\\u2126\\u2128\\u212A-\\u212D\\u212F-\\u2139\\u213C-\\u213F\\u2145-\\u2149\\u214E\\u2160-\\u2188\\u2C00-\\u2C2E\\u2C30-\\u2C5E\\u2C60-\\u2CE4\\u2CEB-\\u2CEE\\u2CF2\\u2CF3\\u2D00-\\u2D25\\u2D27\\u2D2D\\u2D30-\\u2D67\\u2D6F\\u2D80-\\u2D96\\u2DA0-\\u2DA6\\u2DA8-\\u2DAE\\u2DB0-\\u2DB6\\u2DB8-\\u2DBE\\u2DC0-\\u2DC6\\u2DC8-\\u2DCE\\u2DD0-\\u2DD6\\u2DD8-\\u2DDE\\u2E2F\\u3005-\\u3007\\u3021-\\u3029\\u3031-\\u3035\\u3038-\\u303C\\u3041-\\u3096\\u309D-\\u309F\\u30A1-\\u30FA\\u30FC-\\u30FF\\u3105-\\u312D\\u3131-\\u318E\\u31A0-\\u31BA\\u31F0-\\u31FF\\u3400-\\u4DB5\\u4E00-\\u9FCC\\uA000-\\uA48C\\uA4D0-\\uA4FD\\uA500-\\uA60C\\uA610-\\uA61F\\uA62A\\uA62B\\uA640-\\uA66E\\uA67F-\\uA69D\\uA6A0-\\uA6EF\\uA717-\\uA71F\\uA722-\\uA788\\uA78B-\\uA78E\\uA790-\\uA7AD\\uA7B0\\uA7B1\\uA7F7-\\uA801\\uA803-\\uA805\\uA807-\\uA80A\\uA80C-\\uA822\\uA840-\\uA873\\uA882-\\uA8B3\\uA8F2-\\uA8F7\\uA8FB\\uA90A-\\uA925\\uA930-\\uA946\\uA960-\\uA97C\\uA984-\\uA9B2\\uA9CF\\uA9E0-\\uA9E4\\uA9E6-\\uA9EF\\uA9FA-\\uA9FE\\uAA00-\\uAA28\\uAA40-\\uAA42\\uAA44-\\uAA4B\\uAA60-\\uAA76\\uAA7A\\uAA7E-\\uAAAF\\uAAB1\\uAAB5\\uAAB6\\uAAB9-\\uAABD\\uAAC0\\uAAC2\\uAADB-\\uAADD\\uAAE0-\\uAAEA\\uAAF2-\\uAAF4\\uAB01-\\uAB06\\uAB09-\\uAB0E\\uAB11-\\uAB16\\uAB20-\\uAB26\\uAB28-\\uAB2E\\uAB30-\\uAB5A\\uAB5C-\\uAB5F\\uAB64\\uAB65\\uABC0-\\uABE2\\uAC00-\\uD7A3\\uD7B0-\\uD7C6\\uD7CB-\\uD7FB\\uF900-\\uFA6D\\uFA70-\\uFAD9\\uFB00-\\uFB06\\uFB13-\\uFB17\\uFB1D\\uFB1F-\\uFB28\\uFB2A-\\uFB36\\uFB38-\\uFB3C\\uFB3E\\uFB40\\uFB41\\uFB43\\uFB44\\uFB46-\\uFBB1\\uFBD3-\\uFD3D\\uFD50-\\uFD8F\\uFD92-\\uFDC7\\uFDF0-\\uFDFB\\uFE70-\\uFE74\\uFE76-\\uFEFC\\uFF21-\\uFF3A\\uFF41-\\uFF5A\\uFF66-\\uFFBE\\uFFC2-\\uFFC7\\uFFCA-\\uFFCF\\uFFD2-\\uFFD7\\uFFDA-\\uFFDC]"),
    digit: new RegExp("[\\u0030-\\u0039\\u0660-\\u0669\\u06F0-\\u06F9\\u07C0-\\u07C9\\u0966-\\u096F\\u09E6-\\u09EF\\u0A66-\\u0A6F\\u0AE6-\\u0AEF\\u0B66-\\u0B6F\\u0BE6-\\u0BEF\\u0C66-\\u0C6F\\u0CE6-\\u0CEF\\u0D66-\\u0D6F\\u0DE6-\\u0DEF\\u0E50-\\u0E59\\u0ED0-\\u0ED9\\u0F20-\\u0F29\\u1040-\\u1049\\u1090-\\u1099\\u17E0-\\u17E9\\u1810-\\u1819\\u1946-\\u194F\\u19D0-\\u19D9\\u1A80-\\u1A89\\u1A90-\\u1A99\\u1B50-\\u1B59\\u1BB0-\\u1BB9\\u1C40-\\u1C49\\u1C50-\\u1C59\\uA620-\\uA629\\uA8D0-\\uA8D9\\uA900-\\uA909\\uA9D0-\\uA9D9\\uA9F0-\\uA9F9\\uAA50-\\uAA59\\uABF0-\\uABF9\\uFF10-\\uFF19]"),
    non_spacing_mark: new RegExp("[\\u0300-\\u036F\\u0483-\\u0487\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0610-\\u061A\\u064B-\\u065E\\u0670\\u06D6-\\u06DC\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0900-\\u0902\\u093C\\u0941-\\u0948\\u094D\\u0951-\\u0955\\u0962\\u0963\\u0981\\u09BC\\u09C1-\\u09C4\\u09CD\\u09E2\\u09E3\\u0A01\\u0A02\\u0A3C\\u0A41\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81\\u0A82\\u0ABC\\u0AC1-\\u0AC5\\u0AC7\\u0AC8\\u0ACD\\u0AE2\\u0AE3\\u0B01\\u0B3C\\u0B3F\\u0B41-\\u0B44\\u0B4D\\u0B56\\u0B62\\u0B63\\u0B82\\u0BC0\\u0BCD\\u0C3E-\\u0C40\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0CBC\\u0CBF\\u0CC6\\u0CCC\\u0CCD\\u0CE2\\u0CE3\\u0D41-\\u0D44\\u0D4D\\u0D62\\u0D63\\u0DCA\\u0DD2-\\u0DD4\\u0DD6\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EB9\\u0EBB\\u0EBC\\u0EC8-\\u0ECD\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F71-\\u0F7E\\u0F80-\\u0F84\\u0F86\\u0F87\\u0F90-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102D-\\u1030\\u1032-\\u1037\\u1039\\u103A\\u103D\\u103E\\u1058\\u1059\\u105E-\\u1060\\u1071-\\u1074\\u1082\\u1085\\u1086\\u108D\\u109D\\u135F\\u1712-\\u1714\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B7-\\u17BD\\u17C6\\u17C9-\\u17D3\\u17DD\\u180B-\\u180D\\u18A9\\u1920-\\u1922\\u1927\\u1928\\u1932\\u1939-\\u193B\\u1A17\\u1A18\\u1A56\\u1A58-\\u1A5E\\u1A60\\u1A62\\u1A65-\\u1A6C\\u1A73-\\u1A7C\\u1A7F\\u1B00-\\u1B03\\u1B34\\u1B36-\\u1B3A\\u1B3C\\u1B42\\u1B6B-\\u1B73\\u1B80\\u1B81\\u1BA2-\\u1BA5\\u1BA8\\u1BA9\\u1C2C-\\u1C33\\u1C36\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE0\\u1CE2-\\u1CE8\\u1CED\\u1DC0-\\u1DE6\\u1DFD-\\u1DFF\\u20D0-\\u20DC\\u20E1\\u20E5-\\u20F0\\u2CEF-\\u2CF1\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F\\uA67C\\uA67D\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA825\\uA826\\uA8C4\\uA8E0-\\uA8F1\\uA926-\\uA92D\\uA947-\\uA951\\uA980-\\uA982\\uA9B3\\uA9B6-\\uA9B9\\uA9BC\\uAA29-\\uAA2E\\uAA31\\uAA32\\uAA35\\uAA36\\uAA43\\uAA4C\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uABE5\\uABE8\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE26]"),
    space_combining_mark: new RegExp("[\\u0903\\u093E-\\u0940\\u0949-\\u094C\\u094E\\u0982\\u0983\\u09BE-\\u09C0\\u09C7\\u09C8\\u09CB\\u09CC\\u09D7\\u0A03\\u0A3E-\\u0A40\\u0A83\\u0ABE-\\u0AC0\\u0AC9\\u0ACB\\u0ACC\\u0B02\\u0B03\\u0B3E\\u0B40\\u0B47\\u0B48\\u0B4B\\u0B4C\\u0B57\\u0BBE\\u0BBF\\u0BC1\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCC\\u0BD7\\u0C01-\\u0C03\\u0C41-\\u0C44\\u0C82\\u0C83\\u0CBE\\u0CC0-\\u0CC4\\u0CC7\\u0CC8\\u0CCA\\u0CCB\\u0CD5\\u0CD6\\u0D02\\u0D03\\u0D3E-\\u0D40\\u0D46-\\u0D48\\u0D4A-\\u0D4C\\u0D57\\u0D82\\u0D83\\u0DCF-\\u0DD1\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0F3E\\u0F3F\\u0F7F\\u102B\\u102C\\u1031\\u1038\\u103B\\u103C\\u1056\\u1057\\u1062-\\u1064\\u1067-\\u106D\\u1083\\u1084\\u1087-\\u108C\\u108F\\u109A-\\u109C\\u17B6\\u17BE-\\u17C5\\u17C7\\u17C8\\u1923-\\u1926\\u1929-\\u192B\\u1930\\u1931\\u1933-\\u1938\\u19B0-\\u19C0\\u19C8\\u19C9\\u1A19-\\u1A1B\\u1A55\\u1A57\\u1A61\\u1A63\\u1A64\\u1A6D-\\u1A72\\u1B04\\u1B35\\u1B3B\\u1B3D-\\u1B41\\u1B43\\u1B44\\u1B82\\u1BA1\\u1BA6\\u1BA7\\u1BAA\\u1C24-\\u1C2B\\u1C34\\u1C35\\u1CE1\\u1CF2\\uA823\\uA824\\uA827\\uA880\\uA881\\uA8B4-\\uA8C3\\uA952\\uA953\\uA983\\uA9B4\\uA9B5\\uA9BA\\uA9BB\\uA9BD-\\uA9C0\\uAA2F\\uAA30\\uAA33\\uAA34\\uAA4D\\uAA7B\\uABE3\\uABE4\\uABE6\\uABE7\\uABE9\\uABEA\\uABEC]"),
    connector_punctuation: new RegExp("[\\u005F\\u203F\\u2040\\u2054\\uFE33\\uFE34\\uFE4D-\\uFE4F\\uFF3F]")
};

function is_letter(code) {
    return (code >= 97 && code <= 122)
        || (code >= 65 && code <= 90)
        || (code >= 0xaa && UNICODE.letter.test(String.fromCharCode(code)));
};

function is_digit(code) {
    return code >= 48 && code <= 57;
};

function is_alphanumeric_char(code) {
    return is_digit(code) || is_letter(code);
};

function is_unicode_digit(code) {
    return UNICODE.digit.test(String.fromCharCode(code));
}

function is_unicode_combining_mark(ch) {
    return UNICODE.non_spacing_mark.test(ch) || UNICODE.space_combining_mark.test(ch);
};

function is_unicode_connector_punctuation(ch) {
    return UNICODE.connector_punctuation.test(ch);
};

function is_identifier(name) {
    return !RESERVED_WORDS(name) && /^[a-z_$][a-z0-9_$]*$/i.test(name);
};

function is_identifier_start(code) {
    return code == 36 || code == 95 || is_letter(code);
};

function is_identifier_char(ch) {
    var code = ch.charCodeAt(0);
    return is_identifier_start(code)
        || is_digit(code)
        || code == 8204 // \u200c: zero-width non-joiner <ZWNJ>
        || code == 8205 // \u200d: zero-width joiner <ZWJ> (in my ECMA-262 PDF, this is also 200c)
        || is_unicode_combining_mark(ch)
        || is_unicode_connector_punctuation(ch)
        || is_unicode_digit(code)
    ;
};

function is_identifier_string(str){
    return /^[a-z_$][a-z0-9_$]*$/i.test(str);
};

function parse_js_number(num) {
    if (RE_HEX_NUMBER.test(num)) {
        return parseInt(num.substr(2), 16);
    } else if (RE_OCT_NUMBER.test(num)) {
        return parseInt(num.substr(1), 8);
    } else if (RE_DEC_NUMBER.test(num)) {
        return parseFloat(num);
    }
};

function JS_Parse_Error(message, filename, line, col, pos) {
    this.message = message;
    this.filename = filename;
    this.line = line;
    this.col = col;
    this.pos = pos;
    this.stack = new Error().stack;
};

JS_Parse_Error.prototype.toString = function() {
    return this.message + " (line: " + this.line + ", col: " + this.col + ", pos: " + this.pos + ")" + "\n\n" + this.stack;
};

function js_error(message, filename, line, col, pos) {
    throw new JS_Parse_Error(message, filename, line, col, pos);
};

function is_token(token, type, val) {
    return token.type == type && (val == null || token.value == val);
};

var EX_EOF = {};

function tokenizer($TEXT, filename, html5_comments) {

    var S = {
        text            : $TEXT,
        filename        : filename,
        pos             : 0,
        tokpos          : 0,
        line            : 1,
        tokline         : 0,
        col             : 0,
        tokcol          : 0,
        newline_before  : false,
        regex_allowed   : false,
        comments_before : []
    };

    function peek() { return S.text.charAt(S.pos); };

    function next(signal_eof, in_string) {
        var ch = S.text.charAt(S.pos++);
        if (signal_eof && !ch)
            throw EX_EOF;
        if ("\r\n\u2028\u2029".indexOf(ch) >= 0) {
            S.newline_before = S.newline_before || !in_string;
            ++S.line;
            S.col = 0;
            if (!in_string && ch == "\r" && peek() == "\n") {
                // treat a \r\n sequence as a single \n
                ++S.pos;
                ch = "\n";
            }
        } else {
            ++S.col;
        }
        return ch;
    };

    function forward(i) {
        while (i-- > 0) next();
    };

    function looking_at(str) {
        return S.text.substr(S.pos, str.length) == str;
    };

    function find(what, signal_eof) {
        var pos = S.text.indexOf(what, S.pos);
        if (signal_eof && pos == -1) throw EX_EOF;
        return pos;
    };

    function start_token() {
        S.tokline = S.line;
        S.tokcol = S.col;
        S.tokpos = S.pos;
    };

    var prev_was_dot = false;
    function token(type, value, is_comment) {
        S.regex_allowed = ((type == "operator" && !UNARY_POSTFIX(value)) ||
                           (type == "keyword" && KEYWORDS_BEFORE_EXPRESSION(value)) ||
                           (type == "punc" && PUNC_BEFORE_EXPRESSION(value)));
        prev_was_dot = (type == "punc" && value == ".");
        var ret = {
            type    : type,
            value   : value,
            line    : S.tokline,
            col     : S.tokcol,
            pos     : S.tokpos,
            endline : S.line,
            endcol  : S.col,
            endpos  : S.pos,
            nlb     : S.newline_before,
            file    : filename
        };
        if (!is_comment) {
            ret.comments_before = S.comments_before;
            S.comments_before = [];
            // make note of any newlines in the comments that came before
            for (var i = 0, len = ret.comments_before.length; i < len; i++) {
                ret.nlb = ret.nlb || ret.comments_before[i].nlb;
            }
        }
        S.newline_before = false;
        return new AST_Token(ret);
    };

    function skip_whitespace() {
        var ch;
        while (WHITESPACE_CHARS(ch = peek()) || ch == "\u2028" || ch == "\u2029")
            next();
    };

    function read_while(pred) {
        var ret = "", ch, i = 0;
        while ((ch = peek()) && pred(ch, i++))
            ret += next();
        return ret;
    };

    function parse_error(err) {
        js_error(err, filename, S.tokline, S.tokcol, S.tokpos);
    };

    function read_num(prefix) {
        var has_e = false, after_e = false, has_x = false, has_dot = prefix == ".";
        var num = read_while(function(ch, i){
            var code = ch.charCodeAt(0);
            switch (code) {
              case 120: case 88: // xX
                return has_x ? false : (has_x = true);
              case 101: case 69: // eE
                return has_x ? true : has_e ? false : (has_e = after_e = true);
              case 45: // -
                return after_e || (i == 0 && !prefix);
              case 43: // +
                return after_e;
              case (after_e = false, 46): // .
                return (!has_dot && !has_x && !has_e) ? (has_dot = true) : false;
            }
            return is_alphanumeric_char(code);
        });
        if (prefix) num = prefix + num;
        var valid = parse_js_number(num);
        if (!isNaN(valid)) {
            return token("num", valid);
        } else {
            parse_error("Invalid syntax: " + num);
        }
    };

    function read_escaped_char(in_string) {
        var ch = next(true, in_string);
        switch (ch.charCodeAt(0)) {
          case 110 : return "\n";
          case 114 : return "\r";
          case 116 : return "\t";
          case 98  : return "\b";
          case 118 : return "\u000b"; // \v
          case 102 : return "\f";
          case 48  : return "\0";
          case 120 : return String.fromCharCode(hex_bytes(2)); // \x
          case 117 : return String.fromCharCode(hex_bytes(4)); // \u
          case 10  : return ""; // newline
          case 13  :            // \r
            if (peek() == "\n") { // DOS newline
                next(true, in_string);
                return "";
            }
        }
        return ch;
    };

    function hex_bytes(n) {
        var num = 0;
        for (; n > 0; --n) {
            var digit = parseInt(next(true), 16);
            if (isNaN(digit))
                parse_error("Invalid hex-character pattern in string");
            num = (num << 4) | digit;
        }
        return num;
    };

    var read_string = with_eof_error("Unterminated string constant", function(quote_char){
        var quote = next(), ret = "";
        for (;;) {
            var ch = next(true, true);
            if (ch == "\\") {
                // read OctalEscapeSequence (XXX: deprecated if "strict mode")
                // https://github.com/mishoo/UglifyJS/issues/178
                var octal_len = 0, first = null;
                ch = read_while(function(ch){
                    if (ch >= "0" && ch <= "7") {
                        if (!first) {
                            first = ch;
                            return ++octal_len;
                        }
                        else if (first <= "3" && octal_len <= 2) return ++octal_len;
                        else if (first >= "4" && octal_len <= 1) return ++octal_len;
                    }
                    return false;
                });
                if (octal_len > 0) ch = String.fromCharCode(parseInt(ch, 8));
                else ch = read_escaped_char(true);
            }
            else if (ch == quote) break;
            ret += ch;
        }
        var tok = token("string", ret);
        tok.quote = quote_char;
        return tok;
    });

    function skip_line_comment(type) {
        var regex_allowed = S.regex_allowed;
        var i = find("\n"), ret;
        if (i == -1) {
            ret = S.text.substr(S.pos);
            S.pos = S.text.length;
        } else {
            ret = S.text.substring(S.pos, i);
            S.pos = i;
        }
        S.col = S.tokcol + (S.pos - S.tokpos);
        S.comments_before.push(token(type, ret, true));
        S.regex_allowed = regex_allowed;
        return next_token();
    };

    var skip_multiline_comment = with_eof_error("Unterminated multiline comment", function(){
        var regex_allowed = S.regex_allowed;
        var i = find("*/", true);
        var text = S.text.substring(S.pos, i);
        var a = text.split("\n"), n = a.length;
        // update stream position
        S.pos = i + 2;
        S.line += n - 1;
        if (n > 1) S.col = a[n - 1].length;
        else S.col += a[n - 1].length;
        S.col += 2;
        var nlb = S.newline_before = S.newline_before || text.indexOf("\n") >= 0;
        S.comments_before.push(token("comment2", text, true));
        S.regex_allowed = regex_allowed;
        S.newline_before = nlb;
        return next_token();
    });

    function read_name() {
        var backslash = false, name = "", ch, escaped = false, hex;
        while ((ch = peek()) != null) {
            if (!backslash) {
                if (ch == "\\") escaped = backslash = true, next();
                else if (is_identifier_char(ch)) name += next();
                else break;
            }
            else {
                if (ch != "u") parse_error("Expecting UnicodeEscapeSequence -- uXXXX");
                ch = read_escaped_char();
                if (!is_identifier_char(ch)) parse_error("Unicode char: " + ch.charCodeAt(0) + " is not valid in identifier");
                name += ch;
                backslash = false;
            }
        }
        if (KEYWORDS(name) && escaped) {
            hex = name.charCodeAt(0).toString(16).toUpperCase();
            name = "\\u" + "0000".substr(hex.length) + hex + name.slice(1);
        }
        return name;
    };

    var read_regexp = with_eof_error("Unterminated regular expression", function(regexp){
        var prev_backslash = false, ch, in_class = false;
        while ((ch = next(true))) if (prev_backslash) {
            regexp += "\\" + ch;
            prev_backslash = false;
        } else if (ch == "[") {
            in_class = true;
            regexp += ch;
        } else if (ch == "]" && in_class) {
            in_class = false;
            regexp += ch;
        } else if (ch == "/" && !in_class) {
            break;
        } else if (ch == "\\") {
            prev_backslash = true;
        } else {
            regexp += ch;
        }
        var mods = read_name();
        return token("regexp", new RegExp(regexp, mods));
    });

    function read_operator(prefix) {
        function grow(op) {
            if (!peek()) return op;
            var bigger = op + peek();
            if (OPERATORS(bigger)) {
                next();
                return grow(bigger);
            } else {
                return op;
            }
        };
        return token("operator", grow(prefix || next()));
    };

    function handle_slash() {
        next();
        switch (peek()) {
          case "/":
            next();
            return skip_line_comment("comment1");
          case "*":
            next();
            return skip_multiline_comment();
        }
        return S.regex_allowed ? read_regexp("") : read_operator("/");
    };

    function handle_dot() {
        next();
        return is_digit(peek().charCodeAt(0))
            ? read_num(".")
            : token("punc", ".");
    };

    function read_word() {
        var word = read_name();
        if (prev_was_dot) return token("name", word);
        return KEYWORDS_ATOM(word) ? token("atom", word)
            : !KEYWORDS(word) ? token("name", word)
            : OPERATORS(word) ? token("operator", word)
            : token("keyword", word);
    };

    function with_eof_error(eof_error, cont) {
        return function(x) {
            try {
                return cont(x);
            } catch(ex) {
                if (ex === EX_EOF) parse_error(eof_error);
                else throw ex;
            }
        };
    };

    function next_token(force_regexp) {
        if (force_regexp != null)
            return read_regexp(force_regexp);
        skip_whitespace();
        start_token();
        if (html5_comments) {
            if (looking_at("<!--")) {
                forward(4);
                return skip_line_comment("comment3");
            }
            if (looking_at("-->") && S.newline_before) {
                forward(3);
                return skip_line_comment("comment4");
            }
        }
        var ch = peek();
        if (!ch) return token("eof");
        var code = ch.charCodeAt(0);
        switch (code) {
          case 34: case 39: return read_string(ch);
          case 46: return handle_dot();
          case 47: return handle_slash();
        }
        if (is_digit(code)) return read_num();
        if (PUNC_CHARS(ch)) return token("punc", next());
        if (OPERATOR_CHARS(ch)) return read_operator();
        if (code == 92 || is_identifier_start(code)) return read_word();
        parse_error("Unexpected character '" + ch + "'");
    };

    next_token.context = function(nc) {
        if (nc) S = nc;
        return S;
    };

    return next_token;

};

function parse($TEXT, options) {
    
/* -----[ Parser (constants) ]----- */

var UNARY_PREFIX = makePredicate([
    "typeof",
    "void",
    "delete",
    "--",
    "++",
    "!",
    "~",
    "-",
    "+"
]);

var UNARY_POSTFIX = makePredicate([ "--", "++" ]);

var ASSIGNMENT = makePredicate([ "=", "+=", "-=", "/=", "*=", "%=", ">>=", "<<=", ">>>=", "|=", "^=", "&=" ]);

var PRECEDENCE = (function(a, ret){
    for (var i = 0; i < a.length; ++i) {
        var b = a[i];
        for (var j = 0; j < b.length; ++j) {
            ret[b[j]] = i + 1;
        }
    }
    return ret;
})(
    [
        ["||"],
        ["&&"],
        ["|"],
        ["^"],
        ["&"],
        ["==", "===", "!=", "!=="],
        ["<", ">", "<=", ">=", "in", "instanceof"],
        [">>", "<<", ">>>"],
        ["+", "-"],
        ["*", "/", "%"]
    ],
    {}
);

var STATEMENTS_WITH_LABELS = array_to_hash([ "for", "do", "while", "switch" ]);

var ATOMIC_START_TOKEN = array_to_hash([ "atom", "num", "string", "regexp", "name" ]);

/* -----[ Parser ]----- */

    options = defaults(options, {
        strict         : false,
        filename       : null,
        toplevel       : null,
        expression     : false,
        html5_comments : true,
        bare_returns   : false,
    });

    var S = {
        input         : (typeof $TEXT == "string"
                         ? tokenizer($TEXT, options.filename,
                                     options.html5_comments)
                         : $TEXT),
        token         : null,
        prev          : null,
        peeked        : null,
        in_function   : 0,
        in_directives : true,
        in_loop       : 0,
        labels        : []
    };

    S.token = next();

    function is(type, value) {
        return is_token(S.token, type, value);
    };

    function peek() { return S.peeked || (S.peeked = S.input()); };

    function next() {
        S.prev = S.token;
        if (S.peeked) {
            S.token = S.peeked;
            S.peeked = null;
        } else {
            S.token = S.input();
        }
        S.in_directives = S.in_directives && (
            S.token.type == "string" || is("punc", ";")
        );
        return S.token;
    };

    function prev() {
        return S.prev;
    };

    function croak(msg, line, col, pos) {
        var ctx = S.input.context();
        js_error(msg,
                 ctx.filename,
                 line != null ? line : ctx.tokline,
                 col != null ? col : ctx.tokcol,
                 pos != null ? pos : ctx.tokpos);
    };

    function token_error(token, msg) {
        croak(msg, token.line, token.col);
    };

    function unexpected(token) {
        if (token == null)
            token = S.token;
        token_error(token, "Unexpected token: " + token.type + " (" + token.value + ")");
    };

    function expect_token(type, val) {
        if (is(type, val)) {
            return next();
        }
        token_error(S.token, "Unexpected token " + S.token.type + " «" + S.token.value + "»" + ", expected " + type + " «" + val + "»");
    };

    function expect(punc) { return expect_token("punc", punc); };

    function can_insert_semicolon() {
        return !options.strict && (
            S.token.nlb || is("eof") || is("punc", "}")
        );
    };

    function semicolon() {
        if (is("punc", ";")) next();
        else if (!can_insert_semicolon()) unexpected();
    };

    function parenthesised() {
        expect("(");
        var exp = expression(true);
        expect(")");
        return exp;
    };

    function embed_tokens(parser) {
        return function() {
            var start = S.token;
            var expr = parser();
            var end = prev();
            expr.start = start;
            expr.end = end;
            return expr;
        };
    };

    function handle_regexp() {
        if (is("operator", "/") || is("operator", "/=")) {
            S.peeked = null;
            S.token = S.input(S.token.value.substr(1)); // force regexp
        }
    };

    var statement = embed_tokens(function() {
        var tmp;
        handle_regexp();
        switch (S.token.type) {
          case "string":
            var dir = S.in_directives, stat = simple_statement();
            // XXXv2: decide how to fix directives
            if (dir && stat.body instanceof AST_String && !is("punc", ",")) {
                return new AST_Directive({
                    start : stat.body.start,
                    end   : stat.body.end,
                    quote : stat.body.quote,
                    value : stat.body.value,
                });
            }
            return stat;
          case "num":
          case "regexp":
          case "operator":
          case "atom":
            return simple_statement();

          case "name":
            return is_token(peek(), "punc", ":")
                ? labeled_statement()
                : simple_statement();

          case "punc":
            switch (S.token.value) {
              case "{":
                return new AST_BlockStatement({
                    start : S.token,
                    body  : block_(),
                    end   : prev()
                });
              case "[":
              case "(":
                return simple_statement();
              case ";":
                next();
                return new AST_EmptyStatement();
              default:
                unexpected();
            }

          case "keyword":
            switch (tmp = S.token.value, next(), tmp) {
              case "break":
                return break_cont(AST_Break);

              case "continue":
                return break_cont(AST_Continue);

              case "debugger":
                semicolon();
                return new AST_Debugger();

              case "do":
                return new AST_Do({
                    body      : in_loop(statement),
                    condition : (expect_token("keyword", "while"), tmp = parenthesised(), semicolon(), tmp)
                });

              case "while":
                return new AST_While({
                    condition : parenthesised(),
                    body      : in_loop(statement)
                });

              case "for":
                return for_();

              case "function":
                return function_(AST_Defun);

              case "if":
                return if_();

              case "return":
                if (S.in_function == 0 && !options.bare_returns)
                    croak("'return' outside of function");
                return new AST_Return({
                    value: ( is("punc", ";")
                             ? (next(), null)
                             : can_insert_semicolon()
                             ? null
                             : (tmp = expression(true), semicolon(), tmp) )
                });

              case "switch":
                return new AST_Switch({
                    expression : parenthesised(),
                    body       : in_loop(switch_body_)
                });

              case "throw":
                if (S.token.nlb)
                    croak("Illegal newline after 'throw'");
                return new AST_Throw({
                    value: (tmp = expression(true), semicolon(), tmp)
                });

              case "try":
                return try_();

              case "var":
                return tmp = var_(), semicolon(), tmp;

              case "const":
                return tmp = const_(), semicolon(), tmp;

              case "with":
                return new AST_With({
                    expression : parenthesised(),
                    body       : statement()
                });

              default:
                unexpected();
            }
        }
    });

    function labeled_statement() {
        var label = as_symbol(AST_Label);
        if (find_if(function(l){ return l.name == label.name }, S.labels)) {
            // ECMA-262, 12.12: An ECMAScript program is considered
            // syntactically incorrect if it contains a
            // LabelledStatement that is enclosed by a
            // LabelledStatement with the same Identifier as label.
            croak("Label " + label.name + " defined twice");
        }
        expect(":");
        S.labels.push(label);
        var stat = statement();
        S.labels.pop();
        if (!(stat instanceof AST_IterationStatement)) {
            // check for `continue` that refers to this label.
            // those should be reported as syntax errors.
            // https://github.com/mishoo/UglifyJS2/issues/287
            label.references.forEach(function(ref){
                if (ref instanceof AST_Continue) {
                    ref = ref.label.start;
                    croak("Continue label `" + label.name + "` refers to non-IterationStatement.",
                          ref.line, ref.col, ref.pos);
                }
            });
        }
        return new AST_LabeledStatement({ body: stat, label: label });
    };

    function simple_statement(tmp) {
        return new AST_SimpleStatement({ body: (tmp = expression(true), semicolon(), tmp) });
    };

    function break_cont(type) {
        var label = null, ldef;
        if (!can_insert_semicolon()) {
            label = as_symbol(AST_LabelRef, true);
        }
        if (label != null) {
            ldef = find_if(function(l){ return l.name == label.name }, S.labels);
            if (!ldef)
                croak("Undefined label " + label.name);
            label.thedef = ldef;
        }
        else if (S.in_loop == 0)
            croak(type.TYPE + " not inside a loop or switch");
        semicolon();
        var stat = new type({ label: label });
        if (ldef) ldef.references.push(stat);
        return stat;
    };

    function for_() {
        expect("(");
        var init = null;
        if (!is("punc", ";")) {
            init = is("keyword", "var")
                ? (next(), var_(true))
                : expression(true, true);
            if (is("operator", "in")) {
                if (init instanceof AST_Var && init.definitions.length > 1)
                    croak("Only one variable declaration allowed in for..in loop");
                next();
                return for_in(init);
            }
        }
        return regular_for(init);
    };

    function regular_for(init) {
        expect(";");
        var test = is("punc", ";") ? null : expression(true);
        expect(";");
        var step = is("punc", ")") ? null : expression(true);
        expect(")");
        return new AST_For({
            init      : init,
            condition : test,
            step      : step,
            body      : in_loop(statement)
        });
    };

    function for_in(init) {
        var lhs = init instanceof AST_Var ? init.definitions[0].name : null;
        var obj = expression(true);
        expect(")");
        return new AST_ForIn({
            init   : init,
            name   : lhs,
            object : obj,
            body   : in_loop(statement)
        });
    };

    var function_ = function(ctor) {
        var in_statement = ctor === AST_Defun;
        var name = is("name") ? as_symbol(in_statement ? AST_SymbolDefun : AST_SymbolLambda) : null;
        if (in_statement && !name)
            unexpected();
        expect("(");
        return new ctor({
            name: name,
            argnames: (function(first, a){
                while (!is("punc", ")")) {
                    if (first) first = false; else expect(",");
                    a.push(as_symbol(AST_SymbolFunarg));
                }
                next();
                return a;
            })(true, []),
            body: (function(loop, labels){
                ++S.in_function;
                S.in_directives = true;
                S.in_loop = 0;
                S.labels = [];
                var a = block_();
                --S.in_function;
                S.in_loop = loop;
                S.labels = labels;
                return a;
            })(S.in_loop, S.labels)
        });
    };

    function if_() {
        var cond = parenthesised(), body = statement(), belse = null;
        if (is("keyword", "else")) {
            next();
            belse = statement();
        }
        return new AST_If({
            condition   : cond,
            body        : body,
            alternative : belse
        });
    };

    function block_() {
        expect("{");
        var a = [];
        while (!is("punc", "}")) {
            if (is("eof")) unexpected();
            a.push(statement());
        }
        next();
        return a;
    };

    function switch_body_() {
        expect("{");
        var a = [], cur = null, branch = null, tmp;
        while (!is("punc", "}")) {
            if (is("eof")) unexpected();
            if (is("keyword", "case")) {
                if (branch) branch.end = prev();
                cur = [];
                branch = new AST_Case({
                    start      : (tmp = S.token, next(), tmp),
                    expression : expression(true),
                    body       : cur
                });
                a.push(branch);
                expect(":");
            }
            else if (is("keyword", "default")) {
                if (branch) branch.end = prev();
                cur = [];
                branch = new AST_Default({
                    start : (tmp = S.token, next(), expect(":"), tmp),
                    body  : cur
                });
                a.push(branch);
            }
            else {
                if (!cur) unexpected();
                cur.push(statement());
            }
        }
        if (branch) branch.end = prev();
        next();
        return a;
    };

    function try_() {
        var body = block_(), bcatch = null, bfinally = null;
        if (is("keyword", "catch")) {
            var start = S.token;
            next();
            expect("(");
            var name = as_symbol(AST_SymbolCatch);
            expect(")");
            bcatch = new AST_Catch({
                start   : start,
                argname : name,
                body    : block_(),
                end     : prev()
            });
        }
        if (is("keyword", "finally")) {
            var start = S.token;
            next();
            bfinally = new AST_Finally({
                start : start,
                body  : block_(),
                end   : prev()
            });
        }
        if (!bcatch && !bfinally)
            croak("Missing catch/finally blocks");
        return new AST_Try({
            body     : body,
            bcatch   : bcatch,
            bfinally : bfinally
        });
    };

    function vardefs(no_in, in_const) {
        var a = [];
        for (;;) {
            a.push(new AST_VarDef({
                start : S.token,
                name  : as_symbol(in_const ? AST_SymbolConst : AST_SymbolVar),
                value : is("operator", "=") ? (next(), expression(false, no_in)) : null,
                end   : prev()
            }));
            if (!is("punc", ","))
                break;
            next();
        }
        return a;
    };

    var var_ = function(no_in) {
        return new AST_Var({
            start       : prev(),
            definitions : vardefs(no_in, false),
            end         : prev()
        });
    };

    var const_ = function() {
        return new AST_Const({
            start       : prev(),
            definitions : vardefs(false, true),
            end         : prev()
        });
    };

    var new_ = function() {
        var start = S.token;
        expect_token("operator", "new");
        var newexp = expr_atom(false), args;
        if (is("punc", "(")) {
            next();
            args = expr_list(")");
        } else {
            args = [];
        }
        return subscripts(new AST_New({
            start      : start,
            expression : newexp,
            args       : args,
            end        : prev()
        }), true);
    };

    function as_atom_node() {
        var tok = S.token, ret;
        switch (tok.type) {
          case "name":
          case "keyword":
            ret = _make_symbol(AST_SymbolRef);
            break;
          case "num":
            ret = new AST_Number({ start: tok, end: tok, value: tok.value });
            break;
          case "string":
            ret = new AST_String({
                start : tok,
                end   : tok,
                value : tok.value,
                quote : tok.quote
            });
            break;
          case "regexp":
            ret = new AST_RegExp({ start: tok, end: tok, value: tok.value });
            break;
          case "atom":
            switch (tok.value) {
              case "false":
                ret = new AST_False({ start: tok, end: tok });
                break;
              case "true":
                ret = new AST_True({ start: tok, end: tok });
                break;
              case "null":
                ret = new AST_Null({ start: tok, end: tok });
                break;
            }
            break;
        }
        next();
        return ret;
    };

    var expr_atom = function(allow_calls) {
        if (is("operator", "new")) {
            return new_();
        }
        var start = S.token;
        if (is("punc")) {
            switch (start.value) {
              case "(":
                next();
                var ex = expression(true);
                ex.start = start;
                ex.end = S.token;
                expect(")");
                return subscripts(ex, allow_calls);
              case "[":
                return subscripts(array_(), allow_calls);
              case "{":
                return subscripts(object_(), allow_calls);
            }
            unexpected();
        }
        if (is("keyword", "function")) {
            next();
            var func = function_(AST_Function);
            func.start = start;
            func.end = prev();
            return subscripts(func, allow_calls);
        }
        if (ATOMIC_START_TOKEN[S.token.type]) {
            return subscripts(as_atom_node(), allow_calls);
        }
        unexpected();
    };

    function expr_list(closing, allow_trailing_comma, allow_empty) {
        var first = true, a = [];
        while (!is("punc", closing)) {
            if (first) first = false; else expect(",");
            if (allow_trailing_comma && is("punc", closing)) break;
            if (is("punc", ",") && allow_empty) {
                a.push(new AST_Hole({ start: S.token, end: S.token }));
            } else {
                a.push(expression(false));
            }
        }
        next();
        return a;
    };

    var array_ = embed_tokens(function() {
        expect("[");
        return new AST_Array({
            elements: expr_list("]", !options.strict, true)
        });
    });

    var object_ = embed_tokens(function() {
        expect("{");
        var first = true, a = [];
        while (!is("punc", "}")) {
            if (first) first = false; else expect(",");
            if (!options.strict && is("punc", "}"))
                // allow trailing comma
                break;
            var start = S.token;
            var type = start.type;
            var name = as_property_name();
            if (type == "name" && !is("punc", ":")) {
                if (name == "get") {
                    a.push(new AST_ObjectGetter({
                        start : start,
                        key   : as_atom_node(),
                        value : function_(AST_Accessor),
                        end   : prev()
                    }));
                    continue;
                }
                if (name == "set") {
                    a.push(new AST_ObjectSetter({
                        start : start,
                        key   : as_atom_node(),
                        value : function_(AST_Accessor),
                        end   : prev()
                    }));
                    continue;
                }
            }
            expect(":");
            a.push(new AST_ObjectKeyVal({
                start : start,
                quote : start.quote,
                key   : name,
                value : expression(false),
                end   : prev()
            }));
        }
        next();
        return new AST_Object({ properties: a });
    });

    function as_property_name() {
        var tmp = S.token;
        next();
        switch (tmp.type) {
          case "num":
          case "string":
          case "name":
          case "operator":
          case "keyword":
          case "atom":
            return tmp.value;
          default:
            unexpected();
        }
    };

    function as_name() {
        var tmp = S.token;
        next();
        switch (tmp.type) {
          case "name":
          case "operator":
          case "keyword":
          case "atom":
            return tmp.value;
          default:
            unexpected();
        }
    };

    function _make_symbol(type) {
        var name = S.token.value;
        return new (name == "this" ? AST_This : type)({
            name  : String(name),
            start : S.token,
            end   : S.token
        });
    };

    function as_symbol(type, noerror) {
        if (!is("name")) {
            if (!noerror) croak("Name expected");
            return null;
        }
        var sym = _make_symbol(type);
        next();
        return sym;
    };

    var subscripts = function(expr, allow_calls) {
        var start = expr.start;
        if (is("punc", ".")) {
            next();
            return subscripts(new AST_Dot({
                start      : start,
                expression : expr,
                property   : as_name(),
                end        : prev()
            }), allow_calls);
        }
        if (is("punc", "[")) {
            next();
            var prop = expression(true);
            expect("]");
            return subscripts(new AST_Sub({
                start      : start,
                expression : expr,
                property   : prop,
                end        : prev()
            }), allow_calls);
        }
        if (allow_calls && is("punc", "(")) {
            next();
            return subscripts(new AST_Call({
                start      : start,
                expression : expr,
                args       : expr_list(")"),
                end        : prev()
            }), true);
        }
        return expr;
    };

    var maybe_unary = function(allow_calls) {
        var start = S.token;
        if (is("operator") && UNARY_PREFIX(start.value)) {
            next();
            handle_regexp();
            var ex = make_unary(AST_UnaryPrefix, start.value, maybe_unary(allow_calls));
            ex.start = start;
            ex.end = prev();
            return ex;
        }
        var val = expr_atom(allow_calls);
        while (is("operator") && UNARY_POSTFIX(S.token.value) && !S.token.nlb) {
            val = make_unary(AST_UnaryPostfix, S.token.value, val);
            val.start = start;
            val.end = S.token;
            next();
        }
        return val;
    };

    function make_unary(ctor, op, expr) {
        if ((op == "++" || op == "--") && !is_assignable(expr))
            croak("Invalid use of " + op + " operator");
        return new ctor({ operator: op, expression: expr });
    };

    var expr_op = function(left, min_prec, no_in) {
        var op = is("operator") ? S.token.value : null;
        if (op == "in" && no_in) op = null;
        var prec = op != null ? PRECEDENCE[op] : null;
        if (prec != null && prec > min_prec) {
            next();
            var right = expr_op(maybe_unary(true), prec, no_in);
            return expr_op(new AST_Binary({
                start    : left.start,
                left     : left,
                operator : op,
                right    : right,
                end      : right.end
            }), min_prec, no_in);
        }
        return left;
    };

    function expr_ops(no_in) {
        return expr_op(maybe_unary(true), 0, no_in);
    };

    var maybe_conditional = function(no_in) {
        var start = S.token;
        var expr = expr_ops(no_in);
        if (is("operator", "?")) {
            next();
            var yes = expression(false);
            expect(":");
            return new AST_Conditional({
                start       : start,
                condition   : expr,
                consequent  : yes,
                alternative : expression(false, no_in),
                end         : prev()
            });
        }
        return expr;
    };

    function is_assignable(expr) {
        if (!options.strict) return true;
        if (expr instanceof AST_This) return false;
        return (expr instanceof AST_PropAccess || expr instanceof AST_Symbol);
    };

    var maybe_assign = function(no_in) {
        var start = S.token;
        var left = maybe_conditional(no_in), val = S.token.value;
        if (is("operator") && ASSIGNMENT(val)) {
            if (is_assignable(left)) {
                next();
                return new AST_Assign({
                    start    : start,
                    left     : left,
                    operator : val,
                    right    : maybe_assign(no_in),
                    end      : prev()
                });
            }
            croak("Invalid assignment");
        }
        return left;
    };

    var expression = function(commas, no_in) {
        var start = S.token;
        var expr = maybe_assign(no_in);
        if (commas && is("punc", ",")) {
            next();
            return new AST_Seq({
                start  : start,
                car    : expr,
                cdr    : expression(true, no_in),
                end    : peek()
            });
        }
        return expr;
    };

    function in_loop(cont) {
        ++S.in_loop;
        var ret = cont();
        --S.in_loop;
        return ret;
    };

    if (options.expression) {
        return expression(true);
    }

    return (function(){
        var start = S.token;
        var body = [];
        while (!is("eof"))
            body.push(statement());
        var end = prev();
        var toplevel = options.toplevel;
        if (toplevel) {
            toplevel.body = toplevel.body.concat(body);
            toplevel.end = end;
        } else {
            toplevel = new AST_Toplevel({ start: start, body: body, end: end });
        }
        return toplevel;
    })();

};

/***********************************************************************

  A JavaScript tokenizer / parser / beautifier / compressor.
  https://github.com/mishoo/UglifyJS2

  -------------------------------- (C) ---------------------------------

                           Author: Mihai Bazon
                         <mihai.bazon@gmail.com>
                       http://mihai.bazon.net/blog

  Distributed under the BSD license:

    Copyright 2012 (c) Mihai Bazon <mihai.bazon@gmail.com>

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

"use strict";

function array_to_hash(a) {
    var ret = Object.create(null);
    for (var i = 0; i < a.length; ++i)
        ret[a[i]] = true;
    return ret;
};

function slice(a, start) {
    return Array.prototype.slice.call(a, start || 0);
};

function characters(str) {
    return str.split("");
};

function member(name, array) {
    for (var i = array.length; --i >= 0;)
        if (array[i] == name)
            return true;
    return false;
};

function find_if(func, array) {
    for (var i = 0, n = array.length; i < n; ++i) {
        if (func(array[i]))
            return array[i];
    }
};

function repeat_string(str, i) {
    if (i <= 0) return "";
    if (i == 1) return str;
    var d = repeat_string(str, i >> 1);
    d += d;
    if (i & 1) d += str;
    return d;
};

function DefaultsError(msg, defs) {
    Error.call(this, msg);
    this.msg = msg;
    this.defs = defs;
};
DefaultsError.prototype = Object.create(Error.prototype);
DefaultsError.prototype.constructor = DefaultsError;

DefaultsError.croak = function(msg, defs) {
    throw new DefaultsError(msg, defs);
};

function defaults(args, defs, croak) {
    if (args === true)
        args = {};
    var ret = args || {};
    if (croak) for (var i in ret) if (ret.hasOwnProperty(i) && !defs.hasOwnProperty(i))
        DefaultsError.croak("`" + i + "` is not a supported option", defs);
    for (var i in defs) if (defs.hasOwnProperty(i)) {
        ret[i] = (args && args.hasOwnProperty(i)) ? args[i] : defs[i];
    }
    return ret;
};

function merge(obj, ext) {
    var count = 0;
    for (var i in ext) if (ext.hasOwnProperty(i)) {
        obj[i] = ext[i];
        count++;
    }
    return count;
};

function noop() {};

var MAP = (function(){
    function MAP(a, f, backwards) {
        var ret = [], top = [], i;
        function doit() {
            var val = f(a[i], i);
            var is_last = val instanceof Last;
            if (is_last) val = val.v;
            if (val instanceof AtTop) {
                val = val.v;
                if (val instanceof Splice) {
                    top.push.apply(top, backwards ? val.v.slice().reverse() : val.v);
                } else {
                    top.push(val);
                }
            }
            else if (val !== skip) {
                if (val instanceof Splice) {
                    ret.push.apply(ret, backwards ? val.v.slice().reverse() : val.v);
                } else {
                    ret.push(val);
                }
            }
            return is_last;
        };
        if (a instanceof Array) {
            if (backwards) {
                for (i = a.length; --i >= 0;) if (doit()) break;
                ret.reverse();
                top.reverse();
            } else {
                for (i = 0; i < a.length; ++i) if (doit()) break;
            }
        }
        else {
            for (i in a) if (a.hasOwnProperty(i)) if (doit()) break;
        }
        return top.concat(ret);
    };
    MAP.at_top = function(val) { return new AtTop(val) };
    MAP.splice = function(val) { return new Splice(val) };
    MAP.last = function(val) { return new Last(val) };
    var skip = MAP.skip = {};
    function AtTop(val) { this.v = val };
    function Splice(val) { this.v = val };
    function Last(val) { this.v = val };
    return MAP;
})();

function push_uniq(array, el) {
    if (array.indexOf(el) < 0)
        array.push(el);
};

function string_template(text, props) {
    return text.replace(/\{(.+?)\}/g, function(str, p){
        return props[p];
    });
};

function remove(array, el) {
    for (var i = array.length; --i >= 0;) {
        if (array[i] === el) array.splice(i, 1);
    }
};

function mergeSort(array, cmp) {
    if (array.length < 2) return array.slice();
    function merge(a, b) {
        var r = [], ai = 0, bi = 0, i = 0;
        while (ai < a.length && bi < b.length) {
            cmp(a[ai], b[bi]) <= 0
                ? r[i++] = a[ai++]
                : r[i++] = b[bi++];
        }
        if (ai < a.length) r.push.apply(r, a.slice(ai));
        if (bi < b.length) r.push.apply(r, b.slice(bi));
        return r;
    };
    function _ms(a) {
        if (a.length <= 1)
            return a;
        var m = Math.floor(a.length / 2), left = a.slice(0, m), right = a.slice(m);
        left = _ms(left);
        right = _ms(right);
        return merge(left, right);
    };
    return _ms(array);
};

function set_difference(a, b) {
    return a.filter(function(el){
        return b.indexOf(el) < 0;
    });
};

function set_intersection(a, b) {
    return a.filter(function(el){
        return b.indexOf(el) >= 0;
    });
};

// this function is taken from Acorn [1], written by Marijn Haverbeke
// [1] https://github.com/marijnh/acorn
function makePredicate(words) {
    if (!(words instanceof Array)) words = words.split(" ");
    var f = "", cats = [];
    out: for (var i = 0; i < words.length; ++i) {
        for (var j = 0; j < cats.length; ++j)
            if (cats[j][0].length == words[i].length) {
                cats[j].push(words[i]);
                continue out;
            }
        cats.push([words[i]]);
    }
    function compareTo(arr) {
        if (arr.length == 1) return f += "return str === " + JSON.stringify(arr[0]) + ";";
        f += "switch(str){";
        for (var i = 0; i < arr.length; ++i) f += "case " + JSON.stringify(arr[i]) + ":";
        f += "return true}return false;";
    }
    // When there are more than three length categories, an outer
    // switch first dispatches on the lengths, to save on comparisons.
    if (cats.length > 3) {
        cats.sort(function(a, b) {return b.length - a.length;});
        f += "switch(str.length){";
        for (var i = 0; i < cats.length; ++i) {
            var cat = cats[i];
            f += "case " + cat[0].length + ":";
            compareTo(cat);
        }
        f += "}";
        // Otherwise, simply generate a flat `switch` statement.
    } else {
        compareTo(words);
    }
    return new Function("str", f);
};

function all(array, predicate) {
    for (var i = array.length; --i >= 0;)
        if (!predicate(array[i]))
            return false;
    return true;
};

function Dictionary() {
    this._values = Object.create(null);
    this._size = 0;
};
Dictionary.prototype = {
    set: function(key, val) {
        if (!this.has(key)) ++this._size;
        this._values["$" + key] = val;
        return this;
    },
    add: function(key, val) {
        if (this.has(key)) {
            this.get(key).push(val);
        } else {
            this.set(key, [ val ]);
        }
        return this;
    },
    get: function(key) { return this._values["$" + key] },
    del: function(key) {
        if (this.has(key)) {
            --this._size;
            delete this._values["$" + key];
        }
        return this;
    },
    has: function(key) { return ("$" + key) in this._values },
    each: function(f) {
        for (var i in this._values)
            f(this._values[i], i.substr(1));
    },
    size: function() {
        return this._size;
    },
    map: function(f) {
        var ret = [];
        for (var i in this._values)
            ret.push(f(this._values[i], i.substr(1)));
        return ret;
    },
    toObject: function() { return this._values }
};
Dictionary.fromObject = function(obj) {
    var dict = new Dictionary();
    dict._size = merge(dict._values, obj);
    return dict;
};

/* @license

  Copyright (c) 2010 Mihai Bazon <mihai.bazon@gmail.com>
  Copyright (c) 2011 Lauri Paimen <lauri@paimen.info>
  Copyright (c) 2013 Anton Kreuzkamp <akreuzkamp@web.de>
  Based on parse-js (http://marijn.haverbeke.nl/parse-js/).

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
 * QML parser and parsetree'er.
 *
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
 *
 * Exports:
 *
 * - QMLBinding(src, tree) to pass qml bindings along.
 *
 * - parseQML(src) -- parses QML source and returns it as output tree expected
 *   by the QML engine
 *
 * - qmlparse(src) -- parses QML source and returns tree a la uglifyjs parser.
 *   Currently used for debugging purposes.
 */

// Object cloning for debug prints.
function clone(obj){
    if(obj == null || typeof(obj) != 'object')
        return obj;

    var temp = {}; // changed

    for(var key in obj)
        temp[key] = clone(obj[key]);
    return temp;
}

/* -----[ Tokenizer (constants) ]----- */

var KEYWORDS = array_to_hash([
        "break",
        "case",
        "catch",
        "const",
        "continue",
        "default",
        "delete",
        "do",
        "else",
        "finally",
        "for",
        "function",
        "if",
        "in",
        "instanceof",
        "new",
        "return",
        "switch",
        "throw",
        "try",
        "typeof",
        "var",
        "void",
        "while",
        "with"
]);

var RESERVED_WORDS = array_to_hash([
        "abstract",
        "boolean",
        "byte",
        "char",
        "class",
        "debugger",
        "double",
        "enum",
        "export",
        "extends",
        "final",
        "float",
        "goto",
        "implements",
        "import",
        "int",
        "interface",
        "long",
        "native",
        "package",
        "private",
        "protected",
        "public",
        "short",
        "static",
        "super",
        "synchronized",
        "throws",
        "transient",
        "volatile"
]);

var KEYWORDS_BEFORE_EXPRESSION = array_to_hash([
        "return",
        "new",
        "delete",
        "throw",
        "else",
        "case"
]);

var KEYWORDS_ATOM = array_to_hash([
        "false",
        "null",
        "true",
        "undefined"
]);

var OPERATOR_CHARS = array_to_hash(characters("+-*&%=<>!?|~^"));

var RE_HEX_NUMBER = /^0x[0-9a-f]+$/i;
var RE_OCT_NUMBER = /^0[0-7]+$/;
var RE_DEC_NUMBER = /^\d*\.?\d*(?:e[+-]?\d*(?:\d\.?|\.?\d)\d*)?$/i;

var OPERATORS = array_to_hash([
        "in",
        "instanceof",
        "typeof",
        "new",
        "void",
        "delete",
        "++",
        "--",
        "+",
        "-",
        "!",
        "~",
        "&",
        "|",
        "^",
        "*",
        "/",
        "%",
        ">>",
        "<<",
        ">>>",
        "<",
        ">",
        "<=",
        ">=",
        "==",
        "===",
        "!=",
        "!==",
        "?",
        "=",
        "+=",
        "-=",
        "/=",
        "*=",
        "%=",
        ">>=",
        "<<=",
        ">>>=",
        "|=",
        "^=",
        "&=",
        "&&",
        "||"
]);

var WHITESPACE_CHARS = array_to_hash(characters(" \n\r\t\u200b"));

var PUNC_BEFORE_EXPRESSION = array_to_hash(characters("[{}(,.;:"));

var PUNC_CHARS = array_to_hash(characters("[]{}(),;:"));

var REGEXP_MODIFIERS = array_to_hash(characters("gmsiy"));

/* -----[ Tokenizer ]----- */

// regexps adapted from http://xregexp.com/plugins/#unicode
var UNICODE = {
        letter: new RegExp("[\\u0041-\\u005A\\u0061-\\u007A\\u00AA\\u00B5\\u00BA\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02C1\\u02C6-\\u02D1\\u02E0-\\u02E4\\u02EC\\u02EE\\u0370-\\u0374\\u0376\\u0377\\u037A-\\u037D\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03F5\\u03F7-\\u0481\\u048A-\\u0523\\u0531-\\u0556\\u0559\\u0561-\\u0587\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u064A\\u066E\\u066F\\u0671-\\u06D3\\u06D5\\u06E5\\u06E6\\u06EE\\u06EF\\u06FA-\\u06FC\\u06FF\\u0710\\u0712-\\u072F\\u074D-\\u07A5\\u07B1\\u07CA-\\u07EA\\u07F4\\u07F5\\u07FA\\u0904-\\u0939\\u093D\\u0950\\u0958-\\u0961\\u0971\\u0972\\u097B-\\u097F\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BD\\u09CE\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AD0\\u0AE0\\u0AE1\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B35-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B71\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB9\\u0BD0\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C3D\\u0C58\\u0C59\\u0C60\\u0C61\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBD\\u0CDE\\u0CE0\\u0CE1\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D3D\\u0D60\\u0D61\\u0D7A-\\u0D7F\\u0D85-\\u0D96\\u0D9A-\\u0DB1\\u0DB3-\\u0DBB\\u0DBD\\u0DC0-\\u0DC6\\u0E01-\\u0E30\\u0E32\\u0E33\\u0E40-\\u0E46\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD-\\u0EB0\\u0EB2\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EDC\\u0EDD\\u0F00\\u0F40-\\u0F47\\u0F49-\\u0F6C\\u0F88-\\u0F8B\\u1000-\\u102A\\u103F\\u1050-\\u1055\\u105A-\\u105D\\u1061\\u1065\\u1066\\u106E-\\u1070\\u1075-\\u1081\\u108E\\u10A0-\\u10C5\\u10D0-\\u10FA\\u10FC\\u1100-\\u1159\\u115F-\\u11A2\\u11A8-\\u11F9\\u1200-\\u1248\\u124A-\\u124D\\u1250-\\u1256\\u1258\\u125A-\\u125D\\u1260-\\u1288\\u128A-\\u128D\\u1290-\\u12B0\\u12B2-\\u12B5\\u12B8-\\u12BE\\u12C0\\u12C2-\\u12C5\\u12C8-\\u12D6\\u12D8-\\u1310\\u1312-\\u1315\\u1318-\\u135A\\u1380-\\u138F\\u13A0-\\u13F4\\u1401-\\u166C\\u166F-\\u1676\\u1681-\\u169A\\u16A0-\\u16EA\\u1700-\\u170C\\u170E-\\u1711\\u1720-\\u1731\\u1740-\\u1751\\u1760-\\u176C\\u176E-\\u1770\\u1780-\\u17B3\\u17D7\\u17DC\\u1820-\\u1877\\u1880-\\u18A8\\u18AA\\u1900-\\u191C\\u1950-\\u196D\\u1970-\\u1974\\u1980-\\u19A9\\u19C1-\\u19C7\\u1A00-\\u1A16\\u1B05-\\u1B33\\u1B45-\\u1B4B\\u1B83-\\u1BA0\\u1BAE\\u1BAF\\u1C00-\\u1C23\\u1C4D-\\u1C4F\\u1C5A-\\u1C7D\\u1D00-\\u1DBF\\u1E00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u2071\\u207F\\u2090-\\u2094\\u2102\\u2107\\u210A-\\u2113\\u2115\\u2119-\\u211D\\u2124\\u2126\\u2128\\u212A-\\u212D\\u212F-\\u2139\\u213C-\\u213F\\u2145-\\u2149\\u214E\\u2183\\u2184\\u2C00-\\u2C2E\\u2C30-\\u2C5E\\u2C60-\\u2C6F\\u2C71-\\u2C7D\\u2C80-\\u2CE4\\u2D00-\\u2D25\\u2D30-\\u2D65\\u2D6F\\u2D80-\\u2D96\\u2DA0-\\u2DA6\\u2DA8-\\u2DAE\\u2DB0-\\u2DB6\\u2DB8-\\u2DBE\\u2DC0-\\u2DC6\\u2DC8-\\u2DCE\\u2DD0-\\u2DD6\\u2DD8-\\u2DDE\\u2E2F\\u3005\\u3006\\u3031-\\u3035\\u303B\\u303C\\u3041-\\u3096\\u309D-\\u309F\\u30A1-\\u30FA\\u30FC-\\u30FF\\u3105-\\u312D\\u3131-\\u318E\\u31A0-\\u31B7\\u31F0-\\u31FF\\u3400\\u4DB5\\u4E00\\u9FC3\\uA000-\\uA48C\\uA500-\\uA60C\\uA610-\\uA61F\\uA62A\\uA62B\\uA640-\\uA65F\\uA662-\\uA66E\\uA67F-\\uA697\\uA717-\\uA71F\\uA722-\\uA788\\uA78B\\uA78C\\uA7FB-\\uA801\\uA803-\\uA805\\uA807-\\uA80A\\uA80C-\\uA822\\uA840-\\uA873\\uA882-\\uA8B3\\uA90A-\\uA925\\uA930-\\uA946\\uAA00-\\uAA28\\uAA40-\\uAA42\\uAA44-\\uAA4B\\uAC00\\uD7A3\\uF900-\\uFA2D\\uFA30-\\uFA6A\\uFA70-\\uFAD9\\uFB00-\\uFB06\\uFB13-\\uFB17\\uFB1D\\uFB1F-\\uFB28\\uFB2A-\\uFB36\\uFB38-\\uFB3C\\uFB3E\\uFB40\\uFB41\\uFB43\\uFB44\\uFB46-\\uFBB1\\uFBD3-\\uFD3D\\uFD50-\\uFD8F\\uFD92-\\uFDC7\\uFDF0-\\uFDFB\\uFE70-\\uFE74\\uFE76-\\uFEFC\\uFF21-\\uFF3A\\uFF41-\\uFF5A\\uFF66-\\uFFBE\\uFFC2-\\uFFC7\\uFFCA-\\uFFCF\\uFFD2-\\uFFD7\\uFFDA-\\uFFDC]"),
        non_spacing_mark: new RegExp("[\\u0300-\\u036F\\u0483-\\u0487\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0610-\\u061A\\u064B-\\u065E\\u0670\\u06D6-\\u06DC\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0900-\\u0902\\u093C\\u0941-\\u0948\\u094D\\u0951-\\u0955\\u0962\\u0963\\u0981\\u09BC\\u09C1-\\u09C4\\u09CD\\u09E2\\u09E3\\u0A01\\u0A02\\u0A3C\\u0A41\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81\\u0A82\\u0ABC\\u0AC1-\\u0AC5\\u0AC7\\u0AC8\\u0ACD\\u0AE2\\u0AE3\\u0B01\\u0B3C\\u0B3F\\u0B41-\\u0B44\\u0B4D\\u0B56\\u0B62\\u0B63\\u0B82\\u0BC0\\u0BCD\\u0C3E-\\u0C40\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0CBC\\u0CBF\\u0CC6\\u0CCC\\u0CCD\\u0CE2\\u0CE3\\u0D41-\\u0D44\\u0D4D\\u0D62\\u0D63\\u0DCA\\u0DD2-\\u0DD4\\u0DD6\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EB9\\u0EBB\\u0EBC\\u0EC8-\\u0ECD\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F71-\\u0F7E\\u0F80-\\u0F84\\u0F86\\u0F87\\u0F90-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102D-\\u1030\\u1032-\\u1037\\u1039\\u103A\\u103D\\u103E\\u1058\\u1059\\u105E-\\u1060\\u1071-\\u1074\\u1082\\u1085\\u1086\\u108D\\u109D\\u135F\\u1712-\\u1714\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B7-\\u17BD\\u17C6\\u17C9-\\u17D3\\u17DD\\u180B-\\u180D\\u18A9\\u1920-\\u1922\\u1927\\u1928\\u1932\\u1939-\\u193B\\u1A17\\u1A18\\u1A56\\u1A58-\\u1A5E\\u1A60\\u1A62\\u1A65-\\u1A6C\\u1A73-\\u1A7C\\u1A7F\\u1B00-\\u1B03\\u1B34\\u1B36-\\u1B3A\\u1B3C\\u1B42\\u1B6B-\\u1B73\\u1B80\\u1B81\\u1BA2-\\u1BA5\\u1BA8\\u1BA9\\u1C2C-\\u1C33\\u1C36\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE0\\u1CE2-\\u1CE8\\u1CED\\u1DC0-\\u1DE6\\u1DFD-\\u1DFF\\u20D0-\\u20DC\\u20E1\\u20E5-\\u20F0\\u2CEF-\\u2CF1\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F\\uA67C\\uA67D\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA825\\uA826\\uA8C4\\uA8E0-\\uA8F1\\uA926-\\uA92D\\uA947-\\uA951\\uA980-\\uA982\\uA9B3\\uA9B6-\\uA9B9\\uA9BC\\uAA29-\\uAA2E\\uAA31\\uAA32\\uAA35\\uAA36\\uAA43\\uAA4C\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uABE5\\uABE8\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE26]"),
        space_combining_mark: new RegExp("[\\u0903\\u093E-\\u0940\\u0949-\\u094C\\u094E\\u0982\\u0983\\u09BE-\\u09C0\\u09C7\\u09C8\\u09CB\\u09CC\\u09D7\\u0A03\\u0A3E-\\u0A40\\u0A83\\u0ABE-\\u0AC0\\u0AC9\\u0ACB\\u0ACC\\u0B02\\u0B03\\u0B3E\\u0B40\\u0B47\\u0B48\\u0B4B\\u0B4C\\u0B57\\u0BBE\\u0BBF\\u0BC1\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCC\\u0BD7\\u0C01-\\u0C03\\u0C41-\\u0C44\\u0C82\\u0C83\\u0CBE\\u0CC0-\\u0CC4\\u0CC7\\u0CC8\\u0CCA\\u0CCB\\u0CD5\\u0CD6\\u0D02\\u0D03\\u0D3E-\\u0D40\\u0D46-\\u0D48\\u0D4A-\\u0D4C\\u0D57\\u0D82\\u0D83\\u0DCF-\\u0DD1\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0F3E\\u0F3F\\u0F7F\\u102B\\u102C\\u1031\\u1038\\u103B\\u103C\\u1056\\u1057\\u1062-\\u1064\\u1067-\\u106D\\u1083\\u1084\\u1087-\\u108C\\u108F\\u109A-\\u109C\\u17B6\\u17BE-\\u17C5\\u17C7\\u17C8\\u1923-\\u1926\\u1929-\\u192B\\u1930\\u1931\\u1933-\\u1938\\u19B0-\\u19C0\\u19C8\\u19C9\\u1A19-\\u1A1B\\u1A55\\u1A57\\u1A61\\u1A63\\u1A64\\u1A6D-\\u1A72\\u1B04\\u1B35\\u1B3B\\u1B3D-\\u1B41\\u1B43\\u1B44\\u1B82\\u1BA1\\u1BA6\\u1BA7\\u1BAA\\u1C24-\\u1C2B\\u1C34\\u1C35\\u1CE1\\u1CF2\\uA823\\uA824\\uA827\\uA880\\uA881\\uA8B4-\\uA8C3\\uA952\\uA953\\uA983\\uA9B4\\uA9B5\\uA9BA\\uA9BB\\uA9BD-\\uA9C0\\uAA2F\\uAA30\\uAA33\\uAA34\\uAA4D\\uAA7B\\uABE3\\uABE4\\uABE6\\uABE7\\uABE9\\uABEA\\uABEC]"),
        connector_punctuation: new RegExp("[\\u005F\\u203F\\u2040\\u2054\\uFE33\\uFE34\\uFE4D-\\uFE4F\\uFF3F]")
};

function is_letter(ch) {
        return UNICODE.letter.test(ch);
};

function is_digit(ch) {
        ch = ch.charCodeAt(0);
        return ch >= 48 && ch <= 57; //XXX: find out if "UnicodeDigit" means something else than 0..9
};

function is_alphanumeric_char(ch) {
        return is_digit(ch) || is_letter(ch);
};

function is_unicode_combining_mark(ch) {
        return UNICODE.non_spacing_mark.test(ch) || UNICODE.space_combining_mark.test(ch);
};

function is_unicode_connector_punctuation(ch) {
        return UNICODE.connector_punctuation.test(ch);
};

function is_identifier_start(ch) {
        return ch == "$" || ch == "_" || is_letter(ch);
};

function is_identifier_char(ch) {
        return is_identifier_start(ch)
                || is_unicode_combining_mark(ch)
                || is_digit(ch)
                || is_unicode_connector_punctuation(ch)
                || ch == "\u200c" // zero-width non-joiner <ZWNJ>
                || ch == "\u200d" // zero-width joiner <ZWJ> (in my ECMA-262 PDF, this is also 200c)
        ;
};

function parse_js_number(num) {
        if (RE_HEX_NUMBER.test(num)) {
                return parseInt(num.substr(2), 16);
        } else if (RE_OCT_NUMBER.test(num)) {
                return parseInt(num.substr(1), 8);
        } else if (RE_DEC_NUMBER.test(num)) {
                return parseFloat(num);
        }
};

function JS_Parse_Error(message, line, col, pos) {
        this.message = message;
        this.line = line;
        this.col = col;
        this.pos = pos;
        try {
                ({})();
        } catch(ex) {
                this.stack = ex.stack;
        };
};

JS_Parse_Error.prototype.toString = function() {
        return this.message + " (line: " + this.line + ", col: " + this.col + ", pos: " + this.pos + ")" + "\n\n" + this.stack;
};

function js_error(message, line, col, pos) {
        throw new JS_Parse_Error(message, line, col, pos);
};

function is_token(token, type, val) {
        return token.type == type && (val == null || token.value == val);
};

var EX_EOF = {};

function tokenizer($TEXT) {

        var S = {
                text            : $TEXT.replace(/\r\n?|[\n\u2028\u2029]/g, "\n").replace(/^\uFEFF/, ''),
                pos             : 0,
                tokpos          : 0,
                line            : 0,
                tokline         : 0,
                col             : 0,
                tokcol          : 0,
                newline_before  : false,
                regex_allowed   : false,
                comments_before : []
        };

        function peek() { return S.text.charAt(S.pos); };

        function next(signal_eof) {
                var ch = S.text.charAt(S.pos++);
                if (signal_eof && !ch)
                        throw EX_EOF;
                if (ch == "\n") {
                        S.newline_before = true;
                        ++S.line;
                        S.col = 0;
                } else {
                        ++S.col;
                }
                return ch;
        };

        function eof() {
                return !S.peek();
        };

        function find(what, signal_eof) {
                var pos = S.text.indexOf(what, S.pos);
                if (signal_eof && pos == -1) throw EX_EOF;
                return pos;
        };

        function start_token() {
                S.tokline = S.line;
                S.tokcol = S.col;
                S.tokpos = S.pos;
        };

        function token(type, value, is_comment) {
                S.regex_allowed = ((type == "operator" && !HOP(UNARY_POSTFIX, value)) ||
                                   (type == "keyword" && HOP(KEYWORDS_BEFORE_EXPRESSION, value)) ||
                                   (type == "punc" && HOP(PUNC_BEFORE_EXPRESSION, value)));
                var ret = {
                        type  : type,
                        value : value,
                        line  : S.tokline,
                        col   : S.tokcol,
                        pos   : S.tokpos,
                        nlb   : S.newline_before
                };
                if (!is_comment) {
                        ret.comments_before = S.comments_before;
                        S.comments_before = [];
                }
                S.newline_before = false;
                return ret;
        };

        function skip_whitespace() {
                while (HOP(WHITESPACE_CHARS, peek()))
                        next();
        };

        function read_while(pred) {
                var ret = "", ch = peek(), i = 0;
                while (ch && pred(ch, i++)) {
                        ret += next();
                        ch = peek();
                }
                return ret;
        };

        function parse_error(err) {
                js_error(err, S.tokline, S.tokcol, S.tokpos);
        };

        function read_num(prefix) {
                var has_e = false, after_e = false, has_x = false, has_dot = prefix == ".";
                var num = read_while(function(ch, i){
                        if (ch == "x" || ch == "X") {
                                if (has_x) return false;
                                return has_x = true;
                        }
                        if (!has_x && (ch == "E" || ch == "e")) {
                                if (has_e) return false;
                                return has_e = after_e = true;
                        }
                        if (ch == "-") {
                                if (after_e || (i == 0 && !prefix)) return true;
                                return false;
                        }
                        if (ch == "+") return after_e;
                        after_e = false;
                        if (ch == ".") {
                                if (!has_dot && !has_x)
                                        return has_dot = true;
                                return false;
                        }
                        return is_alphanumeric_char(ch);
                });
                if (prefix)
                        num = prefix + num;
                var valid = parse_js_number(num);
                if (!isNaN(valid)) {
                        return token("num", valid);
                } else {
                        parse_error("Invalid syntax: " + num);
                }
        };

        function read_escaped_char() {
                var ch = next(true);
                switch (ch) {
                    case "n" : return "\n";
                    case "r" : return "\r";
                    case "t" : return "\t";
                    case "b" : return "\b";
                    case "v" : return "\v";
                    case "f" : return "\f";
                    case "0" : return "\0";
                    case "x" : return String.fromCharCode(hex_bytes(2));
                    case "u" : return String.fromCharCode(hex_bytes(4));
                    case "\n": return "";
                    default  : return ch;
                }
        };

        function hex_bytes(n) {
                var num = 0;
                for (; n > 0; --n) {
                        var digit = parseInt(next(true), 16);
                        if (isNaN(digit))
                                parse_error("Invalid hex-character pattern in string");
                        num = (num << 4) | digit;
                }
                return num;
        };

        function read_string() {
                return with_eof_error("Unterminated string constant", function(){
                        var quote = next(), ret = "";
                        for (;;) {
                                var ch = next(true);
                                if (ch == "\\") ch = read_escaped_char();
                                else if (ch == quote) break;
                                ret += ch;
                        }
                        return token("string", ret);
                });
        };

        function read_line_comment() {
                next();
                var i = find("\n"), ret;
                if (i == -1) {
                        ret = S.text.substr(S.pos);
                        S.pos = S.text.length;
                } else {
                        ret = S.text.substring(S.pos, i);
                        S.pos = i;
                }
                return token("comment1", ret, true);
        };

        function read_multiline_comment() {
                next();
                return with_eof_error("Unterminated multiline comment", function(){
                        var i = find("*/", true),
                            text = S.text.substring(S.pos, i),
                            tok = token("comment2", text, true);
                        S.pos = i + 2;
                        S.line += text.split("\n").length - 1;
                        S.newline_before = text.indexOf("\n") >= 0;

                        // https://github.com/mishoo/UglifyJS/issues/#issue/100
                        if (/^@cc_on/i.test(text)) {
                                warn("WARNING: at line " + S.line);
                                warn("*** Found \"conditional comment\": " + text);
                                warn("*** UglifyJS DISCARDS ALL COMMENTS.  This means your code might no longer work properly in Internet Explorer.");
                        }

                        return tok;
                });
        };

        function read_name() {
                var backslash = false, name = "", ch;
                while ((ch = peek()) != null) {
                        if (!backslash) {
                                if (ch == "\\") backslash = true, next();
                                else if (is_identifier_char(ch)) name += next();
                                else break;
                        }
                        else {
                                if (ch != "u") parse_error("Expecting UnicodeEscapeSequence -- uXXXX");
                                ch = read_escaped_char();
                                if (!is_identifier_char(ch)) parse_error("Unicode char: " + ch.charCodeAt(0) + " is not valid in identifier");
                                name += ch;
                                backslash = false;
                        }
                }
                return name;
        };

        function read_regexp() {
                return with_eof_error("Unterminated regular expression", function(){
                        var prev_backslash = false, regexp = "", ch, in_class = false;
                        while ((ch = next(true))) if (prev_backslash) {
                                regexp += "\\" + ch;
                                prev_backslash = false;
                        } else if (ch == "[") {
                                in_class = true;
                                regexp += ch;
                        } else if (ch == "]" && in_class) {
                                in_class = false;
                                regexp += ch;
                        } else if (ch == "/" && !in_class) {
                                break;
                        } else if (ch == "\\") {
                                prev_backslash = true;
                        } else {
                                regexp += ch;
                        }
                        var mods = read_name();
                        return token("regexp", [ regexp, mods ]);
                });
        };

        function read_operator(prefix) {
                function grow(op) {
                        if (!peek()) return op;
                        var bigger = op + peek();
                        if (HOP(OPERATORS, bigger)) {
                                next();
                                return grow(bigger);
                        } else {
                                return op;
                        }
                };
                return token("operator", grow(prefix || next()));
        };

        function handle_slash() {
                next();
                var regex_allowed = S.regex_allowed;
                switch (peek()) {
                    case "/":
                        S.comments_before.push(read_line_comment());
                        S.regex_allowed = regex_allowed;
                        return next_token();
                    case "*":
                        S.comments_before.push(read_multiline_comment());
                        S.regex_allowed = regex_allowed;
                        return next_token();
                }
                return S.regex_allowed ? read_regexp() : read_operator("/");
        };

        function handle_dot() {
                next();
                return is_digit(peek())
                        ? read_num(".")
                        : token("punc", ".");
        };

        function read_word() {
                var word = read_name();
                return !HOP(KEYWORDS, word)
                        ? token("name", word)
                        : HOP(OPERATORS, word)
                        ? token("operator", word)
                        : HOP(KEYWORDS_ATOM, word)
                        ? token("atom", word)
                        : token("keyword", word);
        };

        function with_eof_error(eof_error, cont) {
                try {
                        return cont();
                } catch(ex) {
                        if (ex === EX_EOF) parse_error(eof_error);
                        else throw ex;
                }
        };

        function next_token(force_regexp) {
                if (force_regexp)
                        return read_regexp();
                skip_whitespace();
                start_token();
                var ch = peek();
                if (!ch) return token("eof");
                if (is_digit(ch)) return read_num();
                if (ch == '"' || ch == "'") return read_string();
                if (HOP(PUNC_CHARS, ch)) return token("punc", next());
                if (ch == ".") return handle_dot();
                if (ch == "/") return handle_slash();
                if (HOP(OPERATOR_CHARS, ch)) return read_operator();
                if (ch == "\\" || is_identifier_start(ch)) return read_word();
                parse_error("Unexpected character '" + ch + "'");
        };

        next_token.context = function(nc) {
                if (nc) S = nc;
                return S;
        };

        return next_token;

};

/* -----[ Parser (constants) ]----- */

var UNARY_PREFIX = array_to_hash([
        "typeof",
        "void",
        "delete",
        "--",
        "++",
        "!",
        "~",
        "-",
        "+"
]);

var UNARY_POSTFIX = array_to_hash([ "--", "++" ]);

var ASSIGNMENT = (function(a, ret, i){
        while (i < a.length) {
                ret[a[i]] = a[i].substr(0, a[i].length - 1);
                i++;
        }
        return ret;
})(
        ["+=", "-=", "/=", "*=", "%=", ">>=", "<<=", ">>>=", "|=", "^=", "&="],
        { "=": true },
        0
);

var PRECEDENCE = (function(a, ret){
        for (var i = 0, n = 1; i < a.length; ++i, ++n) {
                var b = a[i];
                for (var j = 0; j < b.length; ++j) {
                        ret[b[j]] = n;
                }
        }
        return ret;
})(
        [
                ["||"],
                ["&&"],
                ["|"],
                ["^"],
                ["&"],
                ["==", "===", "!=", "!=="],
                ["<", ">", "<=", ">=", "in", "instanceof"],
                [">>", "<<", ">>>"],
                ["+", "-"],
                ["*", "/", "%"]
        ],
        {}
);

var STATEMENTS_WITH_LABELS = array_to_hash([ "for", "do", "while", "switch" ]);

var ATOMIC_START_TOKEN = array_to_hash([ "atom", "num", "string", "regexp", "name" ]);

/* -----[ Parser ]----- */

var imports = [];

function NodeWithToken(str, start, end) {
        this.name = str;
        this.start = start;
        this.end = end;
};

NodeWithToken.prototype.toString = function() { return this.name; };

function qmlparse($TEXT, exigent_mode, embed_tokens) {

        var S = {
                input       : typeof $TEXT == "string" ? tokenizer($TEXT, true) : $TEXT,
                token       : null,
                prev        : null,
                peeked      : null,
                in_function : 0,
                in_loop     : 0,
                labels      : []
        };

        S.token = next();

        function is(type, value) {
                return is_token(S.token, type, value);
        };

        function peek() { return S.peeked || (S.peeked = S.input()); };

        function next() {
                S.prev = S.token;
                if (S.peeked) {
                        S.token = S.peeked;
                        S.peeked = null;
                } else {
                        S.token = S.input();
                }
                return S.token;
        };

        function prev() {
                return S.prev;
        };

        function croak(msg, line, col, pos) {
                var ctx = S.input.context();
                js_error(msg,
                         line != null ? line : ctx.tokline,
                         col != null ? col : ctx.tokcol,
                         pos != null ? pos : ctx.tokpos);
        };

        function token_error(token, msg) {
                croak(msg, token.line, token.col);
        };

        function unexpected(token) {
                if (token == null)
                        token = S.token;
                token_error(token, "Unexpected token: " + token.type + " (" + token.value + ")");
        };

        function expect_token(type, val) {
                if (is(type, val)) {
                        return next();
                }
                token_error(S.token, "Unexpected token " + S.token.type + " " + S.token.val + ", expected " + type + " " + val);
        };

        function expect(punc) { return expect_token("punc", punc); };

        function can_insert_semicolon() {
                return !exigent_mode && (
                        S.token.nlb || is("eof") || is("punc", "}")
                );
        };

        function semicolon() {
                if (is("punc", ";")) next();
                else if (!can_insert_semicolon()) unexpected();
        };

        function as() {
                return slice(arguments);
        };

        function parenthesised() {
                expect("(");
                var ex = expression();
                expect(")");
                return ex;
        };

        function add_tokens(str, start, end) {
                return str instanceof NodeWithToken ? str : new NodeWithToken(str, start, end);
        };

        function maybe_embed_tokens(parser) {
                if (embed_tokens) return function() {
                        var start = S.token;
                        var ast = parser.apply(this, arguments);
                        ast[0] = add_tokens(ast[0], start, prev());
                        return ast;
                };
                else return parser;
        };

        var statement = maybe_embed_tokens(function() {
                if (is("operator", "/")) {
                        S.peeked = null;
                        S.token = S.input(true); // force regexp
                }
                switch (S.token.type) {
                    case "num":
                    case "string":
                    case "regexp":
                    case "operator":
                    case "atom":
                        return simple_statement();

                    case "name":
                        return is_token(peek(), "punc", ":")
                                ? labeled_statement(prog1(S.token.value, next, next))
                                : simple_statement();

                    case "punc":
                        switch (S.token.value) {
                            case "{":
                                return as("block", block_());
                            case "[":
                            case "(":
                                return simple_statement();
                            case ";":
                                next();
                                return as("block");
                            default:
                                unexpected();
                        }

                    case "keyword":
                        switch (prog1(S.token.value, next)) {
                            case "break":
                                return break_cont("break");

                            case "continue":
                                return break_cont("continue");

                            case "debugger":
                                semicolon();
                                return as("debugger");

                            case "do":
                                return (function(body){
                                        expect_token("keyword", "while");
                                        return as("do", prog1(parenthesised, semicolon), body);
                                })(in_loop(statement));

                            case "for":
                                return for_();

                            case "function":
                                return function_(true);

                            case "if":
                                return if_();

                            case "return":
                                if (S.in_function == 0)
                                        croak("'return' outside of function");
                                return as("return",
                                          is("punc", ";")
                                          ? (next(), null)
                                          : can_insert_semicolon()
                                          ? null
                                          : prog1(expression, semicolon));

                            case "switch":
                                return as("switch", parenthesised(), switch_block_());

                            case "throw":
                                return as("throw", prog1(expression, semicolon));

                            case "try":
                                return try_();

                            case "var":
                                return prog1(var_, semicolon);

                            case "const":
                                return prog1(const_, semicolon);

                            case "while":
                                return as("while", parenthesised(), in_loop(statement));

                            case "with":
                                return as("with", parenthesised(), statement());

                            default:
                                unexpected();
                        }
                }
        });

        function labeled_statement(label) {
                S.labels.push(label);
                var start = S.token, stat = statement();
                if (exigent_mode && !HOP(STATEMENTS_WITH_LABELS, stat[0]))
                        unexpected(start);
                S.labels.pop();
                return as("label", label, stat);
        };

        function simple_statement() {
                return as("stat", prog1(expression, semicolon));
        };

        function break_cont(type) {
                var name = is("name") ? S.token.value : null;
                if (name != null) {
                        next();
                        if (!member(name, S.labels))
                                croak("Label " + name + " without matching loop or statement");
                }
                else if (S.in_loop == 0)
                        croak(type + " not inside a loop or switch");
                semicolon();
                return as(type, name);
        };

        function for_() {
                expect("(");
                var init = null;
                if (!is("punc", ";")) {
                        init = is("keyword", "var")
                                ? (next(), var_(true))
                                : expression(true, true);
                        if (is("operator", "in"))
                                return for_in(init);
                }
                return regular_for(init);
        };

        function regular_for(init) {
                expect(";");
                var test = is("punc", ";") ? null : expression();
                expect(";");
                var step = is("punc", ")") ? null : expression();
                expect(")");
                return as("for", init, test, step, in_loop(statement));
        };

        function for_in(init) {
                var lhs = init[0] == "var" ? as("name", init[1][0]) : init;
                next();
                var obj = expression();
                expect(")");
                return as("for-in", init, lhs, obj, in_loop(statement));
        };

        var function_ = maybe_embed_tokens(function(in_statement) {
                var name = is("name") ? prog1(S.token.value, next) : null;
                if (in_statement && !name)
                        unexpected();
                expect("(");
                return as(in_statement ? "defun" : "function",
                          name,
                          // arguments
                          (function(first, a){
                                  while (!is("punc", ")")) {
                                          if (first) first = false; else expect(",");
                                          if (!is("name")) unexpected();
                                          a.push(S.token.value);
                                          next();
                                  }
                                  next();
                                  return a;
                          })(true, []),
                          // body
                          (function(){
                                  ++S.in_function;
                                  var loop = S.in_loop;
                                  S.in_loop = 0;
                                  var a = block_();
                                  --S.in_function;
                                  S.in_loop = loop;
                                  return a;
                          })());
        });

        function if_() {
                var cond = parenthesised(), body = statement(), belse;
                if (is("keyword", "else")) {
                        next();
                        belse = statement();
                }
                return as("if", cond, body, belse);
        };

        function block_() {
                expect("{");
                var a = [];
                while (!is("punc", "}")) {
                        if (is("eof")) unexpected();
                        a.push(statement());
                }
                next();
                return a;
        };

        var switch_block_ = curry(in_loop, function(){
                expect("{");
                var a = [], cur = null;
                while (!is("punc", "}")) {
                        if (is("eof")) unexpected();
                        if (is("keyword", "case")) {
                                next();
                                cur = [];
                                a.push([ expression(), cur ]);
                                expect(":");
                        }
                        else if (is("keyword", "default")) {
                                next();
                                expect(":");
                                cur = [];
                                a.push([ null, cur ]);
                        }
                        else {
                                if (!cur) unexpected();
                                cur.push(statement());
                        }
                }
                next();
                return a;
        });

        function try_() {
                var body = block_(), bcatch, bfinally;
                if (is("keyword", "catch")) {
                        next();
                        expect("(");
                        if (!is("name"))
                                croak("Name expected");
                        var name = S.token.value;
                        next();
                        expect(")");
                        bcatch = [ name, block_() ];
                }
                if (is("keyword", "finally")) {
                        next();
                        bfinally = block_();
                }
                if (!bcatch && !bfinally)
                        croak("Missing catch/finally blocks");
                return as("try", body, bcatch, bfinally);
        };

        function vardefs(no_in) {
                var a = [];
                for (;;) {
                        if (!is("name"))
                                unexpected();
                        var name = S.token.value;
                        next();
                        if (is("operator", "=")) {
                                next();
                                a.push([ name, expression(false, no_in) ]);
                        } else {
                                a.push([ name ]);
                        }
                        if (!is("punc", ","))
                                break;
                        next();
                }
                return a;
        };

        function var_(no_in) {
                return as("var", vardefs(no_in));
        };

        function const_() {
                return as("const", vardefs());
        };

        function new_() {
                var newexp = expr_atom(false), args;
                if (is("punc", "(")) {
                        next();
                        args = expr_list(")");
                } else {
                        args = [];
                }
                return subscripts(as("new", newexp, args), true);
        };

        var expr_atom = maybe_embed_tokens(function(allow_calls) {
                if (is("operator", "new")) {
                        next();
                        return new_();
                }
                if (is("operator") && HOP(UNARY_PREFIX, S.token.value)) {
                        return make_unary("unary-prefix",
                                          prog1(S.token.value, next),
                                          expr_atom(allow_calls));
                }
                if (is("punc")) {
                        switch (S.token.value) {
                            case "(":
                                next();
                                return subscripts(prog1(expression, curry(expect, ")")), allow_calls);
                            case "[":
                                next();
                                return subscripts(array_(), allow_calls);
                            case "{":
                                next();
                                return subscripts(object_(), allow_calls);
                        }
                        unexpected();
                }
                if (is("keyword", "function")) {
                        next();
                        return subscripts(function_(false), allow_calls);
                }
                if (HOP(ATOMIC_START_TOKEN, S.token.type)) {
                        var atom = S.token.type == "regexp"
                                ? as("regexp", S.token.value[0], S.token.value[1])
                                : as(S.token.type, S.token.value);
                        return subscripts(prog1(atom, next), allow_calls);
                }
                unexpected();
        });

        function expr_list(closing, allow_trailing_comma, allow_empty) {
                var first = true, a = [];
                while (!is("punc", closing)) {
                        if (first) first = false; else expect(",");
                        if (allow_trailing_comma && is("punc", closing)) break;
                        if (is("punc", ",") && allow_empty) {
                                a.push([ "atom", "undefined" ]);
                        } else {
                                a.push(expression(false));
                        }
                }
                next();
                return a;
        };

        function array_() {
                return as("array", expr_list("]", !exigent_mode, true));
        };

        function object_() {
                var first = true, a = [];
                while (!is("punc", "}")) {
                        if (first) first = false; else expect(",");
                        if (!exigent_mode && is("punc", "}"))
                                // allow trailing comma
                                break;
                        var type = S.token.type;
                        var name = as_property_name();
                        if (type == "name" && (name == "get" || name == "set") && !is("punc", ":")) {
                                a.push([ as_name(), function_(false), name ]);
                        } else {
                                expect(":");
                                a.push([ name, expression(false) ]);
                        }
                }
                next();
                return as("object", a);
        };

        function as_property_name() {
                switch (S.token.type) {
                    case "num":
                    case "string":
                        return prog1(S.token.value, next);
                }
                return as_name();
        };

        function as_name() {
                switch (S.token.type) {
                    case "name":
                    case "operator":
                    case "keyword":
                    case "atom":
                        return prog1(S.token.value, next);
                    default:
                        unexpected();
                }
        };

        function subscripts(expr, allow_calls) {
                if (is("punc", ".")) {
                        next();
                        return subscripts(as("dot", expr, as_name()), allow_calls);
                }
                if (is("punc", "[")) {
                        next();
                        return subscripts(as("sub", expr, prog1(expression, curry(expect, "]"))), allow_calls);
                }
                if (allow_calls && is("punc", "(")) {
                        next();
                        return subscripts(as("call", expr, expr_list(")")), true);
                }
                if (allow_calls && is("operator") && HOP(UNARY_POSTFIX, S.token.value)) {
                        return prog1(curry(make_unary, "unary-postfix", S.token.value, expr),
                                     next);
                }
                return expr;
        };

        function make_unary(tag, op, expr) {
                if ((op == "++" || op == "--") && !is_assignable(expr))
                        croak("Invalid use of " + op + " operator");
                return as(tag, op, expr);
        };

        function expr_op(left, min_prec, no_in) {
                var op = is("operator") ? S.token.value : null;
                if (op && op == "in" && no_in) op = null;
                var prec = op != null ? PRECEDENCE[op] : null;
                if (prec != null && prec > min_prec) {
                        next();
                        var right = expr_op(expr_atom(true), prec, no_in);
                        return expr_op(as("binary", op, left, right), min_prec, no_in);
                }
                return left;
        };

        function expr_ops(no_in) {
                return expr_op(expr_atom(true), 0, no_in);
        };

        function maybe_conditional(no_in) {
                var expr = expr_ops(no_in);
                if (is("operator", "?")) {
                        next();
                        var yes = expression(false);
                        expect(":");
                        return as("conditional", expr, yes, expression(false, no_in));
                }
                return expr;
        };

        function is_assignable(expr) {
                if (!exigent_mode) return true;
                switch (expr[0]) {
                    case "dot":
                    case "sub":
                    case "new":
                    case "call":
                        return true;
                    case "name":
                        return expr[1] != "this";
                }
        };

        function maybe_assign(no_in) {
                var left = maybe_conditional(no_in), val = S.token.value;
                if (is("operator") && HOP(ASSIGNMENT, val)) {
                        if (is_assignable(left)) {
                                next();
                                return as("assign", ASSIGNMENT[val], left, maybe_assign(no_in));
                        }
                        croak("Invalid assignment");
                }
                return left;
        };

        function maybe_qmlelem(no_in) {
                var expr = maybe_assign(no_in);
                if (is("punc", "{"))
                    return as("qmlelem", expr[1], undefined, qmlblock());
                return expr;
        };

        var expression = maybe_embed_tokens(function(commas, no_in) {
                if (arguments.length == 0)
                        commas = true;
                var expr = maybe_qmlelem(no_in);
                if (commas && is("punc", ",")) {
                        next();
                        return as("seq", expr, expression(true, no_in));
                }
                return expr;
        });

        function in_loop(cont) {
                try {
                        ++S.in_loop;
                        return cont();
                } finally {
                        --S.in_loop;
                }
        };

        function qml_is_element(str) {
            return str[0].toUpperCase() == str[0];
        }

        function qmlblock() {
            expect("{");
            var a = [];
            while (!is("punc", "}")) {
                if (is("eof")) unexpected();
                a.push(qmlstatement());
            }
            expect("}");
            return a;
        }

        function qmlproperty() {
            switch (S.token.type) {
                case "name":
                    return as("qmlbinding", statement());
                case "num":
                case "string":
                    return as("qmlvalue", prog1(S.token.value, next,
                        semicolon));
                default:
                    todo();
            }
        }

        function qmlpropdef() {
            var type = S.token.value;
            next();
            var name = S.token.value;
            next();
            if (type == "alias") {
                expect(":");
                if (!is("name")) unexpected();
                var objName = S.token.value;
                next();
                if (is("punc", ".")) {
                    next();
                    if (!is("name")) unexpected();
                    var propName = S.token.value;
                    next();
                }
                return as("qmlaliasdef", name, objName, propName);
            }
            if (is("punc", ":")) {
                next();
                S.in_function++;
                var from = S.token.pos,
                    stat = statement(),
                    to = S.token.pos;
                S.in_function--;
                return as("qmlpropdef", name, type, stat,
                        $TEXT.substr(from, to - from));
            } else if (is("punc", ";"))
                next();
            return as("qmlpropdef", name, type);

        }

        function qmldefaultprop() {
            next();
            expect_token("name", "property");

            return as("qmldefaultprop", qmlpropdef());
        }

        function qmlsignaldef() {
            next();
            var name = S.token.value;
            next();
            var args = [];
            if (is("punc", "(")) {
                next();
                var first = true;
                while (!is("punc", ")")) {
                        if (first) first = false; else expect(",");
                        if (!is("name")) unexpected();
                        var type = S.token.value;
                        next();
                        if (!is("name")) unexpected();
                        args.push({type: type, name: S.token.value});
                        next();
                }
                next();
            }
            if (is("punc", ";"))
                next();
            return as("qmlsignaldef", name, args);

        }

        function qmlstatement() {
            if (is("keyword", "function")) {
                var from = S.token.pos;
                next();
                var stat = function_(true);
                var to = S.token.pos;
                var name = stat[1];
                return as("qmlmethod", name, stat,
                    $TEXT.substr(from, to - from));
            } else if (is("name", "signal")) {
                return qmlsignaldef();
            } else if (S.token.type == "name") {
                var propname = S.token.value;
                next();
                if (propname == "property" && (S.token.type == "name" || S.token.value == "var")) {
                    return qmlpropdef();
                } else if (qml_is_element(propname) && !is("punc", ".")) {
                    // Element
                    var onProp;
                    if (is("name", "on")) {
                        next();
                        onProp = S.token.value;
                        next();
                    }
                    return as("qmlelem", propname, onProp, qmlblock());
                } else {
                    // property statement
                    if (is("punc", ".")) {
                        // anchors, fonts etc, a.b: statement;
                        // Can also be Component.onCompleted: ...
                        // Assume only one subproperty
                        next();
                        var subname = S.token.value;
                        next();
                        expect(":");
                        S.in_function++;
                        var from = S.token.pos,
                            stat = statement(),
                            to = S.token.pos;
                        S.in_function--;
                        return as("qmlobjdef", propname, subname, stat,
                            $TEXT.substr(from, to - from));
                    } else if (is("punc", "{")) {
                        return as("qmlobj", propname, qmlblock());
                    } else {
                        // Evaluatable item
                        expect(":");
                        S.in_function++;
                        var from = S.token.pos,
                            stat = statement(),
                            to = S.token.pos;
                        S.in_function--;
                        return as("qmlprop", propname, stat,
                            $TEXT.substr(from, to - from));
                    }
                }
            } else if (is("keyword", "default")) {
                return qmldefaultprop();
            } else {
                todo();
            }
        }

        function qmlimport() {
          var subject = null,
              version = null,
              alias = null;
          var gettingAlias = false;
          var gettingNameSubPart = false;
          var currentLine = S.token.line;

          next();
          while ((S.token.type != 'punc' || S.token.value == '.') && S.token.line == currentLine) {
            if (S.token.type == 'punc' && S.token.value == '.')
              gettingNameSubPart = true;
            else if (gettingNameSubPart == true) {
              subject += '.' + S.token.value;
              gettingNameSubPart = false;
            }
            else if (subject == null)
              subject = S.token.value;
            else if (gettingAlias == false) {
              if (S.token.value == 'as')
                gettingAlias = true;
              else if (version == null)
                version = S.token.value;
            }
            else
              alias = S.token.value;
            next();
          }
          while (S.token.type == 'punc') { next(); }
          imports.push({ subject: subject, version: version, alias: alias });
        }

        function qmldocument() {
            imports = [];
            while (is("name", "import"))
              qmlimport();
            var statement =  qmlstatement();
            statement.push('imports');
            statement.push(imports);
            return statement;
        };

        function amIn(s) {
            console && console.log(s, clone(S), S.token.type, S.token.value);
        }
        function todo() {
            amIn("todo parse:");
            next();
        }

        return as("toplevel", (function(a){
                while (!is("eof"))
                        a.push(qmldocument());
//                        a.push(statement());
                return a;
        })([]));

};

/* -----[ Utilities ]----- */

function curry(f) {
        var args = slice(arguments, 1);
        return function() { return f.apply(this, args.concat(slice(arguments))); };
};

function prog1(ret) {
        if (ret instanceof Function)
                ret = ret();
        for (var i = 1, n = arguments.length; --n > 0; ++i)
                arguments[i]();
        return ret;
};

function array_to_hash(a) {
        var ret = {};
        for (var i = 0; i < a.length; ++i)
                ret[a[i]] = true;
        return ret;
};

function slice(a, start) {
        return Array.prototype.slice.call(a, start == null ? 0 : start);
};

function characters(str) {
        return str.split("");
};

function member(name, array) {
        for (var i = array.length; --i >= 0;)
                if (array[i] === name)
                        return true;
        return false;
};

function HOP(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
};

var warn = function() {};

QMLMethod.prototype = new QMLBinding();
function QMLMethod(src) {
    this.src = src;
}

/**
 * Create an object representing a QML property definition.
 * @param {String} type The type of the property
 * @param {Array} value The default value of the property
 * @return {Object} Object representing the defintion
 */
function QMLPropertyDefinition(type, value) {
    this.type = type;
    this.value = value;
}

function QMLAliasDefinition(objName, propName) {
    this.objectName = objName;
    this.propertyName = propName;
}

/**
 * Create an object representing a QML signal definition.
 * @param {Array} params The parameters the signal ships
 * @return {Object} Object representing the defintion
 */
function QMLSignalDefinition(params) {
    this.parameters = params;
}

/**
 * Create an object representing a group of QML properties (like anchors).
 * @return {Object} Object representing the group
 */
function QMLMetaPropertyGroup() {}

/**
 * Create an object representing a QML element.
 * @param {String} type The type of the element
 * @param {String} onProp The name of the property specified with the "on" keyword
 */
function QMLMetaElement(type, onProp) {
    this.$class = type;
    this.$children = [];
    this.$on = onProp;
}

// Convert parser tree to the format understood by engine
function convertToEngine(tree) {

    // Help logger
    function amIn(str, tree) {
        console.log(str);
        if (tree) console.log(JSON.stringify(tree, null, "  "));
    }

    var walkers = {
        "toplevel": function(statements) {
            var item = { $class: "QMLDocument" };

            for (var i = 0 ; i < statements[0].length ; ++i) {
              if (statements[0][i] == 'imports') {
                item.$imports = statements[0][i + 1];
                break ;
              }
            }
            item.$children = [ walk(statements[0]) ];
            return item;
        },
        "qmlelem": function(elem, onProp, statements) {
            var item = new QMLMetaElement(elem, onProp);

            for (var i in statements) {
                var statement = statements[i],
                    name = statement[1],
                    val = walk(statement);
                switch (statement[0]) {
                    case "qmldefaultprop":
                        item.$defaultProperty = name;
                    case "qmlprop":
                    case "qmlpropdef":
                    case "qmlaliasdef":
                    case "qmlmethod":
                    case "qmlsignaldef":
                        item[name] = val;
                        break;
                    case "qmlelem":
                        item.$children.push(val);
                        break;
                    case "qmlobjdef":
                        // Create object to item
                        item[name] = item[name] || new QMLMetaPropertyGroup();
                        item[name][statement[2]] = val;
                        break;
                    case "qmlobj":
                        // Create object to item
                        item[name] = item[name] || new QMLMetaPropertyGroup();
                        for (var i in val)
                            item[name][i] = val[i];
                        break;
                    default:
                        console.log("Unknown statement", statement);

                }
            }
            // Make $children be either a single item or an array, if it's more than one
            if (item.$children.length === 1)
                item.$children = item.$children[0];

            return item;
        },
        "qmlprop": function(name, tree, src) {
            if (name == "id") {
                // id property
                return tree[1][1];
            }
            return bindout(tree, src);
        },
        "qmlobjdef": function(name, property, tree, src) {
            return bindout(tree, src);
        },
        "qmlobj": function(elem, statements) {
            var item = {};

            for (var i in statements) {
                var statement = statements[i],
                    name = statement[1],
                    val = walk(statement);
                if (statement[0] == "qmlprop")
                    item[name] = val;
            }

            return item;
        },
        "qmlmethod": function(name, tree, src) {
            return new QMLMethod(src);
        },
        "qmlpropdef": function(name, type, tree, src) {
            return new QMLPropertyDefinition(type, tree ? bindout(tree, src) : "");
        },
        "qmlaliasdef": function(name, objName, propName) {
            return new QMLAliasDefinition(objName, propName);
        },
        "qmlsignaldef": function(name, params) {
            return new QMLSignalDefinition(params);
        },
        "qmldefaultprop": function(tree) {
            return walk(tree);
        },
        "name": function(src) {
            return bindout(tree, src);
        },
        "string": function(src) {
            return src;
        },
        "num": function(src) {
            return src;
        }
    };

    function walk(tree) {
        var type = tree[0];
        var walker = walkers[type];
        if (!walker) {
            console.log("No walker for " + type);
            return;
        } else {
            return walker.apply(type, tree.slice(1));
        }
    }

    return walk(tree);

    // Try to bind out tree and return static variable instead of binding
    function bindout(tree, binding) {
        // Detect booleans
        if (tree[1][0] == "name"
            && (tree[1][1] == "true" || tree[1][1] == "false")) {
            return tree[1][1] == "true";
        }
        switch(tree[1][0]) {
            case "num":
                return +tree[1][1];
            case "string":
                return String(tree[1][1]);
            case "qmlelem":
                return walk(tree[1]);
            case "array":
                var val = [];
                for (var i in tree[1][1])
                    val.push(walk(tree[1][1][i]));
                return val;
            default:
                return new QMLBinding(binding, tree);
        }
    }

}

// Function to parse qml and output tree expected by engine
function parseQML(src) {
    var parsetree = qmlparse(src);
    return convertToEngine(parsetree);
}

if (typeof global != "undefined") {
  global.qmlparse = qmlparse;
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
  openUrlExternally: function(url) {
    page = window.open(url, '_blank');
    page.focus();
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
  RightToLeft: 1,
  // Orientations
  Vertical: 0,
  Horizontal: 1,
  // Keys
  Key_Escape: 27,
  Key_Tab: 9,
  Key_Backtab: 245,
  Key_Backspace: 8,
  Key_Return: 13,
  Key_Enter: 13,
  Key_Insert: 45,
  Key_Delete: 46,
  Key_Pause: 19,
  Key_Print: 42,
  Key_SysReq: 0,
  Key_Clear: 12,
  Key_Home: 36,
  Key_End: 35,
  Key_Left: 37,
  Key_Up: 38,
  Key_Right: 39,
  Key_Down: 40,
  Key_PageUp: 33,
  Key_PageDown: 34,
  Key_Shift: 16,
  Key_Control: 17,
  Key_Meta: 91,
  Key_Alt: 18,
  Key_AltGr: 0,
  Key_CapsLock: 20,
  Key_NumLock: 144,
  Key_ScrollLock: 145,
  Key_F1: 112, Key_F2: 113, Key_F3: 114, Key_F4: 115, Key_F5: 116, Key_F6: 117, Key_F7: 118, Key_F8: 119, Key_F9: 120, Key_F10: 121, Key_F11: 122, Key_F12: 123, Key_F13: 124, Key_F14: 125, Key_F15: 126, Key_F16: 127, Key_F17: 128, Key_F18: 129, Key_F19: 130, Key_F20: 131, Key_F21: 132, Key_F22: 133, Key_F23: 134, Key_F24: 135, Key_F25: 0, Key_F26: 0, Key_F27: 0, Key_F28: 0, Key_F29: 0, Key_F30: 0, Key_F31: 0, Key_F32: 0, Key_F33: 0, Key_F34: 0, Key_F35: 0,
  Key_Super_L: 0,
  Key_Super_R: 0,
  Key_Menu: 0,
  Key_Hyper_L: 0,
  Key_Hyper_R: 0,
  Key_Help: 6,
  Key_Direction_L: 0,
  Key_Direction_R: 0,
  Key_Space: 32,
  Key_Any:   32,
  Key_Exclam: 161,
  Key_QuoteDbl: 162,
  Key_NumberSign: 163,
  Key_Dollar: 164,
  Key_Percent: 165,
  Key_Ampersant: 166,
  Key_Apostrophe: 222,
  Key_ParenLeft: 168,
  Key_ParenRight: 169,
  Key_Asterisk: 170,
  Key_Plus: 171,
  Key_Comma: 188,
  Key_Minus: 173,
  Key_Period: 190,
  Key_Slash: 191,
  Key_0: 48, Key_1: 49, Key_2: 50, Key_3: 51, Key_4: 52, Key_5: 53, Key_6: 54, Key_7: 55, Key_8: 56, Key_9: 57,
  Key_Colon: 58,
  Key_Semicolon: 59,
  Key_Less: 60,
  Key_Equal: 61,
  Key_Greater: 62,
  Key_Question: 63,
  Key_At: 64,
  Key_A: 65, Key_B: 66, Key_C: 67, Key_D: 68, Key_E: 69, Key_F: 70, Key_G: 71, Key_H: 72, Key_I: 73, Key_J: 74, Key_K: 75, Key_L: 76, Key_M: 77, Key_N: 78, Key_O: 79, Key_P: 80, Key_Q: 81, Key_R: 82, Key_S: 83, Key_T: 84, Key_U: 85, Key_V: 86, Key_W: 87, Key_X: 88, Key_Y: 89, Key_Z: 90,
  Key_BracketLeft: 219,
  Key_Backslash: 220,
  Key_BracketRight: 221,
  Key_AsciiCircum: 160,
  Key_Underscore: 167,
  Key_QuoteLeft: 0,
  Key_BraceLeft: 174,
  Key_Bar: 172,
  Key_BraceRight: 175,
  Key_AsciiTilde: 176,
  Key_Back: 0,
  Key_Forward: 0,
  Key_Stop: 0,
  Key_VolumeDown: 182,
  Key_VolumeUp: 183,
  Key_VolumeMute: 181,
  Key_Yes: 0,
  Key_multiply: 106,
  Key_add: 107,
  Key_substract: 109,
  Key_divide: 111,
  Key_News: 0,
  Key_OfficeHome: 0,
  Key_Option: 0,
  Key_Paste: 0,
  Key_Phone: 0,
  Key_Calendar: 0,
  Key_Reply: 0,
  Key_Reload: 0,
  Key_RotateWindows: 0,
  Key_RotationPB: 0,
  Key_RotationKB: 0,
  Key_Save: 0,
  Key_Send: 0,
  Key_Spell: 0,
  Key_SplitScreen: 0,
  Key_Support: 0,
  Key_TaskPane: 0,
  Key_Terminal: 0,
  Key_Tools: 0,
  Key_Travel: 0,
  Key_Video: 0,
  Key_Word: 0,
  Key_Xfer: 0,
  Key_ZoomIn: 0,
  Key_ZoomOut: 0,
  Key_Away: 0,
  Key_Messenger: 0,
  Key_WebCam: 0,
  Key_MailForward: 0,
  Key_Pictures: 0,
  Key_Music: 0,
  Key_Battery: 0,
  Key_Bluetooth: 0,
  Key_WLAN: 0,
  Key_UWB: 0,
  Key_AudioForward: 0,
  Key_AudioRepeat: 0,
  Key_AudioRandomPlay: 0,
  Key_Subtitle: 0,
  Key_AudioCycleTrack: 0,
  Key_Time: 0,
  Key_Hibernate: 0,
  Key_View: 0,
  Key_TopMenu: 0,
  Key_PowerDown: 0,
  Key_Suspend: 0,
  Key_ContrastAdjust: 0,
  Key_MediaLast: 0,
  Key_unknown: -1,
  Key_Call: 0,
  Key_Camera: 0,
  Key_CameraFocus: 0,
  Key_Context1: 0,
  Key_Context2: 0,
  Key_Context3: 0,
  Key_Context4: 0,
  Key_Flip: 0,
  Key_Hangup: 0,
  Key_No: 0,
  Key_Select: 93,
  Key_Yes: 0,
  Key_ToggleCallHangup: 0,
  Key_VoiceDial: 0,
  Key_LastNumberRedial: 0,
  Key_Execute: 43,
  Key_Printer: 42,
  Key_Play: 250,
  Key_Sleep: 95,
  Key_Zoom: 251,
  Key_Cancel: 3,
  // CursorShape
  ArrowCursor: 0,
  UpArrowCursor: 1,
  CrossCursor: 2,
  WaitCursor: 3,
  IBeamCursor: 4,
  SizeVerCursor: 5,
  SizeHorCursor: 6,
  SizeBDiagCursor: 7,
  SizeFDiagCursor: 8,
  SizeAllCursor: 9,
  BlankCursor: 10,
  SplitVCursor: 11,
  SplitHCursor: 12,
  PointingHandCursor: 13,
  ForbiddenCursor: 14,
  WhatsThisCursor: 15,
  BusyCursor: 16,
  OpenHandCursor: 17,
  ClosedHandCursor: 18,
  DragCopyCursor: 19,
  DragMoveCursor: 20,
  DragLinkCursor: 21,
  LastCursor: 21, //DragLinkCursor,
  BitmapCursor: 24,
  CustomCursor: 25 
    
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

global.perContextConstructors = {};

global.loadImports = function (self, imports) {
  constructors = mergeObjects(modules.Main, null);
  for (var i = 0 ; i < imports.length ; ++i) {
    var importDesc         = imports[i];
    var moduleConstructors = collectConstructorsForModule(importDesc.subject, importDesc.version);

    if (importDesc.alias != null)
      constructors[importDesc.alias] = mergeObjects(constructors[importDesc.alias], moduleConstructors);
    else
      constructors                   = mergeObjects(constructors,                   moduleConstructors);
  }
  perContextConstructors[self.objectId] = constructors;
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
        if (cTree.$children.length !== 1) {
            console.error("A QML component must only contain one root element!");
        }
        
        var component = new QMLComponent({ object: cTree, context: meta.context });       
        component.finalizeImports(); 
   
        var item = component.createObject(meta.parent);
            
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

    if (!global.qmlEngine.doc) {
        global.qmlEngine.doc = item;
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
function createSimpleProperty(type, obj, propName, access) {
    var prop = new QMLProperty(type, obj, propName);
    var getter, setter;
    if (typeof access == 'undefined' || access == null)
      access = 'rw';

    obj[propName + "Changed"] = prop.changed;
    obj.$properties[propName] = prop;
    getter = function()       { return obj.$properties[propName].get(); };
    if (access == 'rw')
      setter = function(newVal) { return obj.$properties[propName].set(newVal); };
    else {
      setter = function(newVal) {
        if (obj.$canEditReadOnlyProperties != true)
          throw "property '" + propName + "' has read only access";
        return obj.$properties[propName].set(newVal);
      }
    }
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
      qmlEngine.loadFile(source, null);
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
    this.completed = this.Component.completed;

    // Component get own properties
    var attributes = [];
    for (var key in meta.object) {
      if (meta.object.hasOwnProperty(key) &&
          typeof meta.object[key] != 'undefined' && meta.object[key] != null &&
          (meta.object[key].__proto__.constructor.name == 'QMLPropertyDefinition' ||
           meta.object[key].__proto__.constructor.name == 'QMLAliasDefinition')) {
        attributes.push(key);
      }
    }

    this.Keys = new QObject(this);
    this.Keys.asteriskPresed = Signal();
    this.Keys.backPressed = Signal();
    this.Keys.backtabPressed = Signal();
    this.Keys.callPressed = Signal();
    this.Keys.cancelPressed = Signal();
    this.Keys.deletePressed = Signal();
    for (var i = 0 ; i < 10 ; ++i)
      this.Keys['digit'+i+'Pressed'] = Signal();
    this.Keys.escapePressed = Signal();
    this.Keys.flipPressed = Signal();
    this.Keys.hangupPressed = Signal();
    this.Keys.leftPressed = Signal();
    this.Keys.menuPressed = Signal();
    this.Keys.noPressed = Signal();
    this.Keys.pressed = Signal();
    this.Keys.released = Signal();
    this.Keys.returnPressed = Signal();
    this.Keys.rightPressed = Signal();
    this.Keys.selectPressed = Signal();
    this.Keys.spacePressed = Signal();
    this.Keys.tabPressed = Signal();
    this.Keys.upPressed = Signal();
    this.Keys.volumeDownPressed = Signal();
    this.Keys.volumeUpPressed = Signal();
    this.Keys.yesPressed = Signal();

    this.getAttributes = function() { return (attributes); }
}

registerQmlType({
    module: 'QtQuick',
    name: 'QtObject',
    versions: /.*/,
    constructor: QMLBaseObject
});

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

        if (src) {
            console.log('Loading file [', file,']');
            qrc[file] = qmlparse(src);
        }else {
            console.log('Can nor load file [', file,']');
        }
      }
    }
    
    // Load file, parse and construct (.qml or .qml.js)
    this.loadFile = function(file, parentComponent) {
        var tree;

        basePath = this.pathFromFilepath(file);
        this.basePath = basePath;
        this.ensureFileIsLoadedInQrc(file);
        tree = convertToEngine(qrc[file]);
        return this.loadQMLTree(tree, parentComponent);
    }

    // parse and construct qml
    this.loadQML = function(src) {
        this.loadQMLTree(parseQML(src), null);
    }

    this.loadQMLTree = function(tree, parentComponent) {
        engine = this;
        if (options.debugTree) {
            options.debugTree(tree);
        }

        // Create and initialize objects
        var component = new QMLComponent({ object: tree, parent: parentComponent });
        doc = component.createObject(parentComponent);
        component.finalizeImports();
        this.$initializePropertyBindings();

        this.start();

        // Call completed signals
        for (var i in this.completedSignals) {
            this.completedSignals[i]();
        }
        
        return component;
    }

    this.rootContext = function() {
        return global.qmlEngine.doc.$context;
    }

    this.focusedElement = (function() {
      return this.rootContext().activeFocus;
    }).bind(this);

    // KEYBOARD MANAGEMENT
    var keyboardSignals = {};
    keyboardSignals[Qt.Key_Asterisk]   = 'asteriskPressed';
    keyboardSignals[Qt.Key_Back]       = 'backPressed';
    keyboardSignals[Qt.Key_Backtab]    = 'backtabPressed';
    keyboardSignals[Qt.Key_Call]       = 'callPressed';
    keyboardSignals[Qt.Key_Cancel]     = 'cancelPressed';
    keyboardSignals[Qt.Key_Delete]     = 'deletePressed';
    keyboardSignals[Qt.Key_0]          = 'digit0Pressed';
    keyboardSignals[Qt.Key_1]          = 'digit1Pressed';
    keyboardSignals[Qt.Key_2]          = 'digit2Pressed';
    keyboardSignals[Qt.Key_3]          = 'digit3Pressed';
    keyboardSignals[Qt.Key_4]          = 'digit4Pressed';
    keyboardSignals[Qt.Key_5]          = 'digit5Pressed';
    keyboardSignals[Qt.Key_6]          = 'digit6Pressed';
    keyboardSignals[Qt.Key_7]          = 'digit7Pressed';
    keyboardSignals[Qt.Key_8]          = 'digit8Pressed';
    keyboardSignals[Qt.Key_9]          = 'digit9Pressed';
    keyboardSignals[Qt.Key_Escape]     = 'escapePressed';
    keyboardSignals[Qt.Key_Flip]       = 'flipPressed';
    keyboardSignals[Qt.Key_Hangup]     = 'hangupPressed';
    keyboardSignals[Qt.Key_Menu]       = 'menuPressed';
    keyboardSignals[Qt.Key_No]         = 'noPressed';
    keyboardSignals[Qt.Key_Return]     = 'returnPressed';
    keyboardSignals[Qt.Key_Select]     = 'selectPressed';
    keyboardSignals[Qt.Key_Space]      = 'spacePressed';
    keyboardSignals[Qt.Key_Tab]        = 'tabPressed';
    keyboardSignals[Qt.Key_VolumeDown] = 'volumeDownPressed';
    keyboardSignals[Qt.Key_VolumeUp]   = 'volumeUpPressed';
    keyboardSignals[Qt.Key_Yes]        = 'yesPressed';
    keyboardSignals[Qt.Key_Up]         = 'upPressed';
    keyboardSignals[Qt.Key_Right]      = 'rightPressed';
    keyboardSignals[Qt.Key_Down]       = 'downPressed';
    keyboardSignals[Qt.Key_Left]       = 'leftPressed';

    function keyCodeToQt(e) {
      if (e.keyCode >= 96 && e.keyCode <= 111) {
        e.keypad = true;
      }
      if (e.keyCode == Qt.Key_Tab && e.shiftKey == true)
        return Qt.Key_Backtab;
      else if (e.keyCode >= 97 && e.keyCode <= 122)
        return e.keyCode - (97 - Qt.Key_A);
      return e.keyCode;
    }

    function eventToKeyboard(e) {
        return {
            accepted: false,
            count: 1,
            isAutoRepeat: false,
            key: keyCodeToQt(e),
            modifiers: (e.ctrlKey * Qt.CtrlModifier)
                    | (e.altKey   * Qt.AltModifier)
                    | (e.shiftKey * Qt.ShiftModifier)
                    | (e.metaKey  * Qt.MetaModifier)
                    | (e.keypad   * Qt.KeypadModifier),
            text: String.fromCharCode(e.charCode)
        };
    }

    document.onkeypress = (function(e) {
      var focusedElement = this.focusedElement();
      var event          = eventToKeyboard(e || window.event);
      var eventName      = keyboardSignals[event.key];

      while (event.accepted != true && focusedElement != null) {
        var backup       = focusedElement.$context.event;

        focusedElement.$context.event = event;
        focusedElement.Keys.pressed(event);
        if (eventName != null)
          focusedElement.Keys[eventName](event);
        focusedElement.$context.event = backup;
        if (event.accepted == true)
          e.preventDefault();
        else
          focusedElement = focusedElement.$parent;
      }
    }).bind(this);

    document.onkeyup = (function(e) {
      var focusedElement = this.focusedElement();
      var event          = eventToKeyboard(e || window.event);

      while (event.accepted != true && focusedElement != null) {
        var backup       = focusedElement.$context.event;

        focusedElement.$context.event = event;
        focusedElement.Keys.released(event);
        focusedElement.$context.event = backup;
        if (event.accepted == true)
          e.preventDefault();
        else
          focusedElement = focusedElement.$parent;
      }
    }).bind(this);
    // END KEYBOARD MANAGEMENT

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
            if (property.binding!=null) {
                property.binding.compile();
            }
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
    var c = this.children.length;
    for (var i = 0; i < c; i++) {
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
var objectIds = 0;
function QObject(parent) {
    this.$parent = parent;
    if (parent && parent.$tidyupList)
        parent.$tidyupList.push(this);
    // List of things to tidy up when deleting this object.
    if (!this.$tidyupList)
        this.$tidyupList = [];
    if (!this.$properties)
        this.$properties = {};

    this.objectId = objectIds++;
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
    
    if (this.parent != undefined) updateChildrenRect(this.parent);
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
    
    if (this.parent != undefined) updateChildrenRect(this.parent);
}

function updateChildrenRect(component){
    
    var children = component !== undefined ? component.children : undefined
    if ( children == undefined || children.length == 0 )
        return;
    
    var maxWidth = 0;
    var maxHeight = 0;
    var minX = children.length>0 ? children[0].x : 0;
    var minY = children.length>0 ? children[0].y : 0;
    var h=0;
    var w=0;
    
    for(var i in children){
        var child = children[i];
        
        h = child.$isUsingImplicitHeight !== 0 ? child.implicitHeight : child.height;
        w = child.$isUsingImplicitWidth !== 0 ? child.implicitWidth : child.width;
        
        maxWidth = Math.max(maxWidth, child.x + w); 
        maxHeight = Math.max(maxHeight, child.y + h);
        minX = Math.min(minX, child.x);
        minY = Math.min(minX, child.y);
    }
    
    component.childrenRect.x = minX;
    component.childrenRect.y = minY;
    component.childrenRect.width = maxWidth;
    component.childrenRect.height = maxHeight;
 
}



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

    var jsImports = [];

    var loadJsImport = (function(importDesc) {
      jsImports.push(importDesc);
    }).bind(this);

    this.finalizeImports = (function() {
      for (var i = 0 ; i < jsImports.length ; ++i) {
        var importDesc = jsImports[i];
        var src = importDesc.subject;
        var js;

        if (typeof qmlEngine.basePath != 'undefined')
          src = qmlEngine.basePath + src;
        
        if (typeof qrc[src] != 'undefined') {
          js = qrc[src];
        }
        else {
          js = jsparse(getUrlContents(src));
        }
        
        var $context = this.$context;
        $context[importDesc.alias] = {};
        importJavascriptInContext(js, $context[importDesc.alias]);
      }
    }).bind(this);

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
      loadImports(this, moduleImports);
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
    this.dom.qml = this;
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

    if (this.$isComponentRoot)
      createSimpleProperty("var", this, "activeFocus");
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

    this.setupFocusOnDom = (function(element) {
      var updateFocus = (function() {
        var hasFocus = document.activeElement == this.dom || document.activeElement == this.dom.firstChild;

        if (this.focus != hasFocus)
          this.focus = hasFocus;
      }).bind(this);
      element.addEventListener("focus", updateFocus);
      element.addEventListener("blur",  updateFocus);
    }).bind(this);

    this.focusChanged.connect(this, (function(newVal) {
      if (newVal == true) {
        if (this.dom.firstChild != null)
          this.dom.firstChild.focus();
        document.qmlFocus = this;
        this.$context.activeFocus = this;
      } else if (document.qmlFocus == this) {
        document.getElementsByTagName("BODY")[0].focus();
        document.qmlFocus = qmlEngine.rootContext().base;
        this.$context.activeFocus = null;
      }
    }).bind(this));

    this.$isUsingImplicitWidth = true;
    this.$isUsingImplicitHeight = true;

    // anchors property
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

    // childrenRect property    
    this.childrenRect = new QObject(this);
    createSimpleProperty("real", this.childrenRect, "x","rw");  //todo ro 
    createSimpleProperty("real", this.childrenRect, "y","rw");  // todo ro
    createSimpleProperty("real", this.childrenRect, "width","rw"); // todo ro
    createSimpleProperty("real", this.childrenRect, "height","rw"); // todo ro
 
    
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
            var filter = "";
            var transformStyle = "preserve-3d";

            for (var i = 0; i < this.transform.length; i++) {
                var t = this.transform[i];
                if (t instanceof QMLRotation)
                    transform += " rotate3d(" + t.axis.x + ", " + t.axis.y + ", " + t.axis.z + ", " + t.angle + "deg)";
                else if (t instanceof QMLScale)
                    transform += " scale(" + t.xScale + ", " + t.yScale + ")";
                else if (t instanceof QMLTranslate)
                    transform += " translate(" + t.x + "px, " + t.y + "px)";
                else if (typeof t.transformType != 'undefined') {
                    if (t.transformType == 'filter')
                      filter += t.operation + '(' + t.parameters + ') ';
                }
                else if (typeof t == 'string')
                    transform += t;
            }
            if (typeof this.z == "number")
              transform += " translate3d(0, 0, " + this.z + "px)";
            this.dom.style.transform = transform;
            this.dom.style.transformStyle = transformStyle;
            this.dom.style.MozTransform = transform;    // Firefox
            this.dom.style.webkitTransform = transform; // Chrome, Safari and Opera
            this.dom.style.webkitTransformStyle = transformStyle;
            this.dom.style.OTransform = transform;      // Opera
            this.dom.style.msTransform = transform;     // IE
            this.dom.style.filter = filter;
            this.dom.style.msFilter = filter;     // IE
            this.dom.style.webkitFilter = filter; // Chrome, Safari and Opera
            this.dom.style.MozFilter = filter;    // Firefox
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
        this.$updateTransform();
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
    this.childrenRect.x = 0;
    this.childrenRect.y = 0;
    this.childrenRect.width = 0;
    this.childrenRect.height = 0;
    
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

(function() {

  global.importJavascriptInContext = function (jsData, $context) {
    with(qmlEngine.rootContext()) {
      eval(jsData.source);
      for (var i = 0 ; i < jsData.exports.length ; ++i) {
        var symbolName = jsData.exports[i];
        $context[symbolName] = eval(symbolName);
      }
    }
  }

  global.jsparse = function (source) {
    var AST_Tree = parse(source);
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

})();

registerQmlType({
  module:   'QtGraphicalEffects',
  name:     'FastBlur',
  versions: /.*/,
  constructor: function QMLFastBlur(meta) {
    QMLItem.call(this, meta);

    var previousSource = null;
    var filterObject;

    createSimpleProperty("real", this, "radius");
    createSimpleProperty("var",  this, "source");
    this.radius = 0;
    this.source = null;

    var updateFilterObject = (function() {
      filterObject = {
        transformType: 'filter',
        operation:     'blur',
        parameters:    this.radius + 'px'
      };
    }).bind(this);

    function stripEffectFromSource(source) {
      if (previousSource != null) {
        var index = previousSource.transform.indexOf(filterObject);

        previousSource.transform.splice(index, 1);
        previousSource.$updateTransform();
      }
    }

    function updateEffect(source) {
      console.log("updating effect");
      stripEffectFromSource(previousSource);
      if (source != null && typeof source.transform != 'undefined') {
        updateFilterObject();
        console.log("updating effect:", filterObject, source);
        source.transform.push(filterObject);
        source.$updateTransform();
        previousSource = source;
      } else {
        previousSource = null;
      }
    }

    this.radiusChanged.connect(this, (function(newVal) {
      updateEffect(this.source);
    }).bind(this));

    this.sourceChanged.connect(this, (function(newVal) {
      updateEffect(this.source);
    }).bind(this));
  }
});

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
      this.latitude         = position.coords.latitude;
      this.longitude        = position.coords.longitude;
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

    this.sourceChanged.connect(this, (function(source) {
      var parts     = source.split('.');
      var extension = parts[parts.length - 1];

      domVideo.src = source;
      if (domVideo.canPlayType(this.mimetypeFromExtension(extension.toLowerCase())) == "")
        this.error |= MediaPlayer.FormatError;
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

registerQmlType({
  module:   'QtQuick.Controls',
  name:     'CheckBox',
  versions: /.*/,
  constructor: function QMLCheckbox(meta) {
    this.dom = document.createElement("label");
    QMLItem.call(this, meta);
    var self = this;

    this.font = new getConstructor('QtQuick', '2.0', 'Font')(this);

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
    module: 'QtQuick',
    name: 'ComboBox',
    versions: /.*/,
    constructor: QMLComboBox
});

function QMLComboBox(meta) {
    QMLItem.call(this, meta);
    var self = this;

    this.dom.style.pointerEvents = "auto";
    this.name = "QMLComboBox";

    createSimpleProperty("int", this, "count");
    createSimpleProperty("int", this, "currentIndex");
    createSimpleProperty("string", this, "currentText");
    createSimpleProperty("array", this, "menu");
    createSimpleProperty("array", this, "model");
    createSimpleProperty("bool", this, "pressed");

    this.count = 0;
    this.currentIndex = 0;
    this.currentText = "";
    this.menu = [];
    this.model = [];
    this.pressed = false;

    var updateCB = function(){
        var head = "<select>";
        var tail = "</select>";
        var html = head;

        var model = self.model;
        var count = model.length;
        self.count = count;

        for (var i = 0; i < count; i++) {
            var elt = model[i];
            //if (elt instanceof Array) { // TODO - optgroups? update model !
            //    var count_i = elt.length;
            //    for (var j = 0; j < count_i; j++)
            //        html += "<option>" + elt[j] + "</option>";
            //}
            //else
            html += "<option>" + elt + "</option>";
        }
        html += tail;
        return html;
    };

    this.accepted = Signal();
    this.activated = Signal([{type: "int", name: "index"}]);

    this.find = function(text) {
        return self.model.indexOf(text)
    };
    this.selectAll = function () {};    // TODO
    this.textAt = function(index) {
        return this.model[index];
    };

    this.Component.completed.connect(this, function () {
        this.dom.innerHTML = updateCB();
        var child = this.dom.firstChild;
        this.implicitWidth = child.offsetWidth;
        this.implicitHeight = child.offsetHeight;
    });

    this.modelChanged.connect(updateCB);

    this.dom.onclick = function (e) {
        var index = self.dom.firstChild.selectedIndex;
        self.currentIndex = index ;
        self.currentText = self.model[index];
        self.accepted();
        self.activated(index);
    };
}
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
    var children = [];
    var child    = undefined;  
    var QMLRepeater = getConstructor('QtQuick', '2.0', 'Repeater');
    var QMLListView = getConstructor('QtQuick', '2.0', 'ListView');
    
    for (var key in this.children) {
        child = this.children[key];    
         
        if ( child instanceof QMLRepeater || child instanceof QMLListView) {
             children = children.concat(child.children);
        }
        else {
             children.push(child);
        }
    }
      
    if (children.length == 0) return;
     
    for (var i = 0; i < children.length; i++) {
        child = children[i];
        if (!(child.visible && child.opacity && child.width && child.height)) {
            continue;
        }
        
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

global.DoubleValidator = {
  StandardNotation: 1, ScientificNotation: 2
};

registerQmlType({
  module:   'QtQuick',
  name:     'DoubleValidator',
  versions: /.*/,
  constructor: function QMLDoubleValidator(meta) {
    QMLItem.call(this, meta);

    createSimpleProperty("real", this, "bottom");
    createSimpleProperty("real", this, "top");
    createSimpleProperty("int",  this, "decimals");
    createSimpleProperty("enum", this, "notation");
    this.bottom   = -Infinity;
    this.top      = Infinity;
    this.decimals = 1000;
    this.notation = DoubleValidator.ScientificNotation;

    var standardRegExp   = /^(-|\+)?\s*[0-9]+(\.[0-9]+)?$/;
    var scientificRegExp = /^(-|\+)?\s*[0-9]+(\.[0-9]+)?(E(-|\+)?[0-9]+)?$/;

    this.getRegExpForNotation = (function(notation) {
      switch (notation) {
        case DoubleValidator.ScientificNotation:
          return scientificRegExp;
          break ;
        case DoubleValidator.StandardNotation:
          return standardRegExp;
          break ;
      }
      return null;
    }).bind(this);

    function getDecimalsForNumber(number) {
      if (Math.round(number) != number) {
        var str = '' + number;

        return /\d*$/.exec(str)[0].length;
      }
      return 0;
    }

    this.validate = (function(string) {
      var regExp     = this.getRegExpForNotation(this.notation);
      var acceptable = regExp.test(string.trim());

      if (acceptable) {
        var value    = parseFloat(string);

        acceptable   = this.bottom <= value && this.top >= value;
        acceptable   = acceptable && getDecimalsForNumber(value) <= this.decimals;
      }
      return acceptable;
    }).bind(this);
  }
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

    this.flow = this.Flow.LeftToRight;
    this.layoutDirection = 0 ;
}

QMLFlow.prototype.layoutChildren = function() {
    var curHPos = 0,
        curVPos = 0,
        rowSize = 0;
    var children = [];
    var child    =  undefined;
    var QMLRepeater = getConstructor('QtQuick', '2.0', 'Repeater');
    
    for (var key in this.children){
        child = this.children[key];    
         
        if ( child instanceof QMLRepeater) {
             children = children.concat(child.children);
         }
         else{
             children.push(child);   
         }
    }
    
    if (children.length == 0) return;
 
    var flowWidth = this.$isUsingImplicitWidth ? this.implicitWidth : this.width;
    var flowHeight = this.$isUsingImplicitHeight ? this.implicitHeight : this.height;
    
    for (var i = 0; i < children.length; i++) {
        child = children[i];
        if (!(child.visible && child.opacity && child.width && child.height))
            continue;

        if (this.flow == this.Flow.LeftToRight) {
            if (curHPos + child.width > flowWidth) {
                if (this.$isUsingImplicitWidth == false ) curHPos = 0;
                curVPos += rowSize + this.spacing;
                rowSize = 0;
            }
            rowSize = child.height > rowSize ? child.height : rowSize;

            child.x = this.layoutDirection == 1
                    ? flowWidth - curHPos - child.width : curHPos;
            child.y = curVPos;
            curHPos += child.width + this.spacing;
        } else {
            if (curVPos + child.height > flowHeight) {
                if (this.$isUsingImplicitHeight == false ) curVPos = 0; 
                curHPos += rowSize + this.spacing;
                rowSize = 0;
            }
            rowSize = child.width > rowSize ? child.width : rowSize;

            child.x = this.layoutDirection == 1
                    ? flowWidth - curHPos - child.width : curHPos;
            child.y = curVPos;
            curVPos += child.height + this.spacing;
        }
    }
    
    if (this.$isUsingImplicitHeight)
        this.implicitHeight = curVPos + rowSize;

    if (this.$isUsingImplicitWidth)
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
        if (img.complete)
          this.status = this.Image.Ready;
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
  module:   'QtQuick',
  name:     'IntValidator',
  versions: /.*/,
  constructor: function QMLIntValidator(meta) {
    QMLItem.call(this, meta);

    createSimpleProperty("int", this, "bottom");
    createSimpleProperty("int", this, "top");
    this.bottom = -2147483647;
    this.top    = 2147483647;

    this.validate = (function(string) {
      var regExp     = /^(-|\+)?\s*[0-9]+$/;
      var acceptable = regExp.test(string.trim());

      if (acceptable) {
        var value    = parseInt(string);

        acceptable   = this.bottom <= value && this.top >= value;
      }
      return acceptable;
    }).bind(this);
  }
});


function QMLListElement(meta) {
    QMLBaseObject.call(this, meta);

    for (var i in meta.object) {
        if (i[0] != "$") {
            createSimpleProperty("variant", this, i);
        }
    }
    applyProperties(meta.object, this, this, this.$context);
}

registerQmlType({
  module: 'QtQuick',
  name:   'ListElement',
  versions: /.*/,
  constructor: QMLListElement
});

function QMLListModel(meta) {
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
        this.count = this.$items.length;
    updateRoleNames(newVal);
    });

    this.$model.data = function(index, role) {
        return self.$items[index][role];
    }
    this.$model.rowCount = function() {
        return self.$items.length;
    }

    this.append = function(dict) {
        var index = this.$items.length;
        var c = 0;

        if (dict instanceof Array){
            for (var key in dict) {
                this.$items.push(dict[key]);
                c++;
            }
        }else {
            this.$items.push(dict);
            c=1;
        }

        this.$itemsChanged(this.$items);
        this.$model.rowsInserted(index, index + c);
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
        this.$model.rowsInserted(index, index + 1);
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
        engine.$requestDraw();
    }
    this.setProperty = function(index, property, value) {
        this.$items[index][property] = value;
        engine.$requestDraw();
    }

    function updateRoleNames(newVal){
        if (firstItem && newVal.length > 0 ) {
            firstItem = false;
            var roleNames = [];
            var dict = newVal[0];

            for (var i in (dict instanceof QMLListElement) ? dict.$properties : dict) {
                if (i != "index")
                    roleNames.push(i);
            }

            self.$model.setRoleNames(roleNames);
        }
    }
}

registerQmlType({
  module: 'QtQuick',
  name:   'ListModel',
  versions: /.*/,
  constructor: QMLListModel
});

registerQmlType({
  module:   'QtQuick',
  name:     'ListView',
  versions: /.*/,
  constructor: function QMLListView(meta) {
    var self = this;
    var QMLRepeater = getConstructor('QtQuick', '2.0', 'Repeater');
    QMLRepeater.call(this, meta);

    createSimpleProperty("enum", this, "orientation");
    createSimpleProperty("real", this, "spacing");

    this.container = function() { return self; }
    this.modelChanged.connect(styleChanged);
    this.delegateChanged.connect(styleChanged);
    this.orientationChanged.connect(styleChanged);
    this.spacingChanged.connect(styleChanged);

    this._childrenInserted.connect(applyStyleOnItem)

    function applyStyleOnItem($item) {
      $item.dom.style.position = 'initial';
      if (self.orientation == Qt.Horizontal) {
        $item.dom.style.display = 'inline-block';
        if ($item != self.$items[0])
          $item.dom.style["margin-left"] = self.spacing + "px";
      }
      else {
        $item.dom.style.display = 'block';
        if ($item != self.$items[0])
          $item.dom.style["margin-top"] = self.spacing + "px";
      }
    }

    function styleChanged() {
      for (var i = 0 ; i < self.$items.length ; ++i) {
        applyStyleOnItem(self.$items[i]);
      }
    }
  }
});

/**
 *
 * Loader is used to dynamically load QML components.
 *
 * Loader can load a QML file (using the source property)
 * or a Component object (using the sourceComponent property).
 * It is useful for delaying the creation of a component until
 * it is required: for example, when a component should be created
 * on demand, or when a component should not be created unnecessarily
 * for performance reasons.
 *
 */
 
registerQmlType({
    module: 'QtQuick',
    name: 'Loader',
    versions: /.*/,
    constructor: function(meta) {
        QMLItem.call(this, meta);

        var self = this;

        createSimpleProperty('bool', this, 'active');   //totest
        createSimpleProperty('bool', this, 'asynchronous');  //todo
        createSimpleProperty('var', this, 'item');
        createSimpleProperty('real', this, 'progress'); //todo
        createSimpleProperty('url', this, 'source');
        createSimpleProperty('Component', this, 'sourceComponent');   //totest
        createSimpleProperty('enum', this, 'status');


        this.active = true;
        this.asynchronous = false;
        this.item = undefined;
        this.progress = 0.0;
        this.source = undefined;
        this.sourceComponent = undefined;
        this.status = 1;
        this.sourceUrl = '';

        this.loaded = Signal();

        implicitWidth = this.item ? this.item.width : 0;
        implicitHeight = this.item ? this.item.height : 0;
     
        this.activeChanged.connect( function(newVal) {
                                   
            if (self.active){
                if (self.source) 
                    sourceChanged(); 
                else if (self.sourceComponent)
                    sourceComponentChanged();
            }else{
                unload();
            }
         });
        
        this.sourceChanged.connect( function(newVal) {
            if (self.active == false )//|| (newVal == self.sourceUrl && self.item !== undefined) ) //todo
            {
                console.log( " Loader isn't active.");
                return;  
            }
            
            unload();
            
            if (self.source.length>0) { 
               var fileName = newVal.lastIndexOf(".qml") == newVal.length-4 ? newVal.substring(0, newVal.length-4) : "";

               if ( fileName !== "" ) {
                   var tree = engine.loadComponent(fileName);               
   
                   var component = new QMLComponent({ object: tree, context: self , parent: self});
                   var loadedComponent = component.createObject(self);
                    
                   loadedComponent.parent = self;
                   component.finalizeImports();
   
                   self.childrenChanged();

                   if (engine.operationState !== QMLOperationState.Init) {
                        // We don't call those on first creation, as they will be called
                        // by the regular creation-procedures at the right time.
                        engine.$initializePropertyBindings();
                        callOnCompleted(loadedComponent);
                   }
                              
                   self.sourceComponent = loadedComponent;  
                   self.sourceUrl = newVal;
               }
            }

        } );
        
        this.sourceComponentChanged.connect(function(newVal) {

            if ( self.active == false ) {
                return;
            }
             
            self.item = newVal;
            
            if (self.item){
                if (!self.$isUsingImplicitWidth) {
                    self.item.width = self.width;
                }
                if (!self.$isUsingImplicitHeight) {
                    self.item.height = self.height;
                }    

                self.loaded();
            }
        } );
  
        function unload(){
          if (self.item){
            
            self.item.$delete();
            self.item.parent = undefined;
            self.item = undefined;
          }
        }

        function callOnCompleted(child) {
            child.Component.completed();
            for (var i = 0; i < child.children.length; i++)
                callOnCompleted(child.children[i]);
        }
  
        this.setSource = function(url, options) {
            this.sourceUrl = url;
            this.props = options;
            this.source = url;
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
    createSimpleProperty("enum", this, "cursorShape");
    
        
    this.clicked = Signal([{type: "variant", name: "mouse"}]);
    this.entered = Signal();
    this.exited = Signal();
    this.positionChanged = Signal([{type: "variant", name: "mouse"}]);

    this.acceptedButtons = Qt.LeftButton;
    this.enabled = true;
    this.hoverEnabled = false;
    this.containsMouse = false;
    this.cursorShape = Qt.ArrowCursor;
    
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
        self.containsMouse = true;
        self.entered();
    }
    this.dom.onmouseout = function(e) {
        self.containsMouse = false;
        self.exited();
    }
    this.dom.onmouseover = function(e) {
        self.containsMouse = true;
        self.dom.style.cursor = cursorShapeToCSS();
        self.entered();
    }
    this.dom.onmouseout = function(e) {
        self.containsMouse = false;
        self.dom.style.cursor = "auto";
        self.exited();
    }
    this.dom.onmousemove = function(e) {
        if (self.enabled && (self.hoverEnabled || self.pressed)) {
            var mouse = eventToMouse(e);
            self.positionChanged(mouse);
            self.mouseX = mouse.x;
            self.mouseY = mouse.y;
        }
    }
    
    function cursorShapeToCSS(){
        var cursor = "auto";
        switch (self.cursorShape) {
          case Qt.ArrowCursor: cursor = "default"; break;
          case Qt.UpArrowCursor: cursor = "auto";break;
          case Qt.CrossCursor: cursor = "crosshair";break;
          case Qt.WaitCursor: cursor = "wait";break;
          case Qt.IBeamCursor: cursor = "auto";break;
          case Qt.SizeVerCursor: cursor = "auto";break;
          case Qt.SizeHorCursor: cursor = "auto";break;
          case Qt.SizeBDiagCursor: cursor = "auto";break;
          case Qt.SizeFDiagCursor: cursor = "auto";break;
          case Qt.SizeAllCursor: cursor = "auto";break;
          case Qt.BlankCursor: cursor = "auto";break;
          case Qt.SplitVCursor: cursor = "auto";break;
          case Qt.SplitHCursor: cursor = "auto";break;
          case Qt.PointingHandCursor: cursor = "pointer";break;
          case Qt.ForbiddenCursor: cursor = "not-allowed";break;
          case Qt.WhatsThisCursor: cursor = "auto";break;
          case Qt.BusyCursor: cursor = "progress";break;
          case Qt.OpenHandCursor: cursor = "auto";break;
          case Qt.ClosedHandCursor: cursor = "move";break;
          case Qt.DragCopyCursor: cursor = "auto";break;
          case Qt.DragMoveCursor: cursor = "auto";break;
          case Qt.DragLinkCursor: cursor = "auto";break;
          case Qt.LastCursor: cursor = "auto";break;
          case Qt.BitmapCursor: cursor = "auto";break;
          case Qt.CustomCursor: cursor = "auto";  break;
        }
        return cursor;
    }
  }
});

registerQmlType({
  module: 'QtQuick',
  name:   'NumberAnimation',
  versions: /.*/,
  constructor: function QMLNumberAnimation(meta) {
    var QMLPropertyAnimation = getConstructor('QtQuick', '2.0', 'PropertyAnimation');

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
    var QMLAnimation = getConstructor('QtQuick', '2.0', 'Animation');
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
    var QMLAnimation = getConstructor('QtQuick', '2.0', 'Animation');
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
    
    var QMLListModel = getConstructor('QtQuick', '2.0', 'ListModel');

    this.parent = meta.parent; // TODO: some (all ?) of the components including Repeater needs to know own parent at creation time. Please consider this major change.
    
    createSimpleProperty("Component", this, "delegate");
    this.container = function() { return this.parent; }
    this.$defaultProperty = "delegate";
    createSimpleProperty("variant", this, "model");
    createSimpleProperty("int", this, "count");
    this.$completed = false;
    this.$items = []; // List of created items
    this._childrenInserted = Signal();

    this.modelChanged.connect(applyModel);
    this.delegateChanged.connect(applyModel);
    this.childrenChanged.connect

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
        var index = 0;
        var model = self.model instanceof QMLListModel ? self.model.$model : self.model;
                            
        for ( index = startIndex; index < endIndex; index++) {
            var newItem = self.delegate.createObject(self);
            newItem.parent = self; // Repeater children
            self.delegate.finalizeImports(); // To properly import JavaScript in the context of a component 

            createSimpleProperty("int", newItem, "index");
                    
            if ( typeof model == "number" || model instanceof Array ) {
                 if (typeof newItem.$properties["modelData"] == 'undefined'){
                    createSimpleProperty("variant", newItem, "modelData");
                 }
                
                 var value = model instanceof Array ? model[index] : typeof model == "number" ? index : "undefined";
                 newItem.$properties["modelData"].set(value, true, newItem, model.$context);
            } else {
                for (var i in model.roleNames) {
                    if (typeof newItem.$properties[model.roleNames[i]] == 'undefined')
                    createSimpleProperty("variant", newItem, model.roleNames[i]);
                    newItem.$properties[model.roleNames[i]].set(model.data(index, model.roleNames[i]), true, newItem, self.model.$context);
                }
            }
            
            self.$items.splice(index, 0, newItem);

            newItem.index = index;

            if (engine.operationState !== QMLOperationState.Init) {
                // We don't call those on first creation, as they will be called
                // by the regular creation-procedures at the right time.
                engine.$initializePropertyBindings();
                callOnCompleted(newItem);
            }
        }
        
        if (index > 0) {
            self.container().childrenChanged();
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
        } else if (model instanceof Array) {
            removeChildren(0, self.$items.length);
            insertChildren(0, model.length);
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
    var curPos = 0, maxHeight = 0;
    var children    = [];
    var child       =  undefined;
    var QMLRepeater = getConstructor('QtQuick', '2.0', 'Repeater');
    
    for (var key in this.children){
        child = this.children[key];    
         
        if ( child instanceof QMLRepeater) {
             children = children.concat(child.children);
         }
         else{
             children.push(child);   
         }
    }
 
    if (children.length == 0) return;
 
    // When layoutDirection is RightToLeft we need oposite order
    var i = this.layoutDirection == 1 ? children.length - 1 : 0,
        endPoint = this.layoutDirection == 1 ? -1 : children.length,
        step = this.layoutDirection == 1 ? -1 : 1;
                
    var rowWidth = this.$isUsingImplicitWidth ? this.implicitWidth : this.width;
    var rowHeight = this.$isUsingImplicitHeight ? this.implicitHeight : this.height;
    
    for (; i !== endPoint; i += step) {
        child = children[i];
        
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

window.SystemPalette = {
  Active:   "active",
  Inactive: "inactive",
  Disabled: "disabled"
};

window.platformsDetectors = [
  //{ name: 'W8',      regexp: /Windows NT 6\.2/ },
  //{ name: 'W7',      regexp: /Windows NT 6\.1/ },
  //{ name: 'Windows', regexp: /Windows NT/ },
  { name: 'OSX',     regexp: /Macintosh/ }
];

window.systemPalettes = {};

registerQmlType({
  module: 'QtQuick',
  name: 'SystemPalette',
  versions: /.*/,
  constructor: function QMLSystemPalette(meta) {
    QMLBaseObject.call(this, meta);

    createSimpleProperty("enum", this, "colorGroup");

    var attrs    = [ 'alternateBase', 'base', 'button', 'buttonText', 'dark', 'highlight', 'highlightedText', 'light', 'mid', 'midlight', 'shadow', 'text', 'window', 'windowText' ];
    var platform = 'OSX';

    for (var i = 0 ; i < attrs.length ; ++i)
      createSimpleProperty("color", this, attrs[i], "ro");
    createSimpleProperty("enum", this, "colorGroup");

    this.colorGroupChanged.connect(this, (function (newVal) {
      this.$canEditReadOnlyProperties = true;
      for (var i = 0 ; i < attrs.length ; ++i) {
        this[attrs[i]] = systemPalettes[platform][newVal][attrs[i]];
      }
      delete this.$canEditReadOnlyProperties;
    }).bind(this));

    // Detect OS
    for (var i = 0 ; i < platformsDetectors.length ; ++i) {
      if (platformsDetectors[i].regexp.test(navigator.userAgent)) {
        platforms = platformsDetectors[i].name;
        break ;
      }
    }
  }
});

window.systemPalettes['OSX'] = {
        'active': {
          'alternateBase': '#f6f6f6',
          'base':          '#ffffff',
          'button':        '#ededed',
          'buttonText':    '#000000',
          'dark':          '#bfbfbf',
          'highlight':     '#fbed73',
          'highlightText': '#000000',
          'light':         '#ffffff',
          'mid':           '#a9a9a9',
          'midlight':      '#f6f6f6',
          'shadow':        '#8b8b8b',
          'text':          '#000000',
          'window':        '#ededed',
          'windowText':    '#000000'
        },
        'inactive': {
          'alternateBase': '#f6f6f6',
          'base':          '#ffffff',
          'button':        '#ededed',
          'buttonText':    '#000000',
          'dark':          '#bfbfbf',
          'highlight':     '#d0d0d0',
          'highlightText': '#000000',
          'light':         '#ffffff',
          'mid':           '#a9a9a9',
          'midlight':      '#f6f6f6',
          'shadow':        '#8b8b8b',
          'text':          '#000000',
          'window':        '#ededed',
          'windowText':    '#000000'
        },
        'disabled': {
          'alternateBase': '#f6f6f6',
          'base':          '#ededed',
          'button':        '#ededed',
          'buttonText':    '#949494',
          'dark':          '#bfbfbf',
          'highlight':     '#d0d0d0',
          'highlightText': '#7f7f7f',
          'light':         '#ffffff',
          'mid':           '#a9a9a9',
          'midlight':      '#f6f6f6',
          'shadow':        '#8b8b8b',
          'text':          '#7f7f7f',
          'window':        '#ededed',
          'windowText':    '#7f7f7f'
        }
};

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

    var QMLFont = new getConstructor('QtQuick', '2.0', 'Font');
    this.font   = new QMLFont(this);

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

global.TextInput = {
  Normal: 0, Password: 1, NoEcho: 2, PasswordEchoOnEdit: 3
};

registerQmlType({
  module:   'QtQuick',
  name:     'TextInput',
  versions: /.*/,
  constructor: function QMLTextInput(meta) {
    QMLItem.call(this, meta);

    var self = this;

    var QMLFont = new getConstructor('QtQuick', '2.0', 'Font');
    this.font   = new QMLFont(this);

    this.dom.innerHTML = "<input type=\"text\" disabled/>"
    this.dom.firstChild.style.pointerEvents = "auto";
    // In some browsers text-inputs have a margin by default, which distorts
    // the positioning, so we need to manually set it to 0.
    this.dom.firstChild.style.margin = "0";
    this.dom.firstChild.style.padding = "0";
    this.dom.firstChild.style.width = "100%";
    this.dom.firstChild.style.height = "100%";

    this.setupFocusOnDom(this.dom.firstChild);

    createSimpleProperty("string", this, "text");
    createSimpleProperty("int",    this, "maximumLength");
    createSimpleProperty("bool",   this, "readOnly");
    createSimpleProperty("var",    this, "validator");
    createSimpleProperty("enum",   this, "echoMode");
    
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

    this.echoModeChanged.connect(this, (function(newVal) {
        switch (newVal) {
          case TextInput.Normal:
            this.dom.firstChild.type = "text";
            break ;
          case TextInput.Password:
            this.dom.firstChild.type = "password";
            break ;
        }
    }).bind(this));

    this.maximumLengthChanged.connect(this, function(newVal) {
        if (newVal < 0)
          newVal = null;
        this.dom.firstChild.maxLength = newVal;
    });

    this.readOnlyChanged.connect(this, function(newVal) {
        this.dom.firstChild.disabled = newVal;
    });

    this.Keys.pressed.connect(this, (function(e) {
      if ((e.key == Qt.Key_Return || e.key == Qt.Key_Enter) &&
          testValidator()) {
        self.accepted();
        e.accepted = true;
      }
    }).bind(this));

    function testValidator() {
      if (typeof self.validator != 'undefined' && self.validator != null)
        return self.validator.validate(self.text);
      return true;
    }

    function updateValue(e) {
        if (self.text != self.dom.firstChild.value) {
          self.$canEditReadOnlyProperties = true;
          self.text = self.dom.firstChild.value;
          self.$canEditReadOnlyProperties = false;
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
    module: 'QtQuick',
    name: 'Screen',
    versions: /.*/,
    constructor: QMLScreen
});

function QMLScreen(meta) {
    QMLItem.call(this, meta);
    var self = this;

    createSimpleProperty("int", this, "desktopAvailableHeight");
    createSimpleProperty("int", this, "desktopAvailableWidth");
    createSimpleProperty("real", this, "devicePixelRatio");
    createSimpleProperty("int", this, "height");
    createSimpleProperty("string", this, "name");
    createSimpleProperty("enum", this, "orientation");
    createSimpleProperty("enum", this, "orientationUpdateMask");
    createSimpleProperty("real", this, "pixelDensity");
    createSimpleProperty("enum", this, "primaryOrientation");
    createSimpleProperty("int", this, "width");

    this.Component.completed.connect(this, updateSC);

    function updateSC() {
        self.desktopAvailableHeight = window.outerHeight;
        self.desktopAvailableWidth = window.outerWidth;
        self.devicePixelRatio = window.devicePixelRatio;
        self.height = window.innerHeight;
        self.name = this.name;
        self.orientation =  Qt.PrimaryOrientation;
        self.orientationUpdateMask = 0;
        self.pixelDensity = 100.0;  // TODO
        self.primaryOrientation =  Qt.PrimaryOrientation;
        self.width = window.innerWidth;
    }
}
registerQmlType({
  module:   'QmlWeb',
  name:     'RestModel',
  versions: /.*/,
  constructor: function QMLRestModel(meta) {
    QMLItem.call(this, meta);
    var self = this;
    var attributes = this.getAttributes();

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

registerQmlType({
  module: 'QtQuick',
  name:   'Settings',
  versions: /.*/,
  constructor: function QMLSettings(meta) {
    QMLItem.call(this, meta);

    createSimpleProperty("string", this, "category");

    if (typeof window.localStorage == 'undefined')
      return ;

    var attributes;

    var getKey = (function(attrName) {
      return this.category + '/' + attrName;
    }).bind(this);

    var loadProperties = (function() {
      for (var i = 0 ; i < attributes.length ; ++i) {
        this[attributes[i]] = localStorage.getItem(getKey(attributes[i]));
      }
    }).bind(this);

    var initializeProperties = (function() {
      for (var i = 0 ; i < attributes.length ; ++i) {
        var attrName   = attributes[i];
        var signalName = attrName + 'Changed';
        var emitter    = this;

        if (this.$properties[attrName].type == 'alias') {
          emitter    = this.$context[this.$properties[attrName].val.objectName];
          signalName = this.$properties[attrName].val.propertyName + 'Changed';
        }
        emitter[signalName].connect(this, (function() {
          localStorage.setItem(getKey(this.attrName), this.self[this.attrName]);
        }).bind({ self: this, attrName: attrName }));
      }
    }).bind(this);

    this.Component.completed.connect(this, (function() {
      attributes = this.getAttributes();
      loadProperties();
      initializeProperties();
    }).bind(this));
  }
});

})(typeof global != 'undefined' ? global : window);

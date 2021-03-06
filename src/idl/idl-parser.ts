/*
 *  corba.js Object Request Broker (ORB) and Interface Definition Language (IDL) compiler
 *  Copyright (C) 2018 Mark-André Hopf <mhopf@mark13.org>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Type, Node } from "./idl-node"
import { Lexer } from "./idl-lexer"

let lexer: Lexer
let typenames: Map<string, Node>

function addTypename(name: string, type: Node): void {
/*
    this does not work with modules
    if (typenames.has(name))
        throw Error("duplicate typename '"+name+"'")
*/
    typenames.set(name, type)
}

function expect(text: string, customMessage?: string): void {
    let t0 = lexer.lex()
    let errorMessage
    if (customMessage === undefined)
        errorMessage = "expected '"+text+"'"
    else
        errorMessage = customMessage
    
    if (t0 === undefined)
        throw Error(errorMessage+" but found end of file")
    if (t0.type !== Type.TKN_TEXT || t0.text !== text) {
        throw Error(errorMessage) // "expected '"+text+"' but found "+t0.toString())
    }
}

// 1
export function specification(aLexer: Lexer): Node | undefined
{
    lexer = aLexer
    typenames = new Map<string, Node>()
    
    let node = new Node(Type.SYN_SPECIFICATION)
    while(true) {
        let t0 = definition()
        if (t0 === undefined)
            break
        node.add(t0)
    }
    
    for(let [typename, typenode] of typenames) {
        if (typenode.type === Type.TKN_NATIVE ||
            typenode.type === Type.SYN_INTERFACE ||
            typenode.type === Type.TKN_VALUETYPE)
            continue
        node.add(typenode)
    }
    
    return node
}

// 2
function definition(): Node | undefined
{
    let t0
    t0 = type_dcl()
    if (t0 === undefined)
        t0 = _interface()
    if (t0 === undefined)
        t0 = _module()
    if (t0 === undefined)
        t0 = value()
    
    if (t0 !== undefined) {
        expect(';')
    }
    return t0
}

// 3
function _module(): Node | undefined
{
    let t0 = lexer.lex()
    if (t0 !== undefined && t0.type === Type.TKN_MODULE) {
        let t1 = identifier()
        if (t1 === undefined)
            throw Error("exepted identifer after 'module'")
        t0.text = t1.text
        expect("{")
        while(true) {
            let t2 = definition()
            if (t2 === undefined)
                break
            t0.add(t2)
        }
        expect("}")
        return t0
    }
    lexer.unlex(t0)
    return undefined
}

// 4
function _interface(): Node | undefined
{
    return interface_dcl()
}

// 5
function interface_dcl(): Node | undefined
{
    let t0 = interface_header()
    if (!t0) {
    
        t0 = lexer.lex()
        if (t0) {
            lexer.unlex(t0)
        }
    
        return undefined
    }
    let t1 = lexer.lex()
    if (t1 === undefined)
        throw Error("expected { after interface header but got end of file")
    if (t1.type !== Type.TKN_TEXT && t1.text != '{')
        throw Error("expected { after interface header but got "+t0.toString())

    let t2 = interface_body()
    
    let t3 = lexer.lex()
    if (!t3)
        throw Error("unexpected end of file")
    if (t3.type !== Type.TKN_TEXT && t3.text != '}')
        throw Error("expected } after interface header but got "+t3.toString())
        
    let node = new Node(Type.SYN_INTERFACE)
    node.add(t0)
    node.add(t2)
    addTypename(t0.child[1]!.text!, node)
    return node
}

// 7
function interface_header(): Node | undefined
{
    let t0 = lexer.lex()
    if (t0 === undefined)
        return undefined
    let t1
    if (t0.type !== Type.TKN_ABSTRACT && t0.type !== Type.TKN_LOCAL) {
        t1 = t0
        t0 = undefined
    } else {
        t1 = lexer.lex()
    }
    if (t1 === undefined) {
        lexer.unlex(t0)
        return undefined
    }
    if (t1.type !== Type.TKN_INTERFACE) {
        lexer.unlex(t1)
        lexer.unlex(t0)
        return undefined
    }
    
    let t2 = identifier()
    if (t2 === undefined)
        throw Error("expected identifier after 'interface'")
        
    // let t3 = interface_inheritance_spec()
    let header = new Node(Type.SYN_INTERFACE_HEADER)
    header.add(t0)
    header.add(t2)
    header.add(undefined)
    return header
}

// 8
function interface_body(): Node
{
    let body = new Node(Type.SYN_INTERFACE_BODY)
    while(true) {
        let t0 = _export()
        if (t0 === undefined)
            return body
        body.add(t0)
    }
}

// 9
function _export(): Node | undefined
{
    let t0 = attr_dcl()
    if (t0 === undefined)
        t0 = op_dcl()
    if (t0 === undefined)
        return undefined
    expect(';')
    return t0
}

// 12
function scoped_name(): Node | undefined
{
    let t0
    t0 = identifier()
    
    if (t0 !== undefined) {
        let type = typenames.get(t0.text!)
        if (type === undefined)
            throw Error("encountered undefined type '"+t0.text+"'")
        t0.add(type)
    }
    // "::" stuff is missing
    return t0
}

// 13
function value(): Node | undefined
{
    let t0
    t0 = value_dcl()
    if (t0 !== undefined)
        return t0
    t0 = value_abs_dcl()
    if (t0 !== undefined)
        return t0
    t0 = value_box_dcl()
    if (t0 !== undefined)
        return t0
    t0 = value_forward_dcl()
    if (t0 !== undefined)
        return t0
    return undefined
}

// 14
function value_forward_dcl(): Node | undefined
{
    return undefined
}

// 15
function value_box_dcl(): Node | undefined
{
    return undefined
}

// 16
function value_abs_dcl(): Node | undefined
{
    return undefined
}

// 17
function value_dcl(): Node | undefined
{
    let header = value_header()
    if (header === undefined) {
        return undefined
    }

    expect('{')

    let node = new Node(Type.TKN_VALUETYPE)
    node.add(header)
    
    let identifier = header.child[1]!.text!

    node.text = identifier
    addTypename(identifier, node)
    
    while(true) {
        let t1 = value_element()
        if (t1 === undefined)
            break
        node.add(t1)
    }

    expect('}', "valuetype attributes must be prefixed with either 'public' or 'private'")

    return node
}

// 18
function value_header(): Node | undefined
{
    let t0 = lexer.lex()
    if (t0 !== undefined) {
        let t1
        if (t0.type === Type.TKN_CUSTOM) {
            throw Error("corba.js currently does not support custom valuetypes")
            // t1 = lexer.lex()
        } else {
            t1 = t0
            t0 = undefined
        }
        if (t1 !== undefined && t1.type === Type.TKN_VALUETYPE) {
            let t2 = identifier()
            if (t2 === undefined)
                throw Error("expected an identifier after valuetype")
            let t3 = value_inheritance_spec()
            
            let node = new Node(Type.SYN_VALUE_HEADER)
            node.add(t0)
            node.add(t2)
            node.add(t3)
            return node
        }
        lexer.unlex(t1)
    }
    lexer.unlex(t0)
    return undefined
}

// 19
function value_inheritance_spec(): Node | undefined
{
    let t0 = lexer.lex()
    if (t0 === undefined || t0.type !== Type.TKN_TEXT || t0.text !== ":") {
        lexer.unlex(t0)
        return undefined
    }
    
    let t1 = lexer.lex()
    if (t1 !== undefined && t1.type !== Type.TKN_TRUNCATABLE) {
        lexer.unlex(t1)
        t1 = undefined
    }
    if (t1 !== undefined)
        throw Error("'truncatable' is not supported")

    let node = new Node(Type.SYN_VALUE_INHERITANCE_SPEC)
    node.add(t1)
        
    while(true) {
        let t2 = value_name()
        if (t2 === undefined) {
            throw Error("expected a value name after '"+t0.text+"'")
        }
        node.add(t2)
        let t3 = lexer.lex()
        if (t3 === undefined)
            throw Error("unexpected end of file")
        if (t3.type !== Type.TKN_TEXT || t3.text !== ",") {
            lexer.unlex(t3)
            break
        }
        t0 = value_name()
        if (t0 === undefined)
            throw Error("expected a value name after ':'")
    }
    return node
}

// 20
function value_name(): Node | undefined
{
    return scoped_name()
}

// 21
function value_element(): Node | undefined
{
    let t0 = _export()
    if (t0 === undefined)
        t0 = state_member()
/*
    if (t0 === undefined)
        t0 = init_dcl()
*/
    return t0
}

// 22
function state_member(): Node | undefined
{
    let t0 = lexer.lex()
    if (t0 === undefined)
        return undefined
    if (t0.type !== Type.TKN_PUBLIC && t0.type !== Type.TKN_PRIVATE) {
        lexer.unlex(t0)
        return undefined
    }

    let t1 = type_spec()
    if (t1 === undefined) {
        lexer.unlex(t0)
        return undefined
    }

    let t2 = declarators()
    if (t2 === undefined) {
        throw Error("expected declarators")
    }

    expect(";")

    let node = new Node(Type.SYN_STATE_MEMBER)
    node.add(t0)
    node.add(t1)
    node.add(t2)
    return node
}

// 42
function type_dcl(): Node | undefined
{
    let t0 = lexer.lex()
    if (t0 !== undefined && t0.type === Type.TKN_NATIVE) {
        let t1 = simple_declarator()
        if (t1 === undefined) {
            throw Error("expected simple declarator after 'native'")
        }
        t0.add(t1)
        t0.text = t1.text
        addTypename(t1.text!, t0)
        return t0
    }
    lexer.unlex(t0)
    return undefined
}

// 44
function type_spec(): Node | undefined
{
    let t0
    t0 = simple_type_spec()
/*
    if (t0 === undefined)
        t0 = constr_type_spec()
*/
    return t0
}

// 45
function simple_type_spec(): Node | undefined
{
    let t0
    t0 = base_type_spec()
    if (t0 === undefined)
        t0 = template_type_spec()
    if (t0 === undefined)
        t0 = scoped_name()
    return t0
}

// 46
function base_type_spec(): Node | undefined
{
    let t0
    t0 = floating_pt_type()
    if (t0 !== undefined)
        return t0
    t0 = integer_type()
    if (t0 !== undefined)
        return t0
    t0 = char_type()
    if (t0 !== undefined)
        return t0
    t0 = wide_char_type()
    if (t0 !== undefined)
        return t0
    t0 = boolean_type()
    if (t0 !== undefined)
        return t0
    t0 = octet_type()
    if (t0 !== undefined)
        return t0
    t0 = any_type()
    if (t0 !== undefined)
        return t0
    return undefined
}

// 47
function template_type_spec(): Node | undefined
{
    let t0
    t0 = sequence_type()
    if (t0 !== undefined)
        return t0
    t0 = string_type()
    if (t0 !== undefined)
        return t0
    t0 = wide_string_type()
    if (t0 !== undefined)
        return t0
/*
    t0 = fixed_pt_type()
    if (t0 !== undefined)
        return t0
*/
    return undefined
}

// 49
function declarators(): Node | undefined
{
    let t0 = declarator()
    if (t0 === undefined)
        return undefined
    let node = new Node(Type.SYN_DECLARATORS)
    while(true) {
        node.add(t0)
        let t1 = lexer.lex()
        if (t1 === undefined || t1.type !== Type.TKN_TEXT || t1.text !== ",") {
            lexer.unlex(t1)
            break
        }
        t0 = declarator()
        if (t0 === undefined)
            throw Error("expected another declarator after ','")
    }
    return node
}

// 50
function declarator(): Node | undefined
{
    let t0
    t0 = simple_declarator()
/*
    if (t0 === undefined)
        t0 = complex_declarator()
*/
    return t0
}

// 51
function simple_declarator(): Node | undefined
{
    return identifier()
}

// 53
function floating_pt_type(): Node | undefined
{
    let t0 = lexer.lex()
    if (t0 === undefined)
        return undefined
    if (t0.type === Type.TKN_FLOAT)
        return t0
    if (t0.type === Type.TKN_DOUBLE)
        return t0
    if (t0.type === Type.TKN_LONG) {
        let t1 = lexer.lex()
        if (t1 !== undefined && t1.type === Type.TKN_DOUBLE) {
            t1.type = Type.SYN_LONG_DOUBLE
            return t1
        }
        lexer.unlex(t1)
    }
    lexer.unlex(t0)
    return undefined
}

// 54
function integer_type(): Node | undefined
{
    let t0
    t0 = signed_int()
    if (t0 !== undefined)
        return t0
    t0 = unsigned_int()
    if (t0 !== undefined) {
        return t0
    }
    return undefined
}

// 55
function signed_int(): Node | undefined
{
    let t0
    t0 = signed_short_int()
    if (t0 !== undefined)
        return t0
    t0 = signed_longlong_int()
    if (t0 !== undefined)
        return t0
    t0 = signed_long_int()
    if (t0 !== undefined)
        return t0
    return undefined
}

// 56
function signed_short_int(): Node | undefined
{
    let t0 = lexer.lex()
    if (t0 !== undefined && t0.type === Type.TKN_SHORT)
        return t0
    lexer.unlex(t0)
    return undefined
}

// 57
function signed_long_int(): Node | undefined
{
    let t0 = lexer.lex()
    if (t0 === undefined)
        return undefined
    if (t0.type === Type.TKN_LONG)
        return t0
    lexer.unlex(t0)
    return undefined
}

// 58
function signed_longlong_int(): Node | undefined
{
    let t0 = lexer.lex()
    if (t0 !== undefined && t0.type === Type.TKN_LONG) {
        let t1 = lexer.lex()
        if (t1 !== undefined && t1.type === Type.TKN_LONG) {
            t0.type = Type.SYN_LONGLONG
            return t0
        }
        lexer.unlex(t1)
    }
    lexer.unlex(t0)
    return undefined
}

// 59
function unsigned_int(): Node | undefined
{
    let t0
    t0 = unsigned_short_int()
    if (t0 !== undefined)
        return t0
    t0 = unsigned_longlong_int()
    if (t0 !== undefined)
        return t0
    t0 = unsigned_long_int()
    if (t0 !== undefined)
        return t0
    return undefined
}

// 60
function unsigned_short_int(): Node | undefined
{
    let t0 = lexer.lex()
    if (t0 !== undefined && t0.type === Type.TKN_UNSIGNED) {
        let t1 = lexer.lex()
        if (t1 !== undefined && t1.type === Type.TKN_SHORT) {
            t0.type = Type.SYN_UNSIGNED_SHORT
            return t0
        }
        lexer.unlex(t1)
    }
    lexer.unlex(t0)
    return undefined
}

// 61
function unsigned_long_int(): Node | undefined
{
    let t0 = lexer.lex()
    if (t0 !== undefined && t0.type === Type.TKN_UNSIGNED) {
        let t1 = lexer.lex()
        if (t1 !== undefined && t1.type === Type.TKN_LONG) {
            t0.type = Type.SYN_UNSIGNED_LONG
            return t0
        }
        lexer.unlex(t1)
    }
    lexer.unlex(t0)
    return undefined
}

// 62
function unsigned_longlong_int(): Node | undefined
{
    let t0 = lexer.lex()
    if (t0 !== undefined && t0.type === Type.TKN_UNSIGNED) {
        let t1 = lexer.lex()
        if (t1 !== undefined && t1.type === Type.TKN_LONG) {
            let t2 = lexer.lex()
            if (t2 !== undefined && t2.type === Type.TKN_LONG) {
                t0.type = Type.SYN_UNSIGNED_LONGLONG
                return t0
            }
            lexer.unlex(t2)
        }
        lexer.unlex(t1)
    }
    lexer.unlex(t0)
    return undefined
}

// 63
function char_type(): Node | undefined
{
    let t0 = lexer.lex()
    if (t0 !== undefined && t0.type == Type.TKN_CHAR)
        return t0
    lexer.unlex(t0)
    return undefined
}

// 64
function wide_char_type(): Node | undefined
{
    let t0 = lexer.lex()
    if (t0 !== undefined && t0.type == Type.TKN_WCHAR)
        return t0
    lexer.unlex(t0)
    return undefined
}

// 65
function boolean_type(): Node | undefined
{
    let t0 = lexer.lex()
    if (t0 !== undefined && t0.type == Type.TKN_BOOLEAN)
        return t0
    lexer.unlex(t0)
    return undefined
}

// 66
function octet_type(): Node | undefined
{
    let t0 = lexer.lex()
    if (t0 !== undefined && t0.type == Type.TKN_OCTET)
        return t0
    lexer.unlex(t0)
    return undefined
}

// 67
function any_type(): Node | undefined
{
    let t0 = lexer.lex()
    if (t0 !== undefined && t0.type == Type.TKN_ANY)
        return t0
    lexer.unlex(t0)
    return undefined
}

// 80
function sequence_type(): Node | undefined
{
    let t0 = lexer.lex()
    if (t0 !== undefined && t0.type === Type.TKN_SEQUENCE) {
        // "sequence" "<" simple_type_spec "," positive_int_const ">"
        expect("<")
        let t1 = simple_type_spec()
        if (t1 === undefined)
            throw Error("expected type after 'sequence <'")
        expect(">")
        t0.add(t1)
        t0.add(undefined)
        return t0
    }
    lexer.unlex(t0)
    return undefined
}

// 81
function string_type(): Node | undefined
{
    let t0 = lexer.lex()
    if (t0 !== undefined && t0.type === Type.TKN_STRING) {
        // 'string' '<' <positive_int_const> '>'
        return t0
    }
    lexer.unlex(t0)
    return undefined
}

// 82
function wide_string_type(): Node | undefined
{
    let t0 = lexer.lex()
    if (t0 !== undefined && t0.type === Type.TKN_WSTRING) {
        // 'wstring' '<' <positive_int_const> '>'
        return t0
    }
    lexer.unlex(t0)
    return undefined
}

// 85
function attr_dcl(): Node | undefined
{
    let t0
    t0 = readonly_attr_spec()
    if (t0 === undefined)
        t0 = attr_spec()
    return t0
}

// 87 (Operation Declaration)
function op_dcl(): Node | undefined
{
    let t0 = op_attribute() // opt
    let t1 = op_type_spec()
    if (t1 === undefined) {
        lexer.unlex(t0)
        return undefined
    }
    let t2 = identifier()
    if (t2 === undefined) {
        throw Error("expected identifier")
    }
    let t3 = parameter_dcls()
    if (t3 === undefined) {
        // throw Error("expected parameter declaration after "+t2.toString())
        lexer.unlex(t2)
        lexer.unlex(t1)
        lexer.unlex(t0)
        return undefined
    }

    let node = new Node(Type.SYN_OPERATION_DECLARATION)
    node.add(t0)
    node.add(t1)
    node.add(t2)
    node.add(t3)
    node.add(undefined)
    node.add(undefined)
    return node
}

// 88
function op_attribute(): Node | undefined
{
    let t0 = lexer.lex()
    if (!t0)
        return undefined
    if (t0.type !== Type.TKN_ONEWAY) {
        lexer.unlex(t0)
        return undefined
    }
    return t0
}

// 89
function op_type_spec(): Node | undefined
{
    let t0 = param_type_spec()
    if (t0 !== undefined)
        return t0
    t0 = lexer.lex()
    if (t0 !== undefined && t0.type === Type.TKN_VOID)
         return t0
    lexer.unlex(t0)
    return undefined
}

// 90
function parameter_dcls(): Node | undefined
{
    let t0 = lexer.lex()
    if (!t0) {
        return undefined
    }
    if (t0.type !== Type.TKN_TEXT || t0.text !== '(') {
        lexer.unlex(t0)
        return undefined
    }
 
    let declarations = new Node(Type.SYN_PARAMETER_DECLARATIONS)
    while(true) {
        let t1 = param_dcl()
        if (t1 !== undefined)
            declarations.add(t1)
    
        let t2 = lexer.lex()
    
        if (t2 !== undefined && t2.type === Type.TKN_TEXT && t2.text === ')') {
            break
        }
        if (t2 !== undefined && t2.type === Type.TKN_TEXT && t2.text === ",") {
            continue
        }
        if (t2 !== undefined)
            throw Error("expected 'in', 'out', 'inout' or ')' to end for parameter declaration but got "+t2.toString())
        else
            throw Error("expected 'in', 'out', 'inout' or ')' to end for parameter declaration but end of file")
    }
    return declarations
}

// 91
function param_dcl(): Node | undefined
{
    let t0 = param_attribute()
    if (t0 === undefined)
        return undefined

    let t1 = param_type_spec()
    if (t1 === undefined) {
        t1 = lexer.lex()
        if (t1 !== undefined)
            throw Error("expected type specification but got "+t1.toString())
        else
            throw Error("expected type specification but found end of file")
    }

    let t2 = simple_declarator()
    if (t2 === undefined) {
        lexer.unlex(t1)
        lexer.unlex(t0)
        return undefined
    }

    let declaration = new Node(Type.SYN_PARAMETER_DECLARATION)
    declaration.add(t0)
    declaration.add(t1)
    declaration.add(t2)
    return declaration
}

// 92
function param_attribute(): Node | undefined
{
    let t0 = lexer.lex()
    if (t0 === undefined)
        return undefined
    switch(t0.type) {
        case Type.TKN_IN:
        case Type.TKN_OUT:
        case Type.TKN_INOUT:
            return t0
    }
    lexer.unlex(t0)
    return undefined
}

// 95
function param_type_spec(): Node | undefined
{
    let t0
    t0 = base_type_spec()
    if (t0 !== undefined)
        return t0
    t0 = template_type_spec()	// not in the CORBA specs but MICO does this, usually an typedef would be required for this
    if (t0 !== undefined)
        return t0
/*
    t0 = string_type()
    if (t0 !== undefined)
        return t0
    t0 = wide_string_type()
    if (t0 !== undefined)
        return t0
*/
    t0 = scoped_name()
    if (t0)
        return t0
    return undefined
}

// 104
function readonly_attr_spec(): Node | undefined
{
    let t0 = lexer.lex()
    if (t0 !== undefined && t0.type === Type.TKN_READONLY) {
        let t1 = lexer.lex()
        if (t1 !== undefined && t1.type === Type.TKN_ATTRIBUTE) {
            let t2 = param_type_spec()
            if (t2 === undefined)
                throw Error("expected type specifier after 'readonly attribute'")
            let t3 = readonly_attr_declarator()
            if (t3 === undefined)
                throw Error("expected declarator for 'readonly attribute'")
            t1.add(t0)
            t1.add(t2)
            t1.add(t3)
            return t1
        }
        lexer.unlex(t1)
    }
    lexer.unlex(t0)
    return undefined
}

// 105
function readonly_attr_declarator(): Node | undefined
{
    let t0 = simple_declarator()
    if (t0 === undefined)
        return undefined
    let node = new Node(Type.SYN_DECLARATORS)
    while(true) {
        node.add(t0)
        let t1 = lexer.lex()
        if (t1 === undefined || t1.type !== Type.TKN_TEXT || t1.text! !== ",") {
            lexer.unlex(t1)
            return node
        }
        t0 = simple_declarator()
        if (t0 === undefined)
            throw Error("expected another declarator after ','")
    }
}

// 106
function attr_spec(): Node | undefined
{
    let t0 = lexer.lex()
    if (t0 !== undefined && t0.type === Type.TKN_ATTRIBUTE) {
        let t1 = param_type_spec()
        if (t1 === undefined)
            throw Error("expected type specifier after 'attribute'")
        let t2 = attr_declarator()
        if (t2 === undefined)
            throw Error("expected declarator for 'attribute'")
        t0.add(undefined)
        t0.add(t1)
        t0.add(t2)
        return t0
    }
    lexer.unlex(t0)
    return undefined
}

// 107
function attr_declarator(): Node | undefined
{
    let t0 = simple_declarator()
    if (t0 === undefined)
        return undefined
    let node = new Node(Type.SYN_DECLARATORS)
    while(true) {
        node.add(t0)
        let t1 = lexer.lex()
        if (t1 === undefined || t1.type !== Type.TKN_TEXT || t1.text! !== ",") {
            lexer.unlex(t1)
            return node
        }
        t0 = simple_declarator()
        if (t0 === undefined)
            throw Error("expected another declarator after ','")
    }
}

function identifier(): Node | undefined
{
    let t0 = lexer.lex()
    if (t0 !== undefined && t0.type === Type.TKN_IDENTIFIER)
        return t0
    lexer.unlex(t0)
    return undefined
}

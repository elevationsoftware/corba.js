/*
 *  glue.js Object Request Broker (ORB) and Interface Definition Language (IDL) compiler
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

// 1
export function specification(aLexer: Lexer): Node | undefined
{
    lexer = aLexer
    
    let node = new Node(Type.SYN_SPECIFICATION)
    while(true) {
        let t0 = definition()
        if (t0 === undefined)
            break
        node.add(t0)
    }
    return node
}

// 2
function definition(): Node | undefined
{
    let t0 = _interface()
    if (t0 !== undefined) {
        let t1 = lexer.lex()
        if (t1 !== undefined && t1.type === Type.TKN_TEXT && t1.text === ';')
            return t0
        lexer.unlex(t1)
    }
    lexer.unlex(t0)
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
            console.log("looked for header but found "+t0.toString())
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
    let t0
    t0 = op_decl()
    if (t0===undefined)
        return undefined

    let t1 = lexer.lex()    
    if (t1 !== undefined && t1.type === Type.TKN_TEXT && t1.text === ';')
        return t0
    if (t1 !== undefined)
        throw Error("expected ';' but got "+t1.toString())
    else
        throw Error("expected ';' but got end of file")
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
//            return t0.add(t1) FIXME
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

// 87 (Operation Declaration)
function op_decl(): Node | undefined
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
    if (t3 === undefined)
        throw Error("expected parameter declaration")

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
            throw Error("expected ')' at end for parameter declaration but got "+t2.toString())
        else
            throw Error("expected ')' at end for parameter declaration but end of file")
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
    throw Error("expected either 'in', 'out' or 'inout'")
}

// 95
function param_type_spec(): Node | undefined
{
    let t0
    t0 = base_type_spec()
    if (t0 !== undefined)
        return t0
    t0 = string_type()
    if (t0 !== undefined)
        return t0
/*
    if (t0)
        return t0
    t0 = wide_string_type()
    if (t0)
        return t0
    t0 = scoped_name()
*/
    return undefined
}

function identifier(): Node | undefined
{
    let t0 = lexer.lex()
    if (t0 !== undefined && t0.type === Type.TKN_IDENTIFIER)
        return t0
    lexer.unlex(t0)
    return undefined
}
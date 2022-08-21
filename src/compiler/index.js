import { parseHTML } from './parse.js'
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g

function genProps(attrs) {
    let str = ''
    for (let i = 0; i < attrs.length; i++) {
        const attr = attrs[i];
        if (attr.name === 'style') {
            let obj = {}
            attr.value.split(';').forEach(item => {
                let [key, value] = item.split(':')
                obj[key] = value
            });
            attr.value = obj
        }
        str += `${attr.name}:${JSON.stringify(attr.value)},`

    }
    return `{${str.slice(0, -1)}}` // 删除结尾的逗号
}

function gen(node) {
    if (node.type === 1) {
        return codeGen(node)
    } else {
        // 如果只包含文本的话
        let text = node.text
        if (!defaultTagRE.test(text)) {
            return `_v(${JSON.stringify(text)})`
        } else {
            let tokens = []
            let match;
            defaultTagRE.lastIndex = 0 //需要重新置零,因为是全局的
            let lastIndex = 0
            while (match = defaultTagRE.exec(text)) {
                let index = match.index
                if (index > lastIndex) {
                    // 把中间的文字也加进去
                    tokens.push(JSON.stringify(text.slice(lastIndex, index)))
                }
                tokens.push(`_s(${match[1].trim()})`)
                lastIndex = index + match[0].length
            }
            if (lastIndex < text.length) {
                tokens.push(JSON.stringify(text.slice(lastIndex)))
            }
            return `_v(${tokens.join('+')})`
        }
    }
}

function genChildren(children) {
    return children.map(child => gen(child)).join(',')
}

function codeGen(ast) {
    let children = genChildren(ast.children)
    let code = (`_c('${ast.tag}',${ast.attrs.length > 0 ? genProps(ast.attrs) : 'null'}
    ${ast.children.length ? `,${children}` : ''})`)
    return code
}

export function compileToFunction(template) {
    // 1. 将template转换为ast语法树
    let ast = parseHTML(template)
    // 2. 生成render方法,(返回虚拟dom)
    // js模板引擎的实现原理都是 with + new function
    let code = codeGen(ast)
    code = `with(this){return ${code}}`
    let render = new Function(code)
    console.log(render)
    return render
}
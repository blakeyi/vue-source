const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`
const qnameCapture = `((?:${ncname}\\:)?${ncname})`
const startTagOpen = new RegExp(`^<${qnameCapture}`)
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`)
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s""=<>`]+)))?/
const startTagClose = /^\s*(\/?)>/
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g


// vue3采用的不是正则
// 对模板进行编译处理

function parseHTML(html) {
    const ELEMENT_TYPE = 1
    const TEXT_TYPE = 3
    const stack = []
    let currentParent;
    let root;
    function createASTElement(tag, attrs) {
        return {
            tag,
            type:ELEMENT_TYPE,
            children:[],
            attrs,
            parent:null
        }
    }
    function start (tag, attrs) {
       let node = createASTElement(tag, attrs)
       if ( !root ) {
           root = node
       }
       if (currentParent) {
           node.parent = currentParent
       }
       stack.push(node)
       currentParent = node
    }

    function chars (text) {
        currentParent.children.push({
            type: TEXT_TYPE,
            text
        })
    }
    function end (tag) {
       stack.pop()
       currentParent = stack.slice[-1][0]
    }
    function advance(n) {
        html = html.substring(n)
    }
    function parseStartTag() {
        const start = html.match(startTagOpen);
        if (start) {
            const match = {
                tagName:start[1],
                attrs:[]
            }
            advance(start[0].length)
             // 如果不是开始标签的结束,就一直匹配下去
            let attr, end;
            while(!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
                advance(attr[0].length)
                match.attrs.push({
                    name:attr[1],
                    value:attr[3] || attr[4] || attr[5] || true
                })
            }
            if (end) {
                advance(end[0].length)
            }
            return match
        }
        return false
    }
    while(html) {
        debugger
        let textEnd = html.indexOf('<');
        if (textEnd === 0) {
            const startTagMatch = parseStartTag();
            if (startTagMatch) {
                start(startTagMatch.tagName, startTagMatch.attrs)
                continue
            }
            let endTagMatch = html.match(endTag)
            if (endTagMatch) {
                advance(endTagMatch[0].length)
                end(endTagMatch[1])
                continue
            }
        }
        if (textEnd > 0) {
            let text = html.substring(0, textEnd)
            if (text) {
                advance(text.length)
            }
        }
    }
    console.log(html)
}

export function compileToFunction(template) {
    // 1. 将template转换为ast语法树
    parseHTML(template)
    // 2. 生成render方法,(返回虚拟dom)

}
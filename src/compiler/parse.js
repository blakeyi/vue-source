const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; //匹配标签名；形如 abc-123
const qnameCapture = `((?:${ncname}\\:)?${ncname})`; //匹配特殊标签;形如 abc:234,前面的abc:可有可无；获取标签名；
const startTagOpen = new RegExp(`^<${qnameCapture}`); // 匹配标签开头；形如  <  ；捕获里面的标签名
const startTagClose = /^\s*(\/?)>/; // 匹配标签结尾，形如 >、/>
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配结束标签 如 </abc-123> 捕获里面的标签名
const attribute =
  /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // 匹配属性  形如 id="app"


// 主要思路:
// 通过正则进行匹配开始,结束标签和属性内容以及文字内容,递归获取,构造成一棵树,树的结构如下
// {
//     tag,
//     type:ELEMENT_TYPE,
//     children:[],
//     attrs,
//     parent:null
// }

// vue3采用的不是正则
// 对模板进行编译处理

export function parseHTML(html) {
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
           currentParent.children.push(node)
       }
       stack.push(node)
       currentParent = node
    }

    function chars (text) {
        text = text.replace(/\s/g, "")
        text && currentParent.children.push({
            type: TEXT_TYPE,
            text
        })
    }
    function end (tag) {
       stack.pop()
       currentParent = stack[stack.length - 1]
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
                chars(text)
                advance(text.length)
            }
        }
    }
    return root
}

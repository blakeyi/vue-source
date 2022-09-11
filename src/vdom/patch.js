export function patch(oldVNode, vnode, vm) {
    const isRealElem = oldVNode.nodeType
    if (isRealElem) {
        // 初次渲染
        const elem = oldVNode
        const parentElem = elem.parentNode
        let newElem = createElem(vnode)
        parentElem.insertBefore(newElem, elem.nextSibling)
        parentElem.removeChild(elem)
        return newElem
    } else {
        // diff算法
        return patchVNode(oldVNode, vnode)
    }
}

function createElem(vnode) {
    let { tag, data, key, children, text } = vnode
    if (typeof tag === 'string') {
        vnode.el = document.createElement(tag)
        updateProperties(vnode)
        children.forEach(child => {
            vnode.el.appendChild(createElem(child))
        });
    } else {
        vnode.el = document.createTextNode(text)
    }
    return vnode.el
}

// 解析vnode的data属性，映射到真实dom上
function updateProperties(vnode, oldProps = {}) {
    const newProps = vnode.data || {};
    const el = vnode.el; // 真实节点

    // 如果新的节点没有 需要把老的节点属性移除
    for (const k in oldProps) {
        if (!newProps[k]) {
            el.removeAttribute(k);
        }
    }

    // 对style样式做特殊处理 如果新的没有 需要把老的style值置为空
    const newStyle = newProps.style || {};
    const oldStyle = oldProps.style || {};
    for (const key in oldStyle) {
        if (!newStyle[key]) {
            el.style[key] = "";
        }
    }

    // 遍历新的属性 进行增加操作
    for (const key in newProps) {
        if (key === "style") {
            for (const styleName in newProps.style) {
                el.style[styleName] = newProps.style[styleName];
            }
        } else if (key === "class") {
            el.className = newProps.class;
        } else {
            // 给这个元素添加属性 值就是对应的值
            el.setAttribute(key, newProps[key]);
        }
    }
}

function isSameVNode(oldVNode, newVNode) {
    return oldVNode.tag === newVNode.tag && oldVNode.key === newVNode.key
}

function patchVNode(oldVNode, newVNode) {
    if (!isSameVNode(oldVNode, newVNode)) {
        // 用节点的父亲进行替换
        let el = createElem(newVNode)
        oldVNode.el.parentNode.replaceChild(el, oldVNode.el)
        return el
    }

    // 文本情况, 直接对比内容
    let el = newVNode.el = oldVNode.el
    if (!oldVNode.tag) { // 文本没有tag
        if (oldVNode.text !== newVNode.text) {
            el.textContent = newVNode.text
        }
        return el
    }

    // 是标签的话, 需要对比标签的属性
    updateProperties(newVNode, oldVNode.data)

    // 然后比较儿子节点

    let oldChildren = oldVNode.children || []
    let newChildren = newVNode.children || []

    if (oldChildren.length > 0 && newChildren.length > 0) {
        // 都有儿子节点
        updateChildren(el, oldChildren, newChildren)
    } else if (newChildren.length > 0) {
        mountChildren(el, newChildren)
    } else if (oldChildren.length > 0) {
        mountChildren(el, oldChildren)
    }

    return el
}

function mountChildren(el, newChildren) {
    for (let i = 0; i < newChildren.length; i++) {
        const child = newChildren[i];
        el.innerHTML = ''

    }
}

function updateChildren(el, oldChildren, newChildren) {
    // 总体上采用双指针, 宗旨是尽量复用原来dom上的节点
    let oldStartIndex = 0
    let newStartIndex = 0
    let oldEndIndex = oldChildren.length - 1
    let newEndIndex = newChildren.length - 1

    let oldStartVNode = oldChildren[0]
    let newStartVNode = newChildren[0]

    let oldEndVNode = oldChildren[oldEndIndex]
    let newEndVNode = newChildren[newEndIndex]

    function makeIndexByKey(children) {
        let map = {}
        children.forEach((child, index) => {
            map[child.key] = index
        })
        return map
    }

    let map = makeIndexByKey(oldChildren)

    while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
        // 双方有一方头指针大于尾指针就停止循环
        if (!oldStartVNode) {
            oldStartVNode = oldChildren[++oldStartIndex]
        } else if (!oldEndVNode) {
            oldEndVNode = oldChildren[--oldEndIndex]
        } else if (isSameVNode(oldStartVNode, newStartVNode)) {
            // 如果是相同节点,则递归检查其孩子节点
            patchVNode(oldStartVNode, newStartVNode)
            oldStartVNode = oldChildren[++oldStartIndex]
            newStartVNode = newStartVNode[++newStartIndex]
            // 比较开头节点
        } else if (isSameVNode(oldEndVNode, newEndVNode)) {
            patchVNode(oldEndVNode, newEndVNode)
            oldEndVNode = oldChildren[--oldEndIndex]
            newStartVNode = newChildren[--newEndIndex]
        } else if (isSameVNode(oldEndVNode, newStartVNode)) {
            // 头尾开始对比
            patchVNode(oldEndVNode, newStartVNode)
            // 将老的尾结点插入到最前面
            el.insertBefore(oldEndVNode.el, oldStartVNode.el)
            oldEndVNode = oldChildren[--oldEndIndex]
            newStartVNode = newChildren[++newStartIndex]
        } else if (isSameVNode(oldStartVNode, newEndVNode)) {
            // 头尾开始对比
            patchVNode(oldStartVNode, newEndVNode)
            // 将老的尾结点插入到最前面
            el.insertBefore(oldStartVNode.el, oldEndVNode.el.nextSibling)
            oldStartVNode = oldChildren[++oldStartIndex]
            newEndVNode = newChildren[--newEndIndex]
        } else {
            // 乱序对比,根据老的列表做一个映射, 用新的去找,找到则移动,找不到则添加
            // 最后多余的就删除

            let moveIndex = map[newStartVNode.key]
            if (!moveIndex) {
                let moveVNode = oldChildren[moveIndex]
                el.insertBefore(moveVNode.el, oldStartVNode.el)
                oldChildren[moveIndex] = undefined
                patchVNode(moveVNode, newStartVNode) // 对比属性和子节点
            } else {
                el.insertBefore(createElem(newStartVNode), oldStartVNode.el)
            }
            newStartVNode = newChildren[++newStartIndex]
        }


    }

    if (newStartIndex <= newEndIndex) {
        for (let i = newStartIndex; i <= newEndIndex; ++i) {
            let childEl = createElem(newChildren[i])
            // 这里可能是向后追加的,也有可能是向前追加的
            let anchor = newChildren[newEndIndex + 1] ? newChildren[newEndIndex + 1].el : null
            el.appendChild(childEl, anchor)
        }
    }

    if (oldStartIndex <= oldEndIndex) {
        for (let i = oldStartIndex; i <= oldEndIndex; ++i) {
            if (!oldChildren[i]) {
                let childEl = oldChildren[i].el
                el.removeChild(childEl)
            }
        }
    }
}

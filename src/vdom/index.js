
const isReservedTag = (tag) => {
    return ['a', 'div', 'span', 'p', 'li', 'ul', 'button'].includes(tag)
}

export function createElementVNode(vm, tag, data, ...children) {
    if (data == null) {
        data = {}
    }
    let key = data.key
    if (key) {
        delete data.key
    }
    if (isReservedTag(tag)) {
        return vnode(vm, tag, key, data, children)
    } else {
        // 组件的tag, 创建一个组件的虚拟节点
        let ctor = vm.$options.components[tag]
        return createComponentVNode(vm, tag, key, data, children, ctor)

    }

}

function createComponentVNode(vm, tag, key, data, children, ctor) {
    if (typeof ctor === 'object') {
        ctor = vm.$options._base.extend(ctor)
    }
    data.hook = {
        init(vnode) {
            let inst = vnode.componentInstance = new vnode.componentOptions.ctor
            inst.$mount()
        }
    }
    return vnode(vm, tag, key, data, children, null, { ctor })
}

export function createTextVNode(vm, text) {
    return vnode(vm, undefined, undefined, undefined, undefined, text)
}

function vnode(vm, tag, key, data, children, text, componentOptions) {
    return {
        vm,
        tag,
        key,
        data,
        children,
        text,
        componentOptions
    }
}
import Watcher from "./observe/watcher";
import { createElementVNode, createTextVNode } from "./vdom/index"



function createElem(vnode) {
    let { tag, data, children, text } = vnode
    if (typeof tag === 'string') {
        vnode.el = document.createElement(tag)
        patchProps(vnode.el, data)
        children.forEach(child => {
            vnode.el.appendChild(createElem(child))
        });
    } else {
        vnode.el = document.createTextNode(text)
    }
    return vnode.el
}

function patchProps(el, props) {
    for (let key in props) {
        if (key === 'style') {
            // style需要特殊处理
            for (let styleName in props.style) {
                el.style[styleName] = props.style[styleName]
            }
        } else {
            el.setAttribute(key, props[key])
        }
    }
}

function patch(oldVNode, vnode) {
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
    }
}
export function InitLifeCircle(Vue) {
    Vue.prototype._update = function (vnode) {
        const vm = this
        const el = vm.$el
        console.log('update', vnode, el)
        // patch既有初始化功能又有更新功能
        vm.$el = patch(el, vnode)
    }
    Vue.prototype._render = function () {
        const vm = this
        return vm.$options.render.call(vm)
    }
    Vue.prototype._c = function () {
        return createElementVNode(this, ...arguments)
    }
    Vue.prototype._v = function () {
        return createTextVNode(this, ...arguments)
    }
    Vue.prototype._s = function (value) {
        if (typeof value !== 'object') {
            return value
        }
        return JSON.stringify(value)
    }
}
export function mountComponent(vm, el) {
    vm.$el = el
    const updateComponent = () => {
        vm._update(vm._render())
    }
    // 一个组件对应一个watcher
    new Watcher(vm, updateComponent, true)
}
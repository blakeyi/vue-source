import Watcher from "./observe/watcher";
import { createElementVNode, createTextVNode } from "./vdom/index"
import { patch } from "./vdom/patch";


export function InitLifeCircle(Vue) {
    Vue.prototype._update = function (vnode) {
        const vm = this
        const el = vm.$el
        console.log('update', vnode, el)
        // patch既有初始化功能又有更新功能

        const preVNode = vm._vnode
        vm._vnode = vnode
        if (preVNode) {
            vm.$el = patch(preVNode, vnode, vm)
        } else {
            vm.$el = patch(el, vnode, vm)
        }

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

export function callHook(vm, hook) {
    const handler = vm.$options[hook]
    if (handler) {
        handler.forEach(handler => handler.call(vm))
    }
}
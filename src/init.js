import { compileToFunction } from "./compiler/index"
import { callHook, mountComponent } from "./lifecircle"
import { nextTick } from "./observe/watcher"
import { initState } from "./state"
import { mergeOptions } from "./utils"


export function InitMixin(Vue) {
    Vue.prototype._init = function (options) {
        // 初始化数据
        const vm = this
        console.log(this)
        debugger
        vm.$options = mergeOptions(vm.constructor.options, options)
        vm.$options = options
        console.log(vm.$options)
        callHook(vm, 'beforeCreate')
        initState(vm)
        callHook(vm, 'created')
        if (options.el) {
            vm.$mount(options.el)
        }
    }
    Vue.prototype.$mount = function (el) {
        const vm = this
        el = document.querySelector(el)
        let ops = vm.$options
        // 先判断有没有render函数
        if (!ops.render) {
            let template;
            if (!ops.template && el) {
                template = el.outerHTML
            } else {
                if (el) {
                    template = ops.template
                }
            }
            if (template) {
                const render = compileToFunction(template)
                ops.render = render
            }
        }
        mountComponent(vm, el)
    }

    Vue.prototype.$nextTick = nextTick
}
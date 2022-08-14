import { compileToFunction } from "./compiler/parse"
import { initState } from "./state"

export function InitMixin(Vue) {
    Vue.prototype._init = function(options){
        // 初始化数据
        console.log(options)
        const vm = this
        vm.$options = options
        initState(vm)
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
        ops.render;
    }
}
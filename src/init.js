import { initState } from "./state"

export function InitMixin(Vue) {
    Vue.prototype._init = function(options){
        // 初始化数据
        console.log(options)
        const vm = this
        vm.$options = options
        initState(vm)
    }
}
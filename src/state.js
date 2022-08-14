import { compileToFunction } from "./compiler/parse"
import { observe } from "./observe/index"

export function initState(vm) {
    const opts = vm.$options
    if (opts.data) {
        initData(vm)
    }
}


function proxy(vm, target, key) {
    Object.defineProperty(vm, key, {
        get() {
            return vm[target][key]
        },
        set(newVal) {
            vm[target][key] = newVal
        }
    })
}

function initData(vm) {
    let data = vm.$options.data
    data = typeof data === 'function' ? data.call(vm) : data
    vm._data = data
    observe(data)
    
    // 重新代理_data, 把data的属性全部代理到vm上
    for (let key in data) {
        proxy(vm, "_data", key)
    }

}
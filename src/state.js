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

// 初始化data部分
function initData(vm) {
    let data = vm.$options.data
    // 如果data是函数则先执行获得返回值
    data = typeof data === 'function' ? data.call(vm) : data
    vm._data = data

    // 使用观察者模式包装data
    observe(data)

    // 重新代理_data, 把data的属性全部代理到vm上
    for (let key in data) {
        proxy(vm, "_data", key)
    }

}
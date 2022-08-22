import { newArrayProto } from "./array"
import Dep from "./dep"

class Observer {
    constructor(data) {
        // 如果是数组,需要重写原型,用于拦截其内置方法
        if (Array.isArray(data)) {
            data.__ob__ = this
            data.__proto__ = newArrayProto // 使用重写后的原型
        } else {
            this.walk(data)
        }

    }
    walk(data) {
        Object.keys(data).forEach(key => defineReactive(data, key, data[key]))
    }
    observeArray(arr) {
        arr.forEach(elem => observe(elem))
    }
}

export function defineReactive(target, key, value) {
    observe(value)
    let dep = new Dep() // 每个属性都对应一个
    Object.defineProperty(target, key, {
        get() {
            if (Dep.target) {
                dep.depend() //get时更新依赖
            }
            return value
        },
        set(newVal) {
            if (newVal === value) {
                return
            }
            // 如果是对象的话需要重新代理
            observe(newVal)
            value = newVal
            dep.notify() // set时通知更新
        }
    })
}

export function observe(data) {
    if (typeof data !== 'object' || data === null) {
        return
    }
    return new Observer(data)
}
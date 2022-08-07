import { newArrayProto } from "./array"

class Observer {
    constructor(data) {
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
    observeArray (arr) {
        arr.forEach(elem => observe(elem))
    }
}

export function defineReactive(target, key, value) {
    observe(value)
    Object.defineProperty(target, key, {
        get(){
            console.log('get')
            return value
        },
        set(newVal) {
            console.log(`set value,  old is: ${value}, new is: ${newVal}`)
            if (newVal = value) {
                return
            }
            // 如果是对象的话需要重新代理
            observe(newVal)
            value = newVal
        }
    })
}

export function observe (data) {
    if (typeof data !== 'object' || data === null) {
        return
    }
    return new Observer(data)
}
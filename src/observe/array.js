let oldArrayProto = Array.prototype


export let newArrayProto = Object.create(oldArrayProto)

// 会改变原数组的方法
let methods = [
    'push',
    'pop',
    'shift',
    'unshift',
    'reverse',
    'sort',
    'splice'
]

methods.forEach(method => {
    newArrayProto[method] = function(...args) {
        const result = oldArrayProto[method].call(this, ...args)
        const ob = this.__ob__
        let inserts
        switch (method) {
            case 'push':
            case 'unshift':
                inserts = args
                break
            case 'splice':
                inserts = args.splice(2)
                break
            default:
                break
        }
        if (inserts) {
            ob.observeArray(inserts)
        }
        return result
    }
})


import Dep from "./dep"

let id = 0

// 每个属性有一个dep, 存储了对应的watcher, 属性变化了会遍历了其对应的所有观察者进行更新
class Watcher {
    constructor(vm, fn, options) {
        this.id = id++
        this.getter = fn
        this.renderWatcher = options
        this.deps = []
        this.depsID = new Set()
        this.get()
    }

    get() {
        Dep.target = this
        this.getter()
        Dep.target = null
    }

    addDep(dep) {
        let id = dep.id
        if (!this.depsID.has(id)) {
            this.deps.push(dep)
            this.depsID.add(id)
            dep.addSub(this)
        }
    }

    update() {
        this.get()
    }
}

export default Watcher
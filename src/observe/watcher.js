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
        queueWatcher(this)
    }

    run() {
        this.get()
    }
}

let queue = []
let has = {}
let pending = false

function flushSchedulerQueue() {
    let flushQueue = queue.slice(0)
    queue = []
    has = {}
    pending = false
    flushQueue.forEach(q => q.run())
}

function queueWatcher(watcher) {
    const id = watcher.id
    if (!has[id]) {
        queue.push(watcher)
        has[id] = true
        if (!pending) {
            setTimeout(flushSchedulerQueue, 0)
            pending = true
        }
    }
}

let callbacks = []
let waiting = false
function flushCallbacks() {
    let cbs = callbacks.slice(0)
    waiting = false
    callbacks = []
    cbs.forEach(cb => cb())
}

let timeFunc;
if (Promise) {
    timeFunc = () => {
        Promise.resolve().then(flushCallbacks)
    }
} else if (MutationObserver) {
    let observer = new MutationObserver(flushCallbacks)
    let textNode = document.createTextNode(1)
    observer.observe(textNode, {
        characterData: true
    })
    timeFunc = () => {
        textNode.textContent = 2
    }
} else if (setImmediate) {
    timeFunc = () => {
        setImmediate(flushCallbacks)
    }
} else {
    timeFunc = () => {
        setTimeout(flushCallbacks)
    }
}

export function nextTick(cb) {
    callbacks.push(cb)
    if (!waiting) {
        timeFunc()
        waiting = true
    }
}

export default Watcher
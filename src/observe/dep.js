let id = 0

// id相当于全局静态变量, 不过只在当前文件生效
// 每次new Dep的时候都会取新的id值
class Dep {
    constructor() {
        this.id = id++
        this.subs = [] // 存放当前属性对应的watcher
    }
    depend() {
        Dep.target.addDep(this)
    }

    addSub(watcher) {
        this.subs.push(watcher)
    }

    notify() {
        this.subs.forEach(watcher => {
            watcher.update()
        })
    }
}

Dep.target = null

export default Dep
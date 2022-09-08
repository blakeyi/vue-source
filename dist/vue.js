(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

    const ASSETS_TYPE = ["component", "directive", "filter"];

    function initAssetRegisters(Vue) {
        ASSETS_TYPE.forEach((type) => {
            Vue[type] = function (id, definition) {
                if (type === "component") {
                    // Vue.component(id,definition)就是调用 Vue.extend(definition)，并配置Vue.options.components.id = definition
                    definition = this.options._base.extend(definition);
                }

                // 配置Vue.options[components/filters/directive]
                this.options[type + "s"][id] = definition;
            };
        });
    }

    const strategie = {};
    const LIFECIRCLE = [
        'beforeCreate',
        'created'
    ];
    LIFECIRCLE.forEach(hook => {
        strategie[hook] = function (parent, child) {
            if (child) {
                if (parent) {
                    return parent.concate(child)
                } else {
                    return [child]
                }
            }
            return parent
        };
    });

    function mergeOptions(parent, child) {
        for (let key in parent) {
            mergeField(key);
        }
        for (let key in child) {
            if (!parent.hasOwnProperty(key)) {
                mergeField(key);
            }
        }

        function mergeField(key) {
            if (strategie[key]) {
                strategie[key](parent[key], child[key]);
            } else {
                child[key] || parent[key]; // 优先用儿子的
            }
        }
    }

    function initMixin(Vue) {
        Vue.mixin = function (mixin) {
            // this 指向 VUe，this.options即Vue.options
            // 将mixin合并到Vue.options中，而组件会和Vue.options合并，所以最后会把mixin合并到组件中
            this.options = mergeOptions(this.options, mixin);
            return this;
        };
    }

    function InitGlobalAPI(Vue) {
        // 静态方法
        Vue.options = {};
        initMixin(Vue);
        ASSETS_TYPE.forEach(type => {
            Vue.options[type + "s"] = {};
        });
        Vue.options._base = Vue;
        initAssetRegisters(Vue);
    }

    const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; //匹配标签名；形如 abc-123
    const qnameCapture = `((?:${ncname}\\:)?${ncname})`; //匹配特殊标签;形如 abc:234,前面的abc:可有可无；获取标签名；
    const startTagOpen = new RegExp(`^<${qnameCapture}`); // 匹配标签开头；形如  <  ；捕获里面的标签名
    const startTagClose = /^\s*(\/?)>/; // 匹配标签结尾，形如 >、/>
    const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配结束标签 如 </abc-123> 捕获里面的标签名
    const attribute =
      /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // 匹配属性  形如 id="app"


    // 主要思路:
    // 通过正则进行匹配开始,结束标签和属性内容以及文字内容,递归获取,构造成一棵树,树的结构如下
    // {
    //     tag,
    //     type:ELEMENT_TYPE,
    //     children:[],
    //     attrs,
    //     parent:null
    // }

    // vue3采用的不是正则
    // 对模板进行编译处理

    function parseHTML(html) {
        const ELEMENT_TYPE = 1;
        const TEXT_TYPE = 3;
        const stack = [];
        let currentParent;
        let root;
        function createASTElement(tag, attrs) {
            return {
                tag,
                type:ELEMENT_TYPE,
                children:[],
                attrs,
                parent:null
            }
        }
        function start (tag, attrs) {
           let node = createASTElement(tag, attrs);
           if ( !root ) {
               root = node;
           }
           if (currentParent) {
               node.parent = currentParent;
               currentParent.children.push(node);
           }
           stack.push(node);
           currentParent = node;
        }

        function chars (text) {
            text = text.replace(/\s/g, "");
            text && currentParent.children.push({
                type: TEXT_TYPE,
                text
            });
        }
        function end (tag) {
           stack.pop();
           currentParent = stack[stack.length - 1];
        }
        function advance(n) {
            html = html.substring(n);
        }
        function parseStartTag() {
            const start = html.match(startTagOpen);
            if (start) {
                const match = {
                    tagName:start[1],
                    attrs:[]
                };
                advance(start[0].length);
                 // 如果不是开始标签的结束,就一直匹配下去
                let attr, end;
                while(!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
                    advance(attr[0].length);
                    match.attrs.push({
                        name:attr[1],
                        value:attr[3] || attr[4] || attr[5] || true
                    });
                }
                if (end) {
                    advance(end[0].length);
                }
                return match
            }
            return false
        }
        while(html) {
            let textEnd = html.indexOf('<');
            if (textEnd === 0) {
                const startTagMatch = parseStartTag();
                if (startTagMatch) {
                    start(startTagMatch.tagName, startTagMatch.attrs);
                    continue
                }
                let endTagMatch = html.match(endTag);
                if (endTagMatch) {
                    advance(endTagMatch[0].length);
                    end(endTagMatch[1]);
                    continue
                }
            }
            if (textEnd > 0) {
                let text = html.substring(0, textEnd);
                if (text) {
                    chars(text);
                    advance(text.length);
                }
            }
        }
        return root
    }

    const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;

    function genProps(attrs) {
        let str = '';
        for (let i = 0; i < attrs.length; i++) {
            const attr = attrs[i];
            if (attr.name === 'style') {
                let obj = {};
                attr.value.split(';').forEach(item => {
                    let [key, value] = item.split(':');
                    obj[key] = value;
                });
                attr.value = obj;
            }
            str += `${attr.name}:${JSON.stringify(attr.value)},`;

        }
        return `{${str.slice(0, -1)}}` // 删除结尾的逗号
    }

    function gen(node) {
        if (node.type === 1) {
            return codeGen(node)
        } else {
            // 如果只包含文本的话
            let text = node.text;
            if (!defaultTagRE.test(text)) {
                return `_v(${JSON.stringify(text)})`
            } else {
                let tokens = [];
                let match;
                defaultTagRE.lastIndex = 0; //需要重新置零,因为是全局的
                let lastIndex = 0;
                while (match = defaultTagRE.exec(text)) {
                    let index = match.index;
                    if (index > lastIndex) {
                        // 把中间的文字也加进去
                        tokens.push(JSON.stringify(text.slice(lastIndex, index)));
                    }
                    tokens.push(`_s(${match[1].trim()})`);
                    lastIndex = index + match[0].length;
                }
                if (lastIndex < text.length) {
                    tokens.push(JSON.stringify(text.slice(lastIndex)));
                }
                return `_v(${tokens.join('+')})`
            }
        }
    }

    function genChildren(children) {
        return children.map(child => gen(child)).join(',')
    }

    function codeGen(ast) {
        let children = genChildren(ast.children);
        let code = (`_c('${ast.tag}',${ast.attrs.length > 0 ? genProps(ast.attrs) : 'null'}
    ${ast.children.length ? `,${children}` : ''})`);
        return code
    }

    function compileToFunction(template) {
        // 1. 将template转换为ast语法树
        let ast = parseHTML(template);
        // 2. 生成render方法,(返回虚拟dom)
        // js模板引擎的实现原理都是 with + new function
        let code = codeGen(ast);
        code = `with(this){return ${code}}`;
        let render = new Function(code);
        console.log(render);
        return render
    }

    let id$1 = 0;

    class Dep {
        constructor() {
            this.id = id$1++;
            this.subs = []; // 存放当前属性对应的watcher
        }
        depend() {
            Dep.target.addDep(this);
        }

        addSub(watcher) {
            this.subs.push(watcher);
        }

        notify() {
            this.subs.forEach(watcher => {
                watcher.update();
            });
        }
    }

    Dep.target = null;

    let id = 0;

    // 每个属性有一个dep, 存储了对应的watcher, 属性变化了会遍历了其对应的所有观察者进行更新
    class Watcher {
        constructor(vm, fn, options) {
            this.id = id++;
            this.getter = fn;
            this.renderWatcher = options;
            this.deps = [];
            this.depsID = new Set();
            this.get();
        }

        get() {
            Dep.target = this;
            this.getter();
            Dep.target = null;
        }

        addDep(dep) {
            let id = dep.id;
            if (!this.depsID.has(id)) {
                this.deps.push(dep);
                this.depsID.add(id);
                dep.addSub(this);
            }
        }

        update() {
            queueWatcher(this);
        }

        run() {
            this.get();
        }
    }

    let queue = [];
    let has = {};
    let pending = false;

    function flushSchedulerQueue() {
        let flushQueue = queue.slice(0);
        queue = [];
        has = {};
        pending = false;
        flushQueue.forEach(q => q.run());
    }

    function queueWatcher(watcher) {
        const id = watcher.id;
        if (!has[id]) {
            queue.push(watcher);
            has[id] = true;
            if (!pending) {
                setTimeout(flushSchedulerQueue, 0);
                pending = true;
            }
        }
    }

    let callbacks = [];
    let waiting = false;
    function flushCallbacks() {
        let cbs = callbacks.slice(0);
        waiting = false;
        callbacks = [];
        cbs.forEach(cb => cb());
    }

    let timeFunc;
    if (Promise) {
        timeFunc = () => {
            Promise.resolve().then(flushCallbacks);
        };
    } else if (MutationObserver) {
        let observer = new MutationObserver(flushCallbacks);
        let textNode = document.createTextNode(1);
        observer.observe(textNode, {
            characterData: true
        });
        timeFunc = () => {
            textNode.textContent = 2;
        };
    } else if (setImmediate) {
        timeFunc = () => {
            setImmediate(flushCallbacks);
        };
    } else {
        timeFunc = () => {
            setTimeout(flushCallbacks);
        };
    }

    function nextTick(cb) {
        callbacks.push(cb);
        if (!waiting) {
            timeFunc();
            waiting = true;
        }
    }

    function createElementVNode(vm, tag, data, ...children) {
        if (data == null) {
            data = {};
        }
        let key = data.key;
        if (key) {
            delete data.key;
        }
        return vnode(vm, tag, key, data, children)
    }

    function createTextVNode(vm, text) {
        return vnode(vm, undefined, undefined, undefined, undefined, text)
    }

    function vnode(vm, tag, key, data, children, text) {
        return {
            vm,
            tag,
            key,
            data,
            children,
            text
        }
    }

    function createElem(vnode) {
        let { tag, data, children, text } = vnode;
        if (typeof tag === 'string') {
            vnode.el = document.createElement(tag);
            patchProps(vnode.el, data);
            children.forEach(child => {
                vnode.el.appendChild(createElem(child));
            });
        } else {
            vnode.el = document.createTextNode(text);
        }
        return vnode.el
    }

    function patchProps(el, props) {
        for (let key in props) {
            if (key === 'style') {
                // style需要特殊处理
                for (let styleName in props.style) {
                    el.style[styleName] = props.style[styleName];
                }
            } else {
                el.setAttribute(key, props[key]);
            }
        }
    }

    function patch(oldVNode, vnode) {
        const isRealElem = oldVNode.nodeType;
        if (isRealElem) {
            // 初次渲染
            const elem = oldVNode;
            const parentElem = elem.parentNode;
            let newElem = createElem(vnode);
            parentElem.insertBefore(newElem, elem.nextSibling);
            parentElem.removeChild(elem);
            return newElem
        }
    }
    function InitLifeCircle(Vue) {
        Vue.prototype._update = function (vnode) {
            const vm = this;
            const el = vm.$el;
            console.log('update', vnode, el);
            // patch既有初始化功能又有更新功能
            vm.$el = patch(el, vnode);
        };
        Vue.prototype._render = function () {
            const vm = this;
            return vm.$options.render.call(vm)
        };
        Vue.prototype._c = function () {
            return createElementVNode(this, ...arguments)
        };
        Vue.prototype._v = function () {
            return createTextVNode(this, ...arguments)
        };
        Vue.prototype._s = function (value) {
            if (typeof value !== 'object') {
                return value
            }
            return JSON.stringify(value)
        };
    }
    function mountComponent(vm, el) {
        vm.$el = el;
        const updateComponent = () => {
            vm._update(vm._render());
        };
        // 一个组件对应一个watcher
        new Watcher(vm, updateComponent, true);
    }

    function callHook(vm, hook) {
        const handler = vm.$options[hook];
        if (handler) {
            handler.forEach(handler => handler.call(vm));
        }
    }

    let oldArrayProto = Array.prototype;


    let newArrayProto = Object.create(oldArrayProto);

    // 会改变原数组的方法
    let methods = [
        'push',
        'pop',
        'shift',
        'unshift',
        'reverse',
        'sort',
        'splice'
    ];

    methods.forEach(method => {
        newArrayProto[method] = function(...args) {
            const result = oldArrayProto[method].call(this, ...args);
            const ob = this.__ob__;
            let inserts;
            switch (method) {
                case 'push':
                case 'unshift':
                    inserts = args;
                    break
                case 'splice':
                    inserts = args.splice(2);
                    break
            }
            if (inserts) {
                ob.observeArray(inserts);
            }
            return result
        };
    });

    class Observer {
        constructor(data) {
            // 如果是数组,需要重写原型,用于拦截其内置方法
            if (Array.isArray(data)) {
                data.__ob__ = this;
                data.__proto__ = newArrayProto; // 使用重写后的原型
            } else {
                this.walk(data);
            }

        }
        walk(data) {
            Object.keys(data).forEach(key => defineReactive(data, key, data[key]));
        }
        observeArray(arr) {
            arr.forEach(elem => observe(elem));
        }
    }

    function defineReactive(target, key, value) {
        observe(value);
        let dep = new Dep(); // 每个属性都对应一个
        Object.defineProperty(target, key, {
            get() {
                if (Dep.target) {
                    dep.depend(); //get时更新依赖
                }
                return value
            },
            set(newVal) {
                if (newVal === value) {
                    return
                }
                // 如果是对象的话需要重新代理
                observe(newVal);
                value = newVal;
                dep.notify(); // set时通知更新
            }
        });
    }

    function observe(data) {
        if (typeof data !== 'object' || data === null) {
            return
        }
        return new Observer(data)
    }

    function initState(vm) {
        const opts = vm.$options;
        if (opts.data) {
            initData(vm);
        }
    }


    function proxy(vm, target, key) {
        Object.defineProperty(vm, key, {
            get() {
                return vm[target][key]
            },
            set(newVal) {
                vm[target][key] = newVal;
            }
        });
    }

    function initData(vm) {
        let data = vm.$options.data;
        data = typeof data === 'function' ? data.call(vm) : data;
        vm._data = data;
        observe(data);
        
        // 重新代理_data, 把data的属性全部代理到vm上
        for (let key in data) {
            proxy(vm, "_data", key);
        }

    }

    function InitMixin(Vue) {
        Vue.prototype._init = function (options) {
            // 初始化数据
            const vm = this;
            console.log(this);
            debugger
            vm.$options = mergeOptions(vm.constructor.options, options);
            vm.$options = options;
            console.log(vm.$options);
            callHook(vm, 'beforeCreate');
            initState(vm);
            callHook(vm, 'created');
            if (options.el) {
                vm.$mount(options.el);
            }
        };
        Vue.prototype.$mount = function (el) {
            const vm = this;
            el = document.querySelector(el);
            let ops = vm.$options;
            // 先判断有没有render函数
            if (!ops.render) {
                let template;
                if (!ops.template && el) {
                    template = el.outerHTML;
                } else {
                    if (el) {
                        template = ops.template;
                    }
                }
                if (template) {
                    const render = compileToFunction(template);
                    ops.render = render;
                }
            }
            mountComponent(vm, el);
        };

        Vue.prototype.$nextTick = nextTick;
    }

    function Vue(options) {
        console.log(this);
        debugger
        this._init(options);
    }
    InitMixin(Vue);
    InitLifeCircle(Vue);
    InitGlobalAPI(Vue);

    return Vue;

}));
//# sourceMappingURL=vue.js.map

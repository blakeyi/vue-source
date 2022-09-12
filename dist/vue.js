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
                    return parent.concat(child)
                } else {
                    return [child]
                }
            }
            return parent
        };
    });

    strategie.components = function (parentVal, childVal) {
        const res = Object.create(parentVal);
        if (childVal) {
            for (let key in childVal) {
                res[key] = childVal[key];
            }
        }

        return res
    };

    function mergeOptions(parent, child) {
        const options = [];
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
                options[key] = strategie[key](parent[key], child[key]);
            } else {
                options[key] = child[key] || parent[key]; // 优先用儿子的
            }
        }

        return options
    }

    function initExtend(Vue) {
        Vue.extend = function (options) {
            function Sub(options = {}) {
                this._init(options);
            }
            Sub.prototype = Object.create(Vue.prototype);
            Sub.prototype.constructor = Sub;
            Sub.options = mergeOptions(Vue.options, options);
            return Sub
        };
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

        initExtend(Vue);
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

    // id相当于全局静态变量, 不过只在当前文件生效
    // 每次new Dep的时候都会取新的id值
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

    const isReservedTag = (tag) => {
        return ['a', 'div', 'span', 'p', 'li', 'ul', 'button'].includes(tag)
    };

    function createElementVNode(vm, tag, data, ...children) {
        if (data == null) {
            data = {};
        }
        let key = data.key;
        if (key) {
            delete data.key;
        }
        if (isReservedTag(tag)) {
            return vnode(vm, tag, key, data, children)
        } else {
            // 组件的tag, 创建一个组件的虚拟节点
            let ctor = vm.$options.components[tag];
            return createComponentVNode(vm, tag, key, data, children, ctor)

        }

    }

    function createComponentVNode(vm, tag, key, data, children, ctor) {
        if (typeof ctor === 'object') {
            ctor = vm.$options._base.extend(ctor);
        }
        data.hook = {
            init(vnode) {
                let inst = vnode.componentInstance = new vnode.componentOptions.ctor;
                inst.$mount();
            }
        };
        return vnode(vm, tag, key, data, children, null, { ctor })
    }

    function createTextVNode(vm, text) {
        return vnode(vm, undefined, undefined, undefined, undefined, text)
    }

    function vnode(vm, tag, key, data, children, text, componentOptions) {
        return {
            vm,
            tag,
            key,
            data,
            children,
            text,
            componentOptions
        }
    }

    function patch(oldVNode, vnode, vm) {
        if (!oldVNode) {
            // 组件的渲染
            return createElem(vnode);
        }

        const isRealElem = oldVNode.nodeType;
        if (isRealElem) {
            // 初次渲染
            const elem = oldVNode;
            const parentElem = elem.parentNode;
            let newElem = createElem(vnode);
            parentElem.insertBefore(newElem, elem.nextSibling);
            parentElem.removeChild(elem);
            return newElem
        } else {
            // diff算法
            return patchVNode(oldVNode, vnode)
        }
    }


    function createComponent(vnode) {
        let i = vnode.data;
        if ((i = i.hook) && (i = i.init)) {
            i(vnode);
        }
        if (vnode.componentInstance) {
            return true
        }
        return false
    }

    function createElem(vnode) {
        let { tag, data, key, children, text } = vnode;
        if (typeof tag === 'string') {

            if (createComponent(vnode)) {
                return vnode.componentInstance.$el
            }

            vnode.el = document.createElement(tag);
            updateProperties(vnode);
            children.forEach(child => {
                vnode.el.appendChild(createElem(child));
            });
        } else {
            vnode.el = document.createTextNode(text);
        }
        return vnode.el
    }

    // 解析vnode的data属性，映射到真实dom上
    function updateProperties(vnode, oldProps = {}) {
        const newProps = vnode.data || {};
        const el = vnode.el; // 真实节点

        // 如果新的节点没有 需要把老的节点属性移除
        for (const k in oldProps) {
            if (!newProps[k]) {
                el.removeAttribute(k);
            }
        }

        // 对style样式做特殊处理 如果新的没有 需要把老的style值置为空
        const newStyle = newProps.style || {};
        const oldStyle = oldProps.style || {};
        for (const key in oldStyle) {
            if (!newStyle[key]) {
                el.style[key] = "";
            }
        }

        // 遍历新的属性 进行增加操作
        for (const key in newProps) {
            if (key === "style") {
                for (const styleName in newProps.style) {
                    el.style[styleName] = newProps.style[styleName];
                }
            } else if (key === "class") {
                el.className = newProps.class;
            } else {
                // 给这个元素添加属性 值就是对应的值
                el.setAttribute(key, newProps[key]);
            }
        }
    }

    function isSameVNode(oldVNode, newVNode) {
        return oldVNode.tag === newVNode.tag && oldVNode.key === newVNode.key
    }

    function patchVNode(oldVNode, newVNode) {
        if (!isSameVNode(oldVNode, newVNode)) {
            // 用节点的父亲进行替换
            let el = createElem(newVNode);
            oldVNode.el.parentNode.replaceChild(el, oldVNode.el);
            return el
        }

        // 文本情况, 直接对比内容
        let el = newVNode.el = oldVNode.el;
        if (!oldVNode.tag) { // 文本没有tag
            if (oldVNode.text !== newVNode.text) {
                el.textContent = newVNode.text;
            }
            return el
        }

        // 是标签的话, 需要对比标签的属性
        updateProperties(newVNode, oldVNode.data);

        // 然后比较儿子节点

        let oldChildren = oldVNode.children || [];
        let newChildren = newVNode.children || [];

        if (oldChildren.length > 0 && newChildren.length > 0) {
            // 都有儿子节点
            updateChildren(el, oldChildren, newChildren);
        } else if (newChildren.length > 0) {
            mountChildren(el, newChildren);
        } else if (oldChildren.length > 0) {
            mountChildren(el, oldChildren);
        }

        return el
    }

    function mountChildren(el, newChildren) {
        for (let i = 0; i < newChildren.length; i++) {
            newChildren[i];
            el.innerHTML = '';

        }
    }

    function updateChildren(el, oldChildren, newChildren) {
        // 总体上采用双指针, 宗旨是尽量复用原来dom上的节点
        let oldStartIndex = 0;
        let newStartIndex = 0;
        let oldEndIndex = oldChildren.length - 1;
        let newEndIndex = newChildren.length - 1;

        let oldStartVNode = oldChildren[0];
        let newStartVNode = newChildren[0];

        let oldEndVNode = oldChildren[oldEndIndex];
        let newEndVNode = newChildren[newEndIndex];

        function makeIndexByKey(children) {
            let map = {};
            children.forEach((child, index) => {
                map[child.key] = index;
            });
            return map
        }

        let map = makeIndexByKey(oldChildren);

        while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
            // 双方有一方头指针大于尾指针就停止循环
            if (!oldStartVNode) {
                oldStartVNode = oldChildren[++oldStartIndex];
            } else if (!oldEndVNode) {
                oldEndVNode = oldChildren[--oldEndIndex];
            } else if (isSameVNode(oldStartVNode, newStartVNode)) {
                // 如果是相同节点,则递归检查其孩子节点
                patchVNode(oldStartVNode, newStartVNode);
                oldStartVNode = oldChildren[++oldStartIndex];
                newStartVNode = newStartVNode[++newStartIndex];
                // 比较开头节点
            } else if (isSameVNode(oldEndVNode, newEndVNode)) {
                patchVNode(oldEndVNode, newEndVNode);
                oldEndVNode = oldChildren[--oldEndIndex];
                newStartVNode = newChildren[--newEndIndex];
            } else if (isSameVNode(oldEndVNode, newStartVNode)) {
                // 头尾开始对比
                patchVNode(oldEndVNode, newStartVNode);
                // 将老的尾结点插入到最前面
                el.insertBefore(oldEndVNode.el, oldStartVNode.el);
                oldEndVNode = oldChildren[--oldEndIndex];
                newStartVNode = newChildren[++newStartIndex];
            } else if (isSameVNode(oldStartVNode, newEndVNode)) {
                // 头尾开始对比
                patchVNode(oldStartVNode, newEndVNode);
                // 将老的尾结点插入到最前面
                el.insertBefore(oldStartVNode.el, oldEndVNode.el.nextSibling);
                oldStartVNode = oldChildren[++oldStartIndex];
                newEndVNode = newChildren[--newEndIndex];
            } else {
                // 乱序对比,根据老的列表做一个映射, 用新的去找,找到则移动,找不到则添加
                // 最后多余的就删除

                let moveIndex = map[newStartVNode.key];
                if (!moveIndex) {
                    let moveVNode = oldChildren[moveIndex];
                    el.insertBefore(moveVNode.el, oldStartVNode.el);
                    oldChildren[moveIndex] = undefined;
                    patchVNode(moveVNode, newStartVNode); // 对比属性和子节点
                } else {
                    el.insertBefore(createElem(newStartVNode), oldStartVNode.el);
                }
                newStartVNode = newChildren[++newStartIndex];
            }


        }

        if (newStartIndex <= newEndIndex) {
            for (let i = newStartIndex; i <= newEndIndex; ++i) {
                let childEl = createElem(newChildren[i]);
                // 这里可能是向后追加的,也有可能是向前追加的
                let anchor = newChildren[newEndIndex + 1] ? newChildren[newEndIndex + 1].el : null;
                el.appendChild(childEl, anchor);
            }
        }

        if (oldStartIndex <= oldEndIndex) {
            for (let i = oldStartIndex; i <= oldEndIndex; ++i) {
                if (!oldChildren[i]) {
                    let childEl = oldChildren[i].el;
                    el.removeChild(childEl);
                }
            }
        }
    }

    function InitLifeCircle(Vue) {
        Vue.prototype._update = function (vnode) {
            const vm = this;
            const el = vm.$el;
            console.log('update', vnode, el);
            // patch既有初始化功能又有更新功能

            const preVNode = vm._vnode;
            debugger
            vm._vnode = vnode;
            if (preVNode) {
                vm.$el = patch(preVNode, vnode);
            } else {
                vm.$el = patch(el, vnode);
            }

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


    // 继承原来Array的原型
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
        newArrayProto[method] = function (...args) {
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
        // 如果是对象,继续遍历其属性
        observe(value);
        // 每个属性都对应一个
        let dep = new Dep();
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

    // 初始化data部分
    function initData(vm) {
        let data = vm.$options.data;
        // 如果data是函数则先执行获得返回值
        data = typeof data === 'function' ? data.call(vm) : data;
        vm._data = data;

        // 使用观察者模式包装data
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
            // 这里拿到 vm.constructor其实就是vm.__proto__.constructor 就是 Vue的原始函数
            // 实例的__proto__执行构造函数的原型, 而原型的constructor重新指回构造函数
            vm.$options = mergeOptions(vm.constructor.options, options);
            console.log(vm.$options);
            callHook(vm, 'beforeCreate');
            initState(vm);
            callHook(vm, 'created');
            if (vm.$options.el) {
                vm.$mount(options.el);
            }
        };
        Vue.prototype.$mount = function (el) {
            const vm = this;
            el = document.querySelector(el);
            let ops = vm.$options;
            // 先判断有没有render函数
            if (!ops.render) {
                let template = ops.template;
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
        this._init(options);
    }

    // 主要是挂在一些方法到Vue的显式原型上
    InitMixin(Vue);
    InitLifeCircle(Vue);
    InitGlobalAPI(Vue);

    return Vue;

}));
//# sourceMappingURL=vue.js.map

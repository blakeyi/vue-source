(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

    const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`;
    const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
    const startTagOpen = new RegExp(`^<\\/${qnameCapture}[^>]*>`);
    const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`);
    const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s""=<>`]+)))?/;
    const startTagClose = /^\s*(\/?)>/;


    // vue3采用的不是正则
    // 对模板进行编译处理

    function parseHTML(html) {
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
                    advance(text.length);
                }
            }
        }
        console.log(html);
    }

    function compileToFunction(template) {
        // 1. 将template转换为ast语法树
        parseHTML(template);
        // 2. 生成render方法,(返回虚拟dom)

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
            console.log(method, args);
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
        observeArray (arr) {
            arr.forEach(elem => observe(elem));
        }
    }

    function defineReactive(target, key, value) {
        observe(value);
        Object.defineProperty(target, key, {
            get(){
                console.log('get');
                return value
            },
            set(newVal) {
                console.log(`set value,  old is: ${value}, new is: ${newVal}`);
                if (newVal = value) {
                    return
                }
                // 如果是对象的话需要重新代理
                observe(newVal);
                value = newVal;
            }
        });
    }

    function observe (data) {
        if (typeof data !== 'object' || data === null) {
            return
        }
        return new Observer(data)
    }

    function initState(vm) {
        const opts = vm.$options;
        if (opts.data) {
            initData(vm);
            debugger
            let template = document.getElementById("app").innerHTML;
            compileToFunction(template);
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
        Vue.prototype._init = function(options){
            // 初始化数据
            console.log(options);
            const vm = this;
            vm.$options = options;
            initState(vm);
        };
    }

    function Vue(options) {
        this._init(options);
    }

    InitMixin(Vue);

    return Vue;

}));
//# sourceMappingURL=vue.js.map

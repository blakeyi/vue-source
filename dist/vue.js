(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

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

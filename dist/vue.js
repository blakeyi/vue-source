(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

    function initState(vm) {
        const opts = vm.$options;
        if (opts.data) {
            initData(vm);
        }
    }

    function initData(vm) {
        let data = vm.$options.data;
        data = typeof data === 'function' ? data.call(vm) : data;
        console.log(data);
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

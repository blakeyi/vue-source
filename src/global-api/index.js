import initAssetRegisters from "./asset";
import { ASSETS_TYPE } from "./const"
import initMixin from "./mixin";

export function InitGlobalAPI(Vue) {
    // 静态方法
    Vue.options = {}
    initMixin(Vue);
    ASSETS_TYPE.forEach(type => {
        Vue.options[type + "s"] = {}
    })
    Vue.options._base = Vue;
    initAssetRegisters(Vue)
}
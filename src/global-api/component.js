import { mergeOptions } from "../utils"


export function initExtend(Vue) {
    Vue.extend = function (options) {
        function Sub(options = {}) {
            this._init(options)
        }
        Sub.prototype = Object.create(Vue.prototype)
        Sub.prototype.constructor = Sub
        Sub.options = mergeOptions(Vue.options, options)
        return Sub
    }
}
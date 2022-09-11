import { InitGlobalAPI } from "./global-api/index"
import { InitMixin } from "./init"
import { InitLifeCircle } from "./lifecircle"

function Vue(options) {
    this._init(options)
}

// 主要是挂在一些方法到Vue的显式原型上
InitMixin(Vue)
InitLifeCircle(Vue)
InitGlobalAPI(Vue)


export default Vue
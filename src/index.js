import { InitGlobalAPI } from "./global-api/index"
import { InitMixin } from "./init"
import { InitLifeCircle } from "./lifecircle"
function Vue(options) {
    console.log(this)
    debugger
    this._init(options)
}
InitMixin(Vue)
InitLifeCircle(Vue)
InitGlobalAPI(Vue)

export default Vue
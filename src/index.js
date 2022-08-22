import { InitMixin } from "./init"
import { InitLifeCircle } from "./lifecircle"
function Vue(options) {
    this._init(options)
}
InitMixin(Vue)
InitLifeCircle(Vue)

export default Vue
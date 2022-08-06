import { InitMixin } from "./init"

function Vue(options) {
    this._init(options)
}

InitMixin(Vue)

export default Vue
const strategie = {}
const LIFECIRCLE = [
    'beforeCreate',
    'created'
]
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
    }
})

export function mergeOptions(parent, child) {
    const options = []
    for (let key in parent) {
        mergeField(key)
    }
    for (let key in child) {
        if (!parent.hasOwnProperty(key)) {
            mergeField(key)
        }
    }


    function mergeField(key) {
        if (strategie[key]) {
            options[key] = strategie[key](parent[key], child[key])
        } else {
            options[key] = child[key] || parent[key] // 优先用儿子的
        }
    }

    return options
}
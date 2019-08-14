;(function(global, factory) {
    // UMD 加载方案
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = factory()
        return
    }
    if (typeof define === "function" && define.amd) {
        define(factory)
        return
    }
    global.vueLife = factory()
})(window, function() {
    "use strict"

    var name = "life"
    var hooks = {}

    var hookLifes = []
    var hookEmitData = {}

    function _hookExec(key, that, data) {
        var lifes = that.$options[name] || []
        // console.log("lifes", lifes)
        var lifeFn
        for (var i = 0; i < lifes.length; i += 1) {
            // debugger;
            // console.log(lifes[i])
            lifeFn = lifes[i][key]
            if (lifeFn) {
                lifeFn.call(that, data.data)
            }
        }
    }
    function hookExec(key, that) {
        let data = hookEmitData[key]
        // console.log("1", key, hookEmitData, that, data)
        if (!data) {
            return
        }
        // console.log("2", key, hookEmitData, that)
        if (that) {
            _hookExec(key, that, data)
            return
        }
        // console.log("3", key, hookEmitData, that)
        for (var i = 0; i < hookLifes.length; i += 1) {
            _hookExec(key, hookLifes[i], data)
        }
    }

    function hookEmit(key, data) {
        hookEmitData[key] = {
            data: data
        }
        hookExec(key)
    }

    function install(vue, init) {
        // 初始化函数
        if (typeof init == "function") {
            init = {
                init: init
            }
        }
        var initFn = init.init
        // 设定在什么钩子函数中出发
        var hookDef = init.hookDef || "mounted"
        if (init.hooks) {
            hooks = init.hooks
        }

        // ready 名称
        if (init.lifeName) {
            name = init.lifeName
        }

        function hookExecByVM(that, lifeName) {
            setTimeout(function() {
                var keyOpt = {}
                for (var n in hooks) {
                    if (hooks[n] == lifeName) {
                        keyOpt[n] = true
                    }
                }
                var isDefHook = lifeName == hookDef
                var lifes = that.$options[name] || []
                var life, k, data
                for (var i = 0; i < lifes.length; i += 1) {
                    life = lifes[i]
                    for (k in life) {
                        data = hookEmitData[k]
                        if (data && (keyOpt[k] || isDefHook)) {
                            life[k].call(that, data.data)
                        }
                    }
                }
            }, 0)
        }

        function hooksFn(key) {
            return function() {
                var life = this.$options[name]
                if (life) {
                    hookExecByVM(this, key)
                }
            }
        }
        var mixinOpt = {}
        for (var n in hooks) {
            if (!mixinOpt[hooks[n]]) {
                mixinOpt[hooks[n]] = hooksFn(hooks[n])
            }
        }
        if (!mixinOpt[hookDef]) {
            mixinOpt[hookDef] = hooksFn(hookDef)
        }

        //
        var beforeCreateFn = mixinOpt.beforeCreate
        mixinOpt.beforeCreate = function() {
            var life = this.$options[name]
            // console.log(">>>...", this.$options[name], name)
            if (life) {
                hookLifes.push(this)
            }

            if (beforeCreateFn) {
                beforeCreateFn.call(this)
            }
        }

        // 销毁
        var destroyedFn = mixinOpt.destroyed
        mixinOpt.destroyed = function() {
            if (destroyedFn) {
                destroyedFn.call(this)
            }

            var life = this.$options[name]
            if (life) {
                for (var i = 0; i < hookLifes.length; i += 1) {
                    if (this == hookLifes[i]) {
                        hookLifes.splice(i, 1)
                        break
                    }
                }
            }
        }

        vue.mixin(mixinOpt)
        // console.log("mixinOpt", mixinOpt)
        vue.config.optionMergeStrategies[name] = function(pVal, nVal) {
            var val = pVal instanceof Array ? pVal : pVal ? [pVal] : []
            if (nVal) {
                val.push(nVal)
            }
            // console.log(val)
            return val
        }

        if (initFn) {
            initFn({
                emit: hookEmit,
                vue: vue
            })
        }
    }

    return {
        default: install,
        install: install
    }
})

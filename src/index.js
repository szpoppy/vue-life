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
    var hookDef

    var hookLifes = {}
    var hookEmitData = {}

    var lifeIndexNum = 100
    function addHookLifes(that, vueLifeName) {
        var id = that._life_id_
        if (!id) {
            id = that._life_id_ = "$" + lifeIndexNum++
        }
        var life = hookLifes[id]
        if (!life) {
            life = hookLifes[id] = {
                that: that,
                ready: {}
            }
        }
        life.ready[vueLifeName] = true
        return life
    }

    function _hookExec(key, life, data) {
        var lifes = life.that.$options[name] || []
        var hook = hooks[key] || hookDef
        if (!life.ready[hook]) {
            return
        }
        // console.log("lifes", lifes)
        var lifeFn
        for (var i = 0; i < lifes.length; i += 1) {
            // debugger;
            // console.log(lifes[i])
            lifeFn = lifes[i][key]
            if (lifeFn) {
                lifeFn.call(life.that, data.data)
            }
        }
    }
    function hookExec(key, that) {
        var data = hookEmitData[key]
        // console.log("1", key, hookEmitData, that, data)
        if (!data) {
            return
        }
        // console.log("2", key, hookEmitData, that)
        if (that) {
            _hookExec(key, that, data)
            return
        }
        // var hook = hooks[key] || hookDef
        // console.log("3", key, hookEmitData, that)
        for (var n in hookLifes) {
            _hookExec(key, hookLifes[n], data)
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
        hookDef = init.hookDef || "mounted"
        if (init.hooks) {
            hooks = init.hooks
        }

        // ready 名称
        if (init.lifeName) {
            name = init.lifeName
        }

        var initArgs = init.args || []
        if (Object.prototype.toString.call(initArgs).toLowerCase() != "[object array]") {
            initArgs = [initArgs]
        }

        function hookExecByVM(that, lifeName) {
            // console.log("---", that, lifeName)
            setTimeout(function() {
                var life = addHookLifes(that, lifeName)
                var lifes = that.$options[name] || []
                for (var i = 0, k; i < lifes.length; i += 1) {
                    for (k in lifes[i]) {
                        _hookExec(k, life, hookEmitData[k])
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
        // var beforeCreateFn = mixinOpt.beforeCreate
        // mixinOpt.beforeCreate = function() {
        //     var life = this.$options[name]
        //     console.log(">>>...", this.$options[name], name)
        //     if (life) {
        //         hookLifes.push(this)
        //     }

        //     if (beforeCreateFn) {
        //         beforeCreateFn.call(this)
        //     }
        // }

        // 销毁
        var destroyedFn = mixinOpt.destroyed
        mixinOpt.destroyed = function() {
            if (destroyedFn) {
                destroyedFn.call(this)
            }

            var life = this.$options[name]
            if (life) {
                for (var n in hookLifes) {
                    if (this == hookLifes[n].that) {
                        delete hookLifes[n]
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
            initFn(
                {
                    emit: hookEmit,
                    vue: vue
                },
                ...initArgs
            )
        }
    }

    return {
        default: install,
        install: install
    }
})

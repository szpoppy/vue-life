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

    function getHookLife(that) {
        var id = that._life_id_
        if (!id) {
            id = that._life_id_ = "$" + lifeIndexNum++
        }
        var life = hookLifes[id]
        if (!life) {
            var data = {}
            for (var n in hookEmitData) {
                data[n] = hookEmitData[n]
            }
            life = hookLifes[id] = {
                that: that,
                ready: {},
                data: data
            }
        }
        return life
    }

    function getHookEmitData(key, that) {
        var data = that ? getHookLife(that).data : hookEmitData
        if (key) {
            return data[key]
        }
        return data
    }

    function addHookLifes(that, vueLifeName) {
        var life = getHookLife(that)
        life.ready[vueLifeName] = true
        if (vueLifeName == hookDef && life.callback) {
            // 事件中的then函数
            life.callback()
        }
        return life
    }

    function hookEmit(key, data, that) {
        var hookData = getHookEmitData(null, that)
        hookData[key] = {
            data: data
        }
        if (that) {
            _hookExec(key, getHookLife(that), hookData[key])
            return
        }
        // console.log("hookLifes", hookLifes)
        for (var n in hookLifes) {
            _hookExec(key, hookLifes[n], hookData[key])
        }
    }

    function hookEmitEvent(life, key) {
        return {
            data: life.data[key],
            emit: function(key, value) {
                hookEmit(key, value, life.that)
            },
            then: function(callback) {
                if (life.ready[hookDef]) {
                    callback && callback()
                    return
                }
                life.callback = callback
            }
        }
    }

    function _hookExec(key, life, data) {
        if (!data) {
            return
        }
        var lifes = life.that.$options[name] || []
        var hook = hooks[key] || hookDef
        if (!life.ready[hook]) {
            return
        }
        // console.log(key, "lifes", lifes)
        var lifeFn
        for (var i = 0; i < lifes.length; i += 1) {
            lifeFn = lifes[i][key]
            if (lifeFn) {
                lifeFn.call(life.that, hookEmitEvent(life, key))
            }
        }
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
        // prepose
        hooks = init.hooks || {}
        if (!hooks.prepose) {
            hooks.prepose = "beforeCreate"
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
            var life = addHookLifes(that, lifeName)
            var lifes = that.$options[name] || []
            var readys = {}
            for (var i = 0, k; i < lifes.length; i += 1) {
                for (k in lifes[i]) {
                    if (!readys[k] && hooks[k] == lifeName) {
                        readys[k] = true
                        _hookExec(k, life, getHookEmitData(k, that))
                    }
                }
            }
        }

        function hooksFn(key) {
            return function() {
                // console.log("$$++++", key, hooks)
                var life = this.$options[name]
                if (life) {
                    if (hooks.prepose == key) {
                        // prepose 触发 emit
                        hookEmit("prepose", {}, this)
                    }
                    hookExecByVM(this, key)
                }
            }
        }

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
                    emit: function(key, data) {
                        hookEmit(key, data)
                    },
                    hooks,
                    vue: vue
                },
                ...initArgs
            )
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
    }

    return {
        default: install,
        install: install
    }
})

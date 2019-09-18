# vue-life  

## 更新日志
 * +2019-09-18 增加args餐宿

## Vue自定义生命周期
 - 所有自定义生命周期，都绑定Vue的实际生命周期函数，并确保在实际生命周期之后执行
 - 自定义生命周期函数的运行受限于本身项目中的特定流程。
 - 下面实例

## 示例
````javascript
// 初始化 钩子函数 ready
import VueLife from "vue-life"
Vue.use(VueLife, {
    // 完成回调
    init ({emit, vue}, ...args) {
        // 运行获取完成身份触发的事件
        setTimeout(() => {
            emit("user", {account: "account"})
        }, 500)
        
        setTimeout(() => {
            emit("ready", "app is ready")
        }, 200)
    },
    // 默认绑定的vue本身生命周期函数
    hookDef: "mounted",
    // 设置特定的生命周期函数绑定
    hooks: {
        user: "created"
    },
    // 默认的宽展字段 默认为 life
    lifeName: "life",
    // 运行 init 函数时赋予的额外参数
    args: []
})

````

````javascript
// vue中，实际触发
{
    life: {
        user (user) {
            // 这个生命周期将在 emit("user", {account: "account"}) 和 created 之后来触发生命周期（hooks配置）
            // user 内容为 {account: "account"}
        },
        ready (info) {
            // 这个生命周期将在 emit("ready", "app is ready") 和 mounted 之后来触发生命周期（hookDef配置）
            // user 内容为 "app is ready"
        }
    }
}

````

## 获取安装  
> npm install vue-life

import { VueConstructor } from "vue";
/**
 * 初始化传入参数
 */
interface initObj {
    init: Function;
    hookDef?: string;
    hooks?: object;
    prepose?: string;
    lifeName?: string;
    args?: Array<any> | any;
}
export declare function install(Vue: VueConstructor, init: Function | initObj): void;
export default install;

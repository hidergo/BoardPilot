
import HDL_DRIVER from './hdl_driver';

type APIbuildHDL = (width: number, height: number, data: Array<number>, len: number) => number;
type APIupdateHDL = () => number;
type APIgetScreenBuffer = () => number;



export default class HDLDisplay {

    static driver : { cwrap: Function, HEAP8: Uint8Array } | null = null;

    static buildHDL : APIbuildHDL = (width: number, height: number, data: Array<number>, len: number) => 0;
    static updateHDL : APIupdateHDL = () => 0;
    static getScreenBuffer : APIgetScreenBuffer = () => 0;


    static load () : Promise<void> {
        return new Promise((res, rej) => {
            if(HDLDisplay.driver !== null) {
                res();
                return;
            }

            HDL_DRIVER().then((v) => {
                HDLDisplay.driver = v;
                if(HDLDisplay.driver != null) {
                    HDLDisplay.buildHDL = HDLDisplay.driver.cwrap("buildHDL", "number", ["number", "number", "array", "number"]);
                    HDLDisplay.updateHDL = HDLDisplay.driver.cwrap("updateHDL", "number", []);
                    HDLDisplay.getScreenBuffer = HDLDisplay.driver.cwrap("getScreenBuffer", "number", []);

                }

                res();
            }).catch(e => {
                rej(e);
            })
        })
    }

}
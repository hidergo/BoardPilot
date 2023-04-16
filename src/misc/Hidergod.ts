import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import { bytesToHex, ConfigField, hexToBytes } from "./ConfigFields";
import Device, { DeviceInfo } from "./Device";
import { ApiEventType, HidergodCmd, HidergodMsg } from "./HidergodMsg";

export type OnResponseCallback = (data: object | null) => any;

export type OnReadConfigCallback = (data: {field: ConfigField, device: Device | undefined, status: boolean, data: Uint8Array}) => void;
export type OnWriteConfigCallback = (data: {field: ConfigField, device: Device | undefined, status: boolean}) => void;


export default class Hidergod {

    private static _reqid = 0;
    private static get reqid () {
        return this._reqid++;
    }

    public static instance : Hidergod | null = null;

    private connected = false;

    private _requests : {reqid: number, callback: OnResponseCallback}[] = [];

    constructor (port: number = 24429) {

        if(Hidergod.instance !== null)
            return;

        Hidergod.instance = this;

        // Set events
        listen('api_onopen', (event) => {
            this.onConnect(true);
        });

        listen('api_onclose', (event) => {
            this.onClose(true);
            // Reconnect after 1s
            /*
            setTimeout(() => {
                invoke("hidergod_connect", {port: port});
            }, 1000);
            */

        });
    
        listen('api_onmessage', (event) => {
            this.onMessage((event.payload as {message: string}).message);
        });

        // Connect
        invoke("hidergod_connect", {port: port});
    }

    private authenticate () {

        console.log("Authenticating...")
        const msg : HidergodMsg.registerRequest = {
            cmd: HidergodCmd.APICMD_REGISTER,
            key: "p*kG462jhJBY166EZLKxf9Du"
        }

        this.request(msg, (data) => {
            const resp = data as HidergodMsg.registerResponse;
            
            if(data && resp.status) {
                console.log("Logged in to the API");
                // Fetch devices
                Device.fetchDevices();
            }
            else {
                console.warn("Could not connect to API. Check service");
            }
        });
    }

    private onConnect (ok: boolean) {
        console.log("Socket connected");
        this.connected = true;
        this.authenticate();
    }

    private onMessage (data: string) {
        try {
            const jsn = JSON.parse(data);
            if(jsn.reqid !== undefined) {
                for(let i = 0; i < this._requests.length; i++) {
                    let r = this._requests[i];
                    if(r.reqid === jsn.reqid) {
                        r.callback(jsn);
                        this._requests.splice(i, 1);
                        break;
                    }
                }
            }

            if(jsn.cmd === HidergodCmd.APICMD_EVENT) {
                const msg = jsn as HidergodMsg.eventResponse;
                switch(msg.type) {
                    case ApiEventType.APIEVENT_NONE:
                        console.log("Unknown event");
                        break;
                    case ApiEventType.APIEVENT_DEVICE_CONNECTED:
                    {
                        let dev = Device.findDevice(msg.device.device.serial);
                        if(dev) {
                            dev.deviceInfo = { ...msg.device };
                        }
                        else {
                            dev = new Device({...msg.device});
                        }
                        Device.triggerDeviceUpdateListeners(dev);
                        break;
                    }
                    case ApiEventType.APIEVENT_DEVICE_DISCONNECTED:
                    {
                        const dev = Device.findDevice(msg.device.device.serial);
                        if(dev) {
                            let ix = Device.devices.indexOf(dev);
                            if(ix >= 0) {
                                Device.devices.splice(ix, 1);
                            }
                        }
                        if(Device.devices.length === 0)
                            Device.selectedDevice = null;
                        Device.triggerDeviceUpdateListeners(Device.devices);
                        break;
                    }
                }
            }
        }
        catch(e) {
            console.log(e);
            console.log(data);
        }
    }

    private onClose (ok: boolean) {
        this.connected = false;
        console.log("CLOSED");
    }

    /**
     * @brief Sends a request to hidergod
     * @param msg 
     * @param onResponse 
     * @returns 
     */
    public request (msg: object, onResponse?: OnResponseCallback) : boolean {
        if(!this.connected)
            return false;

        const _req_id = Hidergod.reqid;
        const nmsg = {
            ...msg,
            reqid: _req_id
        };

        if(onResponse) {
            this._requests.push({reqid: _req_id, callback: onResponse});
        }
        invoke("hidergod_send", {message: JSON.stringify(nmsg)});
        return true;
    }

    /**
     * @brief Reads a field from config
     * @param device 
     * @param field 
     * @param onResponse 
     * @returns 
     */
    public readConfig (device: Device, field: ConfigField, onResponse?: OnReadConfigCallback) {
        const msg : HidergodMsg.controlReadRequest = {
            cmd: HidergodCmd.APICMD_ZMK_CONTROL_READ,
            field: field,
            device: device.deviceInfo.device.serial
        }
        return this.request(msg, (resp) => {
            if(resp) {
                const readResp = resp as HidergodMsg.controlReadResponse;

                const dev = Device.findDevice(readResp.device);
                const data = hexToBytes(readResp.data);

                if(onResponse) {
                    onResponse({
                        field: field,
                        device: dev,
                        status: readResp.status,
                        data: data
                    });
                }
            }
        });
    }

    /**
     * @brief Writes a config field
     * @param device 
     * @param field 
     * @param data 
     * @param save 
     * @param onResponse 
     * @returns 
     */
    public writeConfig (device: Device, field: ConfigField, data: Uint8Array, save: boolean, onResponse?: OnWriteConfigCallback) {
        const msg : HidergodMsg.controlWriteRequest = {
            cmd: HidergodCmd.APICMD_ZMK_CONTROL_WRITE,
            field: field,
            save: save,
            data: bytesToHex(data),
            device: device.deviceInfo.device.serial
        }
        return this.request(msg, (resp) => {
            if(resp) {
                const writeResp = resp as HidergodMsg.controlWriteResponse;

                const dev = Device.findDevice(writeResp.device);

                if(onResponse) {
                    onResponse({
                        field: field,
                        device: dev,
                        status: writeResp.status
                    });
                }
            }
        });
    }
}
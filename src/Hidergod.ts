import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import Device, { DeviceInfo } from "./Device";

export type OnResponseCallback = (data: object | null) => any;

export enum HidergodCmd {
    APICMD_REGISTER =       0x01,
    APICMD_DEVICES =        0x10,

    APICMD_SET_KEYMAP =     0x20,
    APICMD_GET_KEYMAP =     0x21,

    APICMD_SET_IQS_REGS =   0x40,
    APICMD_GET_IQS_REGS =   0x41,

    // Events
    APICMD_EVENT =          0x80
}

export enum ApiEventType {
    APIEVENT_NONE,
    APIEVENT_DEVICE_CONNECTED,
    APIEVENT_DEVICE_DISCONNECTED
};

export type AuthenticationResponse = {cmd: HidergodCmd.APICMD_REGISTER, status: boolean};

export type EventResponse = {
    cmd: HidergodCmd.APICMD_EVENT,
    type: number,
    device: DeviceInfo,
    reqid: number
};

export type DevicesResponse = {
    cmd: 0x10,
    devices: DeviceInfo[],
    reqid: number
};

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
            console.log("ONOPEN");
            this.onConnect(true);
        });

        listen('api_onclose', (event) => {
            console.log("ONCLOSE");

            this.onClose(true);

        });
    
        listen('api_onmessage', (event) => {
            console.log("ONMESSAGE");
            this.onMessage((event.payload as {message: string}).message);
        });

        // Connect
        invoke("hidergod_connect", {port: port});
    }



    public request (msg: object, onResponse: OnResponseCallback | undefined = undefined) : boolean {
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

    private authenticate () {

        console.log("Authenticating...")
        const msg = {
            cmd: HidergodCmd.APICMD_REGISTER,
            key: "p*kG462jhJBY166EZLKxf9Du"
        };

        this.request(msg, (data) => {
            const resp = data as AuthenticationResponse;
            
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
                const msg = jsn as EventResponse;
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
    }

}
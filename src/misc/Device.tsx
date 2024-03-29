import BoardPilotService from "./BoardPilotService";
import { BoardPilotServiceCmd, BoardPilotServiceMsg } from "./BoardPilotServiceMsg";

export type DeviceInfo = {
    product: {
        vid: number,
        pid: number,
        manufacturer: string,
        product: string,
        rev: number
    },
    device: {
        serial: string,
        protocol: 'usb'|'bt'
    }
}

/**
 * @brief Callback type for device update
 */
export type DeviceUpdateCallback = (device: Device | Device[]) => any;


export default class Device {

    // List of all devices
    static devices : Device[] = [];

    // Currently selected global device
    static selectedDevice : Device | null = null;

    // Device update listeners
    private static _deviceUpdateCallbackCounter = 0;
    private static deviceUpdateCallbacks : {id: number, callback: DeviceUpdateCallback}[] = [];


    // Device information
    deviceInfo : DeviceInfo;

    constructor(deviceInfo: DeviceInfo) {
        this.deviceInfo = deviceInfo;

        Device.devices.push(this);
    }

    /**
     * @brief Adds a device update listener
     * @param callback 
     * @returns id of the listener
     */
    static addDeviceUpdateListener (callback: DeviceUpdateCallback) {
        const cnt = Device._deviceUpdateCallbackCounter++;
        Device.deviceUpdateCallbacks.push({id: cnt, callback: callback});
        return cnt;
    }

    /**
     * @brief Removes a device update listener
     * @param id id of the listener
     */
    static removeDeviceUpdateListener (id: number) {
        const d = Device.deviceUpdateCallbacks.findIndex(e => e.id === id);
        if(d >= 0) {
            Device.deviceUpdateCallbacks.splice(d, 1);
        }
    }

    static triggerDeviceUpdateListeners (device: Device | Device[]) {
        Device.deviceUpdateCallbacks.forEach(e => {
            e.callback(device);
        })
    }

    static fetchDevices () {
        const msg : BoardPilotServiceMsg.devicesRequest = {
            cmd: BoardPilotServiceCmd.APICMD_DEVICES
        }
        BoardPilotService.instance?.request(msg, (data) => {
            if(data) {
                const resp = data as BoardPilotServiceMsg.devicesResponse;

                resp.devices.forEach(e => {
                    let dev = Device.findDevice(e.device.serial);
                    if(dev) {
                        dev.deviceInfo = { ...e };
                    }
                    else {
                        dev = new Device(e);
                    }
                });

                if(Device.selectedDevice === null) {
                    if(Device.devices.length > 0) {
                        Device.selectedDevice = Device.devices[0];
                    }
                }

                if(Device.devices.length === 0)
                    Device.selectedDevice = null;

                Device.triggerDeviceUpdateListeners(Device.devices);
            }
        })
    }

    static findDevice (serial: string) {
        return Device.devices.find(e => e.deviceInfo.device.serial === serial);
    }

}
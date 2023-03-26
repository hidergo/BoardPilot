import { useState } from "react";
import Device from "../Device";
import Hidergod, { HidergodCmd, ReadConfigResponse } from "../Hidergod";
import { ConfigFields, hexToBytes } from "../misc/ConfigFields";


type KeyDef = {
    // Key position
    key: number;
    // Layer
    layer: number;
    // Device
    device: number;
    // Param 1
    param1: number;
    // Param 2
    param2: number;
};



export default function KeymapEditorNew () {

    const [reboundKeys, setReboundKeys] = useState<KeyDef[]>();

    function getKeymap () {
        if(Device.selectedDevice !== null) {
            Hidergod.instance?.request({
                cmd: HidergodCmd.APICMD_ZMK_CONTROL_READ,
                device: Device.selectedDevice.deviceInfo.device.serial,
                field: ConfigFields.ZMK_CONFIG_KEY_KEYMAP
            }, (data) => {
                let msg = data as ReadConfigResponse;
                if(msg.status) {
                    const bytes = hexToBytes(msg.data);
                    // KeyDef size is 11 bytes in the message
                    // Check for size match
                    if(bytes.length % 11 === 0) {
                        const dv = new DataView(bytes.buffer);

                        let rbKeys : KeyDef[] = [];
                        /*
                            struct __attribute__((packed)) zmk_config_keymap_item {
                                uint16_t key;
                                uint8_t device;
                                uint32_t param1;
                                uint32_t param2;
                            };
                        */
                        for(let i = 0; i < bytes.length; i += 11) {
                            const kdef : KeyDef = {
                                layer: dv.getUint16(i + 0, true) & 0x0F,
                                key: dv.getUint16(i + 0, true) >> 4,
                                device: dv.getUint8(i + 2),
                                param1: dv.getUint32(i + 3, true),
                                param2: dv.getUint32(i + 7, true),
                            }
                            rbKeys.push(kdef);
                        }

                        setReboundKeys(rbKeys);
                    }
                    else {
                        // Key rebind incorrect size
                        console.error("Key rebind incorrect size");
                    }

                }
            })
        }
    }

}
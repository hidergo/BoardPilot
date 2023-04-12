import { Alert, Autocomplete, Button, Card, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { Box } from "@mui/system";
import { Fragment, useEffect, useState } from "react";
import Keymap, { KeyDef, KeymapJsonFormat } from "../Components/Keyboard";
import Device from "../Device";
import Hidergod, { HidergodCmd, ReadConfigResponse } from "../Hidergod";
import { bytesToHex, ConfigFields, hexToBytes } from "../misc/ConfigFields";
import { keymapBehaviours } from "../misc/KeymapDefs";
import hidergo_disconnect_mk1_keymap from '../Keymaps/hidergo_disconnect_mk1_keymap.json'


export default function KeymapEditorNew () {

    const [reboundKeys, setReboundKeys] = useState<KeyDef[]>([]);

    const [editorBehaviour, setEditorBehaviour] = useState("TRANS");
    const [editorAction, setEditorAction] = useState({label: "", group: "", id: {group: 0, action: 0}});

    const [selectedKey, setSelectedKey] = useState<KeymapJsonFormat | null>(null);

    function setKeymap (save: boolean) {
        const maxRebinds = 64;
        const structSize = 11;

        const bytes = new Uint8Array(maxRebinds * structSize);
        bytes.fill(0xFF);

        const dv = new DataView(bytes.buffer);

        for(let i = 0; i < 1; i++) {
            const offset = i * structSize;
            const layer = 0;
            const key = 13;
            dv.setUint16(offset + 0, layer | (key << 4), true);
            // KEY_PRESS
            dv.setUint8(offset + 2, 0x06);
            // PARAM 1
            dv.setUint32(offset + 3, 0x00070005, true);
            dv.setUint32(offset + 7, 0x00000000, true);

        }

        if(!Device.selectedDevice)
            return;

        Hidergod.instance?.request({
            cmd: HidergodCmd.APICMD_ZMK_CONTROL_WRITE,
            device: Device.selectedDevice.deviceInfo.device.serial,
            field: ConfigFields.ZMK_CONFIG_KEY_KEYMAP,
            save: false,
            bytes: bytesToHex(bytes)
        }, (resp) => {
            console.log(resp);
        })
    }

    function getKeymap () {
        if(Device.selectedDevice !== null) {
            Hidergod.instance?.request({
                cmd: HidergodCmd.APICMD_ZMK_CONTROL_READ,
                device: Device.selectedDevice.deviceInfo.device.serial,
                field: ConfigFields.ZMK_CONFIG_KEY_KEYMAP
            }, (data) => {
                let msg = data as ReadConfigResponse;
                console.log(msg.status);
                if(msg.status) {
                    const bytes = hexToBytes(msg.data);
                    // KeyDef size is 11 bytes in the message
                    console.log(bytes);
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

    const groupedActions = keymapBehaviours[editorBehaviour].groups.flatMap((e, gi) => {
        return e.values.map((y, i) => {
            return {
                group: e.name,
                label: y.name,
                id: { group: gi, action: i}
            }
        })
    })

    useEffect(() => {
        getKeymap();
    }, [])

    return <Box sx={{boxSizing: 'border-box', height: '100%', padding: 1}}>
        <Box sx={{height: '100%', display: 'flex', flexDirection: 'column'}}>
            <Card sx={{margin: 1, padding: 1, flex: 3}}>
                <Box sx={{display: 'flex', flexDirection: 'row', padding: 1}}>
                    <Box sx={{flex: 2}}>
                        <Select
                            sx={{maxWidth: '200px'}}
                            label="Layer"
                            >
                        {
                            hidergo_disconnect_mk1_keymap.layers.map((e, i) => {
                                return <MenuItem value={i} key={"layer-sel-" + i}>{e}</MenuItem>
                            })
                        }
                        </Select>
                    </Box>
                    <Box sx={{flex: 1}}>
                        {
                            reboundKeys.length < 1 &&
                            <Alert severity="warning">Could not read current keymap. Bindings will be overwritten on upload!</Alert>
                        }
                    </Box>
                </Box>
                <svg width={window.innerWidth - 20} viewBox={"0 0 " + String(window.innerWidth) + " 400"} xmlns="http://www.w3.org/2000/svg">
                    <Keymap 
                        keymap={hidergo_disconnect_mk1_keymap}
                        reboundKeys={reboundKeys}
                        width={window.innerWidth - 20} 
                        height={window.innerHeight / 2} 
                        selected={selectedKey} 
                        onSelect={(key) => { setSelectedKey(key) }} 
                    />
                </svg>
            </Card>
            <Card sx={{margin: 1, padding: 1, flex: 1}}>
                <FormControl sx={{flexDirection: 'row'}}>
                    <Box>
                        <InputLabel id="key-behaviour-select">Behaviour</InputLabel>
                        <Select
                            labelId="key-behaviour-select"
                            value={editorBehaviour}
                            label="Behaviour"
                            onChange={(e) => {
                                setEditorBehaviour(e.target.value); 
                                setEditorAction({
                                    label: keymapBehaviours[e.target.value].groups[0].values[0].name, 
                                    group: keymapBehaviours[e.target.value].groups[0].name, 
                                    id: {group: 0, action: 0}
                                })
                            }}
                        >
                            {
                                Object.keys(keymapBehaviours).map((k, i) => {
                                    const e = keymapBehaviours[k];
                                    return <MenuItem value={k}>{e.display}</MenuItem>
                                })
                            }
                        </Select>
                    </Box>
                    {
                        keymapBehaviours[editorBehaviour].groups.length >= 1 &&
                        <Box>
                            <Autocomplete
                                disableClearable
                                id="key-value-select"
                                options={groupedActions}
                                groupBy={(opt) => opt.group}
                                sx={{ width: 300 }}
                                getOptionLabel={(opt) => opt.label}
                                isOptionEqualToValue={(opt, val) => opt.id.group === val.id.group && opt.id.action === val.id.action}
                                value={editorAction}
                                onChange={(e, v) => {setEditorAction(v)}}
                                renderInput={(params) => <TextField {...params} label="Action" />}
                                />
                        </Box>
                    }

                    <Box>
                        <Button variant="contained" onClick={() => {setKeymap(false)}} >Upload keymap</Button>
                    </Box>

                </FormControl>
            </Card>
        </Box>
    </Box>
}
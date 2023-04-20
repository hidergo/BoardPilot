import { Alert, Autocomplete, Button, Card, Divider, FormControl, InputLabel, MenuItem, Popover, Select, TextField, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { Fragment, useEffect, useState } from "react";
import Keymap, { KeyDef, KeymapJsonFormat } from "../Components/Keyboard";
import Device from "../misc/Device";
import Hidergod from "../misc/Hidergod";
import { bytesToHex, ConfigField, hexToBytes } from "../misc/ConfigFields";
import { keymapBehaviours } from "../misc/KeymapDefs";
import hidergo_disconnect_mk1_keymap from '../Keymaps/hidergo_disconnect_mk1_keymap.json'


export default function KeymapEditor () {
    

    const [reboundKeys, setReboundKeys] = useState<KeyDef[]>([]);
    const [selectedLayer, setSelectedLayer] = useState(0);

    const [editorBehaviour, setEditorBehaviour] = useState("TRANS");

    const [groupedActions, setGroupedActions] = useState(keymapBehaviours[editorBehaviour].groups.flatMap((e, gi) => {
        return e.values.map((y, i) => {
            return {
                ...y,
                group: e.name
            }
        })
    }))

    const [editorVal, setEditorVal] = useState(groupedActions[0]);


    const [selectedKey, setSelectedKey] = useState<KeymapJsonFormat | null>(null);
    const [selectedTarget, setSelectedTarget] = useState<SVGElement | null>(null);


    function readConfigKeymap () {
        if(!Device.selectedDevice)
            return;

        Hidergod.instance?.readConfig(
            Device.selectedDevice, 
            ConfigField.ZMK_CONFIG_KEY_KEYMAP,
            (resp) => {
                if(resp.status) {
                    if(resp.data.length % 11 !== 0)
                        return;
                    
                    let dv = new DataView(resp.data.buffer);
                    
                    let rbKeys : KeyDef[] = [];
                    /*
                        struct __attribute__((packed)) zmk_config_keymap_item {
                            uint16_t key;
                            uint8_t device;
                            uint32_t param1;
                            uint32_t param2;
                        };
                    */
                    for(let i = 0; i < dv.byteLength; i += 11) {
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
                    // Fail
                }
            }
        );
    }

    function writeConfigKeymap (save: boolean) {
        if(!Device.selectedDevice)
            return;

        const maxRebinds = 64;
        const structSize = 11;
        const bytes = new Uint8Array(maxRebinds * structSize);
        bytes.fill(0xFF);

        const dv = new DataView(bytes.buffer);

        let offset = 0;
        for(let rk of reboundKeys) {
            // DEVICE
            dv.setUint16(offset + 0, rk.layer | (rk.key << 4), true);
            // KEY_PRESS
            dv.setUint8(offset + 2, rk.device);
            // PARAM 1
            dv.setUint32(offset + 3, rk.param1, true);
            // PARAM 2
            dv.setUint32(offset + 7, rk.param2, true);

            offset += 11;
        }

        Hidergod.instance?.writeConfig(
            Device.selectedDevice, 
            ConfigField.ZMK_CONFIG_KEY_KEYMAP,
            bytes,
            save,
            (resp) => {
                if(resp.status) {
                    // OK
                }
                else {
                    // Fail
                }
            }
        );
    }


    useEffect(() => {
        readConfigKeymap();
    }, [])

    return <Box sx={{boxSizing: 'border-box', height: '100%', padding: 1}}>
        <Box sx={{height: '100%', display: 'flex', flexDirection: 'column'}}>
            <Card sx={{margin: 1, padding: 1, flex: 3, display: 'flex', flexDirection: 'column'}}>
                <Box sx={{flex: 4}}>
                    <Box sx={{display: 'flex', flexDirection: 'row', padding: 1}}>
                        <Box sx={{flex: 2}}>
                            <Select
                                sx={{maxWidth: '200px'}}
                                label="Layer"
                                onChange={(e) => {setSelectedLayer(Number(e.target.value))}}
                                value={selectedLayer}
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
                            onSelect={(key, target) => { 
                                setSelectedKey(key); 
                                setSelectedTarget(target);
                                if(key && key.defaults) {
                                    const defaults = key.defaults[selectedLayer];
                                    setEditorBehaviour(defaults.device);

                                    const gActions = keymapBehaviours[defaults.device].groups.flatMap((e, gi) => {
                                        return e.values.map((y, i) => {
                                            return {
                                                ...y,
                                                group: e.name
                                            }
                                        })
                                    })

                                    setGroupedActions(gActions);

                                    setEditorVal(gActions.find(e => e.value1 === Number(defaults.param1)) || gActions[0]);
                                }
                                else {
                                    setEditorBehaviour("TRANS");
                                    const gActions = keymapBehaviours["TRANS"].groups.flatMap((e, gi) => {
                                        return e.values.map((y, i) => {
                                            return {
                                                ...y,
                                                group: e.name
                                            }
                                        })
                                    })
                                    setGroupedActions(gActions);
                                    setEditorVal(gActions[0]);
                                }
                            }} 
                        />
                    </svg>
                </Box>
                <Divider />
                <Box sx={{paddingTop: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end'}}>
                    <Button variant="contained" onClick={() => {writeConfigKeymap(false)}} >Upload keymap</Button>
                </Box>
            </Card>
            
            <Popover
                open={selectedKey !== null}
                anchorEl={selectedTarget}
                
                onClose={() => {setSelectedKey(null)}}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
            >
                <FormControl sx={{display: 'flex', flexDirection: 'column'}}>
                    <Box sx={{display: 'flex', flexDirection: 'row', padding: 2, paddingBottom: 1}}>
                        <Fragment>
                            <TextField
                                select
                                value={editorBehaviour}
                                label="Behaviour"
                                sx={{minWidth: 200}}
                                onChange={(e) => {
                                    setEditorBehaviour(e.target.value); 
                                    setEditorVal({...keymapBehaviours[editorBehaviour].groups[0].values[0], group: e.target.value});
                                }}
                            >
                                {
                                    Object.keys(keymapBehaviours).map((k, i) => {
                                        const e = keymapBehaviours[k];
                                        return <MenuItem value={k} key={"keymap-behaviour-" + i}>{e.display}</MenuItem>
                                    })
                                }
                            </TextField>
                        </Fragment>
                        {
                            keymapBehaviours[editorBehaviour].groups.length >= 1 &&
                            <Fragment>
                                <Autocomplete
                                    disableClearable
                                    id="key-value-select"
                                    options={groupedActions}
                                    groupBy={(opt) => opt.group}
                                    sx={{ minWidth: 200 }}
                                    getOptionLabel={(opt) => opt.name}
                                    isOptionEqualToValue={(opt, val) => opt.value1 === val.value1 && opt.group === val.group}
                                    value={editorVal}
                                    onChange={(e, v) => {setEditorVal(v)}}
                                    renderInput={(params) => <TextField {...params} label="Action" />}
                                    />
                            </Fragment>
                        }
                        {
                            editorVal.val2IsInput &&
                            <Fragment>
                                <TextField 
                                    type={'number'}
                                    sx={{minWidth: 150}}
                                />
                            </Fragment>
                        }
                    </Box>
                    <Box sx={{display: 'flex', flexDirection: 'row', padding: 1, paddingTop: 0}}>
                        <Button variant="contained" sx={{flex: 1, marginRight: 2}}>Reset</Button>
                        <Typography variant="subtitle2" sx={{flex: 1, color: 'grey'}}>{editorVal.description}</Typography>
                    </Box>

                </FormControl>
            </Popover>
            
        </Box>
    </Box>
}
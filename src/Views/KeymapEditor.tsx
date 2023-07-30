import { Alert, Autocomplete, Button, Card, Divider, FormControl, InputLabel, MenuItem, Popover, Select, TextField, Typography, IconButton, Modal } from "@mui/material";
import { Box } from "@mui/system";
import { Fragment, useEffect, useState } from "react";
import { readBinaryFile, readTextFile, writeTextFile } from "@tauri-apps/api/fs";
import { open, save } from "@tauri-apps/api/dialog";
import Keymap, { KeyDef, KeymapJsonFormat } from "../Components/Keyboard";
import Device from "../misc/Device";
import BoardPilotService from "../misc/BoardPilotService";
import { bytesToHex, ConfigField, hexToBytes } from "../misc/ConfigFields";
import { keymapBehaviours, getKeymapDeviceName, getKeymapDeviceId } from "../misc/KeymapDefs";
import hidergo_disconnect_mk1_keymap_ansi from '../Keymaps/hidergo_disconnect_mk1_keymap_ansi.json'
import hidergo_disconnect_mk1_keymap_iso from '../Keymaps/hidergo_disconnect_mk1_keymap_iso.json'
import { colorPalette } from '../Styles/Colors';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import SaveIcon from '@mui/icons-material/Save';
import IosShareIcon from '@mui/icons-material/IosShare';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import SettingsIcon from '@mui/icons-material/Settings';

export default function KeymapEditor() {

    const [refreshKey, setRefreshKey] = useState(0);
    const [keyboardVersionSelected, setKeyboardVersionSelected] = useState(false);
    const [keymap, setKeymap] = useState(hidergo_disconnect_mk1_keymap_ansi);
    const [flatKeymap, setFlatKeymap] = useState(
        [
            hidergo_disconnect_mk1_keymap_ansi.keys_left,
            hidergo_disconnect_mk1_keymap_ansi.keys_right
        ].flatMap((e) => e.flatMap(y => y.map(z => z)))
    );

    const [keymapReadState, setKeymapReadState] = useState(true);

    useEffect(() => {
        console.log("useEffect2")

        //set split or not
        if (keymap.type === "SPLITKB") {
            setFlatKeymap([
                keymap.keys_left,
                keymap.keys_right
            ].flatMap((e) => e.flatMap(y => y.map(z => z))))
        }
        else {
            //setFlatKeymap(keymap.keys);
        }

    }, [keymap])

    useEffect(() => {
        console.log("useEffect")
        //set iso or ansi
        let keyboardVersion = localStorage.getItem('keyboardVersion')
        if (keyboardVersion) {
            if (keyboardVersion === 'ansi') setKeymap(hidergo_disconnect_mk1_keymap_ansi)
            else setKeymap(hidergo_disconnect_mk1_keymap_iso)
            setKeyboardVersionSelected(true)
        } else {
            setKeyboardVersionSelected(false)
        }
        // TODO: Callback on select device
        setTimeout(() => {
            readConfigKeymap();
        }, 100)
    }, [])

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

    useEffect(() => {
        console.log(editorVal);
    }, [editorVal])

    useEffect(() => {
        console.log(reboundKeys)
    }, [reboundKeys])

    function isDefaultKey(key: KeyDef) {
        const defKey = flatKeymap.find(e => e.pos === key.key);
        if (defKey && defKey.defaults) {
            const d = defKey.defaults[key.layer] as {
                device: string,
                param1?: string | number,
                param2?: string | number
            };

            if (getKeymapDeviceName(key.device) === d.device &&
                (!d.param1 || Number(d.param1) === Number(key.param1)) &&
                (!d.param2 || Number(d.param2) === Number(key.param2))) {

                return true;
            }
            console.log("NOT DEFAULT KEY: ");
            console.log(key, d);
            return false;
        }

        return false;
    }


    function rebindKey(key: KeyDef) {
        let i = 0;
        // Find existing rebind
        for (let rk of reboundKeys) {
            if (rk.key === key.key) {
                // Found existing bind, replace it

                // Check if default
                if (isDefaultKey(key)) {
                    // This field can be removed since it's a default value
                    const rbks = [...reboundKeys];
                    rbks.splice(i, 1);
                    setReboundKeys(rbks);

                    return true;
                }
                // Change values
                const rbks = [...reboundKeys];
                rbks[i] = key;
                setReboundKeys(rbks);

                return true;
            }
            i++;
        }

        // Can't add more than 64 rebinds
        if (reboundKeys.length - 1 >= 64) {
            return false;
        }

        // Add new rebind
        const rbks = [...reboundKeys];
        rbks.push(key);
        setReboundKeys(rbks);

    }


    function readConfigKeymap() {
        if (!Device.selectedDevice) {
            setKeymapReadState(false);
            return;
        }

        BoardPilotService.instance?.readConfig(
            Device.selectedDevice,
            ConfigField.ZMK_CONFIG_KEY_KEYMAP,
            (resp) => {
                if (resp.status) {
                    if (resp.data.length % 11 !== 0)
                        return;

                    let dv = new DataView(resp.data.buffer);

                    let rbKeys: KeyDef[] = [];
                    /*
                        struct __attribute__((packed)) zmk_config_keymap_item {
                            uint16_t key;
                            uint8_t device;
                            uint32_t param1;
                            uint32_t param2;
                        };
                    */
                    for (let i = 0; i < dv.byteLength; i += 11) {
                        const kdef: KeyDef = {
                            layer: dv.getUint16(i + 0, true) & 0x0F,
                            key: dv.getUint16(i + 0, true) >> 4,
                            device: dv.getUint8(i + 2),
                            param1: dv.getUint32(i + 3, true),
                            param2: dv.getUint32(i + 7, true),
                        }
                        if (kdef.layer !== 0x0F && kdef.key !== 0xFFF) {
                            rbKeys.push(kdef);
                        }
                    }

                    setReboundKeys(rbKeys);
                    setKeymapReadState(true);

                }
                else {
                    // Fail
                    setKeymapReadState(false);
                }
            }
        );
    }

    async function saveConfigKeymapAsJson() {
        const file = await save({
            filters: [{
                name: 'JSON (.json)',
                extensions: ['json']
            }]
        })
        const json = JSON.stringify(reboundKeys);
        await writeTextFile(file, json);
    }

    async function loadConfigKeymapAsJson() {
        const file = await open({
            filters: [{
                name: 'JSON (.json)',
                extensions: ['json']
            }]
        })
        if (file) {
            const json = await readTextFile(file as string);
            const rbks = JSON.parse(json) as KeyDef[];
            setReboundKeys(rbks);
        }
    }


    function writeConfigKeymap(save: boolean) {
        if (!Device.selectedDevice)
            return;

        const maxRebinds = 64;
        const structSize = 11;
        const bytes = new Uint8Array(maxRebinds * structSize);
        bytes.fill(0xFF);

        const dv = new DataView(bytes.buffer);

        let offset = 0;
        for (let rk of reboundKeys) {
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

        BoardPilotService.instance?.writeConfig(
            Device.selectedDevice,
            ConfigField.ZMK_CONFIG_KEY_KEYMAP,
            bytes,
            save,
            (resp) => {
                if (resp.status) {
                    // OK
                }
                else {
                    // Fail
                }
            }
        );
    }

    const modalBody = (
        <Box sx={{ backgroundColor: colorPalette.background, position: "absolute", top: "40%", left: "40%", width: "20%", display: 'flex', flex: 1, flexDirection: 'column', alignContent: 'center', justifyContent: 'space-around' }}>
            <Typography textAlign={'center'} sx={{paddingTop: 5}}>Select Keyboard Variant</Typography>
            <Box sx={{display: 'flex', flex: 1, flexDirection: 'row', alignContent: 'center', justifyContent: 'space-around', padding: 5}}>
                <Button type="submit" variant="outlined" onClick={() => { localStorage.setItem('keyboardVersion', 'ansi'); setKeyboardVersionSelected(true); setRefreshKey(Math.random()) }}>
                    ANSI
                </Button>
                <Button type="submit" variant="outlined" onClick={() => { localStorage.setItem('keyboardVersion', 'iso'); setKeyboardVersionSelected(true); setRefreshKey(Math.random()) }}>
                    ISO
                </Button>
            </Box>
        </Box>
    );

    return <Box sx={{ userSelect: 'none', boxSizing: 'border-box', height: '100%', width: window.innerWidth, padding: 1, display: 'flex', flexDirection: 'row', backgroundColor: colorPalette.background }}>
        <Modal open={!keyboardVersionSelected} >
            {modalBody}
        </Modal>
        <Box sx={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', borderColor: colorPalette.backgroundExtraLight, justifyContent: 'center' }}>
            {keymap.layers.map((e, i) => {
                return (
                    <Box key={"layer-sel-" + i} onClick={() => setSelectedLayer(i)} sx={[{ borderRight: '1px solid', padding: 3, margin: 1, cursor: 'pointer', color: colorPalette.text }, selectedLayer == i && { backgroundColor: colorPalette.backgroundLight }]}>
                        {e}
                    </Box>
                )
            })}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '80%', padding: 10 }}>
            <Box sx={{ flex: 4 }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', padding: 1 }}>
                    <Box sx={{ flex: 1 }}>
                        {
                            !keymapReadState &&
                            <Alert severity="warning">Could not read current keymap. Bindings will be overwritten on upload!</Alert>
                        }
                    </Box>
                </Box>
                <svg key={refreshKey} style={{ cursor: 'pointer', }} width={window.innerWidth * 0.77} viewBox={"0 0 " + window.innerWidth * 0.90 + " 400"} xmlns="http://www.w3.org/2000/svg">
                    <Keymap
                        //@ts-ignore
                        keymap={keymap}
                        reboundKeys={reboundKeys}
                        width={window.innerWidth * 0.8}
                        height={window.innerHeight / 2}
                        selected={selectedKey}
                        layer={selectedLayer}
                        onSelect={(key, target) => {
                            setSelectedKey(key);
                            setSelectedTarget(target);
                            if (key && key.defaults) {
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
            <Box sx={{ paddingTop: 3, paddingRight: 18, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button startIcon={<ExitToAppIcon />} variant="outlined" onClick={() => { loadConfigKeymapAsJson() }}>
                    Import JSON
                </Button>
                <Button startIcon={<SaveIcon />} variant="outlined" onClick={() => { saveConfigKeymapAsJson() }}>
                    Save JSON
                </Button>
                <Button startIcon={<IosShareIcon />} variant="contained" onClick={() => { writeConfigKeymap(true) }}>
                    Upload
                </Button>
            </Box>
            <Popover
                open={selectedKey !== null}
                anchorEl={selectedTarget}

                onClose={() => { setSelectedKey(null) }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
            >
                <FormControl sx={{ display: 'flex', flexDirection: 'column', backgroundColor: colorPalette.backgroundLight }}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', padding: 2, paddingBottom: 1 }}>
                        <Fragment>
                            <TextField
                                select
                                value={editorBehaviour}
                                label="Behaviour"
                                sx={{ minWidth: 200, paddingRight: 1 }}
                                onChange={(e) => {
                                    setEditorBehaviour(e.target.value);
                                    const gActions = keymapBehaviours[e.target.value].groups.flatMap((e, gi) => {
                                        return e.values.map((y, i) => {
                                            return {
                                                ...y,
                                                group: e.name
                                            }
                                        })
                                    })
                                    setGroupedActions(gActions);
                                    setEditorVal({ ...keymapBehaviours[e.target.value].groups[0].values[0], group: e.target.value });
                                    if (selectedKey) {
                                        rebindKey({
                                            layer: selectedLayer,
                                            key: selectedKey.pos,
                                            device: getKeymapDeviceId(e.target.value) || 0,
                                            param1: keymapBehaviours[e.target.value].groups[0].values[0].value1,
                                            param2: keymapBehaviours[e.target.value].groups[0].values[0].value2 || 0,
                                        })
                                    }
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
                                    onChange={(e, v) => {
                                        setEditorVal(v);
                                        if (selectedKey) {
                                            rebindKey({
                                                layer: selectedLayer,
                                                key: selectedKey.pos,
                                                device: getKeymapDeviceId(editorBehaviour) || 0,
                                                param1: v.value1,
                                                param2: v.value2 || 0,
                                            })
                                        }
                                    }}
                                    renderInput={(params) => <TextField {...params} label="Action" />}
                                />
                            </Fragment>
                        }
                        {
                            editorVal.val2IsInput &&
                            <Fragment>
                                <TextField
                                    type={'number'}
                                    sx={{ minWidth: 150 }}
                                />
                            </Fragment>
                        }
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'row', padding: 1, paddingTop: 0 }}>
                        <Button variant="contained" sx={{ flex: 1, marginRight: 2 }}>Reset</Button>
                        <Typography variant="subtitle2" sx={{ flex: 1, color: 'grey' }}>{editorVal.description}</Typography>
                    </Box>

                </FormControl>
            </Popover>

        </Box>
    </Box>
}
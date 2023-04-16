import { MenuItem, Select, TextField, Typography } from "@mui/material";
import { Box } from "@mui/system";
import React, { useEffect, useRef, useState } from "react"
import Device from "../misc/Device";
import Hidergod, { HidergodCmd } from "../misc/Hidergod";
import hidergo_split_keymap from '../Keymaps/hidergo_split_keymap.json'
import { getKeymapDeviceId, getKeymapDeviceName, keymapBehaviour } from "../misc/KeymapDefs";

type CustomKeyType = "isoenter" | "pot";

type SelectKeyCallback = (key: KeymapJsonFormat | null) => any;

type EditorKeyProps = {
    keyObject: KeymapJsonFormat,
    x: number,
    y: number,
    selected: boolean,
    onSelect?: SelectKeyCallback,
    keyType?: number | CustomKeyType,
    fontSize?: number,
    rotation?: number
}

type KeymapJsonFormat = {
    name: string,
    dsp: string,
    dsp2?: string,
    size: number,
    rot?: number,
    offX?: number,
    offY?: number,
    fontSize?: number,
    // Position in keymap (index)
    pos: number,
    hidden?: boolean
}

type GetKeymapResponse = {
    cmd:      0x21,
    status:   boolean,
    keymap: number[][][],
    reqid:  number
}

const keySelectedColor = '#aaa';

let keyBaseSize = 55;
let keyMargin = 2;
let fontBaseSize = 15;

const EditorKey = (props: EditorKeyProps) => {

    const keySize = (typeof props.keyType === 'string' ? 1 : props.keyType) || 1;
    const rot = props.rotation || 0;
    const fontSize = props.fontSize ? props.fontSize * fontBaseSize : fontBaseSize;

    return (
        <g transform={`translate(${props.x},${props.y})`}>
            <g transform={`rotate(${rot})`}>
                <rect x={0} y={0} width={keyBaseSize * keySize} height={keyBaseSize} rx={keyBaseSize * 0.1}
                    fill={props.selected ? keySelectedColor : 'white'} stroke={'black'} onClick={() => {
                        if (props.onSelect)
                            props.onSelect(props.selected ? null : props.keyObject);
                    }}>

                </rect>
                <rect x={4} y={0} width={(keyBaseSize * keySize) - 8} height={keyBaseSize - 8} rx={keyBaseSize * 0.1} fill={'none'} stroke={'black'}>

                </rect>
                <text x={8} y={18} fontFamily='Inter' fontSize={fontSize} fill="black" pointerEvents={'none'}>
                    {props.keyObject.dsp}
                </text>
                <text x={48*keySize} y={40} fontFamily='Inter' fontSize={fontSize*0.8} fill="black" pointerEvents={'none'} text-anchor="end">
                    {props.keyObject.dsp2 || ''}
                </text>
            </g>
        </g>
    )
}

const Keyboard_hidergo_split = (props: { width: number, height: number, selected: KeymapJsonFormat | null, onSelect?: SelectKeyCallback }) => {
    let offsetY = 0;
    const k_left = <g>
        {
            // Map rows
            (hidergo_split_keymap.keys_left as KeymapJsonFormat[][]).map((row, y) => {
                let offsetX = 0;
                // Cols
                const ky = row.map((v, x) => {
                    if(v.hidden === true) {
                        return null;
                    }
                    const kx = <EditorKey
                        keyObject={v}
                        x={offsetX + keyBaseSize * (v.offX || 0)}
                        y={offsetY + keyBaseSize * (v.offY || 0)}
                        keyType={v.size}
                        key={"LK" + x + "_" + y}
                        rotation={v.rot}
                        selected={props.selected?.name === v.name}
                        onSelect={(key) => {
                            if (props.onSelect)
                                props.onSelect(key)
                        }}
                        fontSize={v.fontSize || undefined}
                    />;
                    offsetX += keyBaseSize * v.size + keyMargin;
                    return kx;
                })
                offsetY += keyBaseSize + keyMargin;
                return ky;
            })
        }
    </g>;
    offsetY = 0;
    const k_right = <g>
        {
            // Map rows
            (hidergo_split_keymap.keys_right as KeymapJsonFormat[][]).map((row, y) => {
                let offsetX = 0;
                // Cols
                const ky = row.map((v, x) => {
                    if(v.hidden === true) {
                        return null;
                    }
                    const kx = <EditorKey
                    keyObject={v}
                        x={props.width - (offsetX + keyBaseSize * (v.offX || 0) + (keyBaseSize * v.size))}
                        y={offsetY + keyBaseSize * (v.offY || 0)}
                        keyType={v.size}
                        key={"RK" + x + "_" + y}
                        rotation={v.rot}
                        selected={props.selected?.name === v.name}
                        onSelect={(key) => {
                            if (props.onSelect)
                                props.onSelect(key)
                        }}
                        fontSize={v.fontSize || undefined}
                    />;
                    offsetX += keyBaseSize * v.size + keyMargin;
                    return kx;
                })
                offsetY += keyBaseSize + keyMargin;
                return ky;
            })
        }
    </g>;

    return <g>
        {k_left}
        {k_right}
    </g>;
}

const layerNames = [
    "Default",
    "Arrow",
    "Bottom"
];


export default function KeymapEditor() {

    const ref = useRef<HTMLDivElement>(null);

    const [height, setHeight] = useState(0);
    const [width, setWidth] = useState(0);

    const [selectedKey, setSelectedKey] = useState<KeymapJsonFormat | null>(null);

    const [layer, setLayer] = useState<number>(0);

    const [keymap, setKeymap] = useState<number[][][]>([]);

    useEffect(() => {
        function handleResize() {
            if (ref.current) {
                setHeight(ref.current.clientHeight);
                setWidth(ref.current.clientWidth);
            }
        }
        window.addEventListener('resize', handleResize)

        getKeymap();
        
    }, [])

    function getKeymap () {
        if(Device.selectedDevice !== null) {
            Hidergod.instance?.request({
                cmd: HidergodCmd.APICMD_GET_KEYMAP,
                device: Device.selectedDevice.deviceInfo.device.serial
            }, (data) => {
                let msg = data as GetKeymapResponse;
                
                setKeymap(msg.keymap);

            })
        }
    }
    
    function saveKeymap (save: boolean) {
        if(Device.selectedDevice !== null) {
            console.log(keymap);
            Hidergod.instance?.request({
                cmd: HidergodCmd.APICMD_SET_KEYMAP,
                device: Device.selectedDevice.deviceInfo.device.serial,
                save: save,
                keymap: keymap
            }, (data) => {
                // Check status TODO:
            })

        }
    }

    function getKeymapBehaviour (index: number, layer: number) : ({ behaviour: string, value: number } | undefined) {
        if(layer < 0 || layer > keymap.length || index < 0 || index > keymap[layer].length) {
            return undefined;
        }
        const behaviour = getKeymapDeviceName(keymap[layer][index][0]);
        const value = keymap[layer][index][1];

        return { behaviour: behaviour || "", value };
    }

    let selBehaviour = undefined;
    if(selectedKey)
        selBehaviour = keymapBehaviour[getKeymapDeviceName(keymap[layer][selectedKey.pos][0]) || "TRANS"];

    let selValue = undefined;
    if(selBehaviour && selectedKey) {
        selValue = selBehaviour.values.find((e) => {
            if(e.val2) {
                return (keymap[layer][selectedKey.pos][1] & 0xFFFF) === e.value;
            }
            else {
                return keymap[layer][selectedKey.pos][1] === e.value;
            }
        });
    }
    
    return (
        <div style={{ width: '100vw', height: '100%', boxSizing: 'border-box', padding: 10, display: 'flex', flexDirection: 'column' }} ref={ref}>
            <Box sx={{display: 'inline-flex', width: '100%'}}>
                <Typography>Layer: </Typography>
                <Select onChange={(e) => { setLayer(e.target.value as number) }} value={layer}>
                    {
                        layerNames.map((e, i) => {
                            return <MenuItem value={i} key={"LAYER-SELECT" + i}>
                                {e}
                            </MenuItem>;
                        })
                    }
                </Select>
            </Box>
            <div style={{ minHeight: 450 }}>
                <svg width={window.innerWidth - 20} height={'100%'} viewBox={"0 0 " + String(window.innerWidth) + String(window.innerHeight)} xmlns="http://www.w3.org/2000/svg">
                    <Keyboard_hidergo_split width={window.innerWidth - 20} height={450} selected={selectedKey} onSelect={(key) => { setSelectedKey(key) }} />
                </svg>
            </div>
            <div style={{ flex: 1, borderTop: '1px solid #CCC', minHeight: 200 }}>
                {
                    !selectedKey &&
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ color: '#444', fontFamily: 'Inter', fontSize: '2em' }}>
                            Select a key
                        </div>
                    </div>
                }
                {
                    selectedKey &&
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ color: "#444", minHeight: 40, fontFamily: 'Inter', fontSize: '1em' }}>
                            Key: {selectedKey.name}
                        </div>
                        <div style={{ color: "#444", minHeight: 40, fontFamily: 'Inter', fontSize: '1em' }}>
                            Position: {selectedKey.pos}
                        </div>
                        <div style={{ color: "#444", minHeight: 40, fontFamily: 'Inter', fontSize: '1em' }}>
                            Current: {getKeymapDeviceName(keymap[layer][selectedKey.pos][0])} ({keymap[layer][selectedKey.pos][0]}), {keymap[layer][selectedKey.pos][1]}
                        </div>
                        <div style={{ color: "#444", minHeight: 40, fontFamily: 'Inter', fontSize: '1em' }}>
                            <Select value={keymap[layer][selectedKey.pos][0] & 0x7F}>
                                {
                                    Object.keys(keymapBehaviour).map((e, i) => {
                                        return <MenuItem value={getKeymapDeviceId(e) || 0} key={"BEH-SELECT" + i}>
                                            {keymapBehaviour[e].display}
                                        </MenuItem>;
                                    })
                                }
                            </Select>
                            {
                                (selBehaviour && selBehaviour.values.length > 0) &&
                                <Select value={selValue && selValue.val2 ? keymap[layer][selectedKey.pos][1] & 0xFFFF : keymap[layer][selectedKey.pos][1]}>
                                    {
                                        keymapBehaviour[getKeymapDeviceName(keymap[layer][selectedKey.pos][0]) || "TRANS"].values.map((e, i) => {
                                            return <MenuItem value={e.value} key={"VAL-SELECT" + i}>
                                                {e.name}
                                            </MenuItem>;
                                        })
                                    }
                                </Select>
                            }
                            {
                                (selValue && selValue.val2) &&
                                <TextField type={'number'} value={keymap[layer][selectedKey.pos][1] >> 16} />
                            }
                        </div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

                        </div>
                    </div>
                }
            </div>
        </div>
    )
}
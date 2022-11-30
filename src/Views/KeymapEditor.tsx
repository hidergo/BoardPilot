import React, { useEffect, useRef, useState } from "react"
import Device from "../Device";
import Hidergod, { HidergodCmd } from "../Hidergod";
import hidergo_split_keymap from '../Keymaps/hidergo_split_keymap.json'

type CustomKeyType = "isoenter" | "pot";

type SelectKeyCallback = (key: string | null) => any;

type EditorKeyProps = {
    name: string,
    text: string,
    subText: string,
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
    fontSize?: number
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
                            props.onSelect(props.selected ? null : props.name);
                    }}>

                </rect>
                <rect x={4} y={0} width={(keyBaseSize * keySize) - 8} height={keyBaseSize - 8} rx={keyBaseSize * 0.1} fill={'none'} stroke={'black'}>

                </rect>
                <text x={8} y={18} fontFamily='Inter' fontSize={fontSize} fill="black" pointerEvents={'none'}>
                    {props.text}
                </text>
                <text x={48*keySize} y={40} fontFamily='Inter' fontSize={fontSize*0.8} fill="black" pointerEvents={'none'} text-anchor="end">
                    {props.subText}
                </text>
            </g>
        </g>
    )
}

const Keyboard_hidergo_split = (props: { width: number, height: number, selected: string | null, onSelect?: SelectKeyCallback }) => {
    let offsetY = 0;
    const k_left = <g>
        {
            // Map rows
            (hidergo_split_keymap.keys_left as KeymapJsonFormat[][]).map((row, y) => {
                let offsetX = 0;
                // Cols
                const ky = row.map((v, x) => {
                    const kx = <EditorKey
                        text={v.dsp}
                        subText={v.dsp2 || ''}
                        x={offsetX + keyBaseSize * (v.offX || 0)}
                        y={offsetY + keyBaseSize * (v.offY || 0)}
                        keyType={v.size}
                        name={v.name}
                        key={"LK" + x + "_" + y}
                        rotation={v.rot}
                        selected={props.selected === v.name}
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
                    const kx = <EditorKey
                        text={v.dsp}
                        subText={v.dsp2 || ''}
                        x={props.width - (offsetX + keyBaseSize * (v.offX || 0) + (keyBaseSize * v.size))}
                        y={offsetY + keyBaseSize * (v.offY || 0)}
                        keyType={v.size}
                        name={v.name}
                        key={"RK" + x + "_" + y}
                        rotation={v.rot}
                        selected={props.selected === v.name}
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


export default function KeymapEditor() {

    const ref = useRef<HTMLDivElement>(null);

    const [height, setHeight] = useState(0);
    const [width, setWidth] = useState(0);

    const [selectedKey, setSelectedKey] = useState<string | null>(null);

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
    
    return (
        <div style={{ width: '100vw', height: '100%', boxSizing: 'border-box', padding: 10, display: 'flex', flexDirection: 'column' }} ref={ref}>
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
                            Key: {selectedKey}
                        </div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

                        </div>
                    </div>
                }
            </div>
        </div>
    )
}
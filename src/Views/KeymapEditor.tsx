import React, { useEffect, useRef, useState } from "react"
import hidergo_split_keymap from '../Keymaps/hidergo_split_keymap.json'

type CustomKeyType = "isoenter" | "pot";

type SelectKeyCallback = (key: string|null) => any;

type EditorKeyProps = {
    name: string,
    text: string, 
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
    size: number,
    rot?: number,
    offX?: number,
    offY?: number,
    fontSize?: number
}


const keySelectedColor = '#aaa';

let keyBaseSize = 40;
let keyMargin = 2;
let fontBaseSize = 25;

const EditorKey = (props: EditorKeyProps) => {

    const keySize = (typeof props.keyType === 'string' ? 1 : props.keyType) || 1;
    const rot = props.rotation || 0;
    const fontSize = props.fontSize ? props.fontSize * fontBaseSize : fontBaseSize;

    return (
        <g transform={`translate(${props.x},${props.y})`}>
            <g transform={`rotate(${rot})`}>
                <rect x={0} y={0} width={keyBaseSize * keySize} height={keyBaseSize} rx={keyBaseSize * 0.1} 
                        fill={props.selected ? keySelectedColor : 'white'} stroke={'black'} onClick={() => {
                            if(props.onSelect)
                                props.onSelect(props.selected ? null : props.name);
                        }}>
                    
                </rect>
                <rect x={4} y={0} width={(keyBaseSize * keySize) - 8} height={keyBaseSize - 8} rx={keyBaseSize * 0.1} fill={'none'} stroke={'black'}>
                    
                </rect>
                <text x={7} y={26} fontFamily='AlumniSansPinstripe' fontSize={fontSize} fill="black" pointerEvents={'none'}>
                    {props.text}
                </text>
            </g>
        </g>
    )
}

const Keyboard_hidergo_split = (props: {width: number, height: number, selected: string|null, onSelect?: SelectKeyCallback}) => {
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
                                    x={offsetX + keyBaseSize * (v.offX || 0)} 
                                    y={offsetY + keyBaseSize * (v.offY || 0)} 
                                    keyType={v.size} 
                                    name={v.name}
                                    key={"LK" + x + "_" + y} 
                                    rotation={v.rot}
                                    selected={props.selected === v.name}
                                    onSelect={(key) => {
                                        if(props.onSelect) 
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
                                    x={props.width - (offsetX + keyBaseSize * (v.offX || 0) + (keyBaseSize * v.size))} 
                                    y={offsetY + keyBaseSize * (v.offY || 0)} 
                                    keyType={v.size} 
                                    name={v.name}
                                    key={"RK" + x + "_" + y} 
                                    rotation={v.rot}
                                    selected={props.selected === v.name}
                                    onSelect={(key) => {
                                        if(props.onSelect) 
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


export default function KeymapEditor () {

    const ref = useRef<HTMLDivElement>(null);

    const [height, setHeight] = useState(0);
    const [width, setWidth] = useState(0);

    const [selectedKey, setSelectedKey] = useState<string|null>(null);

    useEffect(() => {
        if(ref.current) {
            setHeight(ref.current.offsetHeight);
            setWidth(ref.current.offsetWidth);
        }
      }, []);
    
    return (
        <div style={{width: '100%', height: '100%', boxSizing: 'border-box', padding: 10, display: 'flex', flexDirection: 'column'}} ref={ref}>
            <div style={{minHeight: 300}}>
                <svg width={width - 20} height={'100%'}>
                    <Keyboard_hidergo_split width={width - 20} height={height/2} selected={selectedKey} onSelect={(key) => {setSelectedKey(key)}}/>
                </svg>
            </div>
            <div style={{flex: 1, borderTop: '1px solid #CCC'}}>
                {
                    !selectedKey &&
                    <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <div style={{color: '#444', fontFamily: 'AlumniSansPinstripe', fontSize: '3em'}}>
                            Select a key
                        </div>
                    </div>
                }
                {
                    selectedKey &&
                    <div style={{display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{minHeight: 40}}>
                            Key: {selectedKey}
                        </div>
                        <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                            
                        </div>
                    </div>
                }
            </div>
        </div>
    )
}
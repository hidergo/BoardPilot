import { getKeymapDeviceName, keymapBehaviours} from "../misc/KeymapDefs";

type CustomKeyType = "isoenter" | "pot";

export type KeyDef = {
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

type EditorKeyProps = {
    keyObject: KeymapJsonFormat,
    x: number,
    y: number,
    selected: boolean,
    onSelect?: SelectKeyCallback,
    rebound?: boolean,
    keyType?: number | CustomKeyType,
    visibleText?: string,
    fontSize?: number,
    rotation?: number,
    disabled?: boolean
}

export type KeymapJsonFormat = {
    name: string,
    dsp: string,
    dsp2?: string,
    size: number,
    rot?: number,
    offX?: number,
    offY?: number,
    fontSize?: number,
    hidden?: boolean,
    pos: number,
    disabled?: boolean,
    defaults?: {
        device: string, 
        param1?: string,
        param2?: string
    }[]
}

export type KeymapDef = {
    // Keyboard name
    name: string,
    // Keyboard type
    type: string,
    layers: string[],
    // Keys
    keys?: KeymapJsonFormat[][],
    // SPLITKB: keys on left split
    keys_left?: KeymapJsonFormat[][],
    // SPLITKB: keys on right split
    keys_right?: KeymapJsonFormat[][],

};

export type SelectKeyCallback = (key: KeymapJsonFormat | null, target: SVGRectElement | null) => any;

export type KeyboardProps = {
    keymap: KeymapDef,
    reboundKeys?: KeyDef[],
    width: number, 
    height: number, 
    selected: KeymapJsonFormat | null, 
    layer: number,
    onSelect?: SelectKeyCallback
}


export default function Keymap (props: KeyboardProps) {
    switch(props.keymap.type) {
        case "KB":
            console.warn("Normal keyboard rendering not supported");
            return null;
        case "SPLITKB":
            return KeyboardSplit(props);
    }
    return null;
}

let keyBaseSize = 55;
let keyMargin = 2;
let fontBaseSize = 15;

const keySelectedColor = '#a6e3dc';
const keyReboundColor = '#b6e0d6';
const keyDisabledColor = '#aaaaaa';



const EditorKey = (props: EditorKeyProps) => {

    const keySize = (typeof props.keyType === 'string' ? 1 : props.keyType) || 1;
    const rot = props.rotation || 0;
    const fontSize = props.fontSize ? props.fontSize * fontBaseSize : fontBaseSize;

    let color = 'white';
    if(props.disabled) {
        color = keyDisabledColor;
    }
    else if(props.selected) {
        color = keySelectedColor;
    }
    else if(props.rebound) {
        color = keyReboundColor;
    }

    return (
        <g transform={`translate(${props.x},${props.y})`}>
            <g transform={`rotate(${rot})`}>
                <rect x={0} y={0} width={keyBaseSize * keySize} height={keyBaseSize} rx={keyBaseSize * 0.1}
                    fill={color} stroke={'black'} onClick={(e) => {
                        if (props.onSelect)
                            props.onSelect(props.selected ? null : props.keyObject, e.currentTarget);
                    }}>

                </rect>
                <rect x={4} y={0} width={(keyBaseSize * keySize) - 8} height={keyBaseSize - 8} rx={keyBaseSize * 0.1} fill={'none'} stroke={'black'}>

                </rect>
                <text x={8} y={18} fontFamily='Inter' fontSize={fontSize} fill="black" pointerEvents={'none'}>
                    {props.visibleText}
                </text>
            </g>
        </g>
    )
}

function KeyboardSplit (props: KeyboardProps) {
    let offsetY = 0;
    if(!props.keymap.keys_left || !props.keymap.keys_right) {
        console.warn("Expected split keyboard definition");
        return null;
    }

    const k_left = <g>
        {
            // Map rows
            (props.keymap.keys_left as KeymapJsonFormat[][]).map((row, y) => {
                let offsetX = 0;
                // Cols
                const ky = row.map((nv, x) => {
                    // Must do a copy so defaults are not overwritten
                    let v = {...nv, defaults: nv.defaults?.map(g => g)};

                    if(v.hidden === true) {
                        return null;
                    }
                    const rk = props.reboundKeys?.find(e => v.pos === e.key && e.layer === props.layer);
                    if(rk && v.defaults && v.defaults.length > rk.layer) {
                        v.defaults[rk.layer] = {
                            device: getKeymapDeviceName(rk.device) || "TRANS",
                            param1: '0x' + rk.param1.toString(16).padStart(8, '0'), // Convert to hex string
                            param2: '0x' + rk.param2.toString(16).padStart(8, '0'), // Convert to hex string
                        }
                    }
                    
                    let visibleText = "";
                    console.log(v)
                    console.log("layer", props.layer)
                    //@ts-ignore
                    if (v.defaults && v.defaults[props.layer] && v.defaults[props.layer].device && v.defaults[props.layer].param1 && v.defaults[props.layer].device != "MO") {
                        console.log("in loop")
                        let found = false;
                        for (let group of keymapBehaviours[v.defaults[props.layer].device].groups) {
                            for (let value of group.values) {
                                //@ts-ignore
                                console.log(value.value1.toString(16).padStart(8, '0'), v.defaults[props.layer].param1.replace(/^0x/, ''))
                                if (value.value1.toString(16).padStart(8, '0') === v.defaults[props.layer].param1.replace(/^0x/, '')) {
                                    visibleText = value.name;
                                    found = true;
                                    break;
                                }
                            }
                            if (found) break;
                        }
                    }
                    const kx = <EditorKey
                        keyObject={v}
                        x={offsetX + keyBaseSize * (v.offX || 0)}
                        y={offsetY + keyBaseSize * (v.offY || 0)}
                        keyType={v.size}
                        key={"LK" + x + "_" + y}
                        rotation={v.rot}
                        selected={props.selected?.name === v.name}
                        rebound={rk !== undefined}
                        disabled={v.disabled}
                        onSelect={(key, target) => {
                            if(v.disabled)
                                return;

                            if (props.onSelect)
                                props.onSelect(key, target)
                        }}
                        visibleText={visibleText}
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
            (props.keymap.keys_right as KeymapJsonFormat[][]).map((row, y) => {
                let offsetX = 0;
                // Cols
                const ky = row.map((nv, x) => {
                    // Must do a copy so defaults are not overwritten
                    let v = {...nv, defaults: nv.defaults?.map(g => g)};

                    if(v.hidden === true) {
                        return null;
                    }
                    const rk = props.reboundKeys?.find(e => v.pos === e.key && e.layer === props.layer);
                    if(rk && v.defaults && v.defaults.length > rk.layer) {
                        v.defaults[rk.layer] = {
                            device: getKeymapDeviceName(rk.device) || "TRANS",
                            param1: '0x' + rk.param1.toString(16).padStart(8, '0'), // Convert to hex string
                            param2: '0x' + rk.param2.toString(16).padStart(8, '0'), // Convert to hex string
                        }
                    }
                    
                    let visibleText = "";
                    console.log(v)
                    console.log("layer", props.layer)
                    //@ts-ignore
                    if (v.defaults && v.defaults[props.layer] && v.defaults[props.layer].device && v.defaults[props.layer].param1 && v.defaults[props.layer].device != "MO") {
                        console.log("in loop")
                        let found = false;
                        for (let group of keymapBehaviours[v.defaults[props.layer].device].groups) {
                            for (let value of group.values) {
                                //@ts-ignore
                                console.log(value.value1.toString(16).padStart(8, '0'), v.defaults[props.layer].param1.replace(/^0x/, ''))
                                if (value.value1.toString(16).padStart(8, '0') === v.defaults[props.layer].param1.replace(/^0x/, '')) {
                                    visibleText = value.name;
                                    found = true;
                                    break;
                                }
                            }
                            if (found) break;
                        }
                    }
                    const kx = <EditorKey
                    keyObject={v}
                        x={props.width - (offsetX + keyBaseSize * (v.offX || 0) + (keyBaseSize * v.size))}
                        y={offsetY + keyBaseSize * (v.offY || 0)}
                        keyType={v.size}
                        key={"RK" + x + "_" + y}
                        rotation={v.rot}
                        selected={props.selected?.name === v.name}
                        rebound={rk !== undefined}
                        disabled={v.disabled}
                        visibleText={visibleText}
                        onSelect={(key, target) => {
                            if(v.disabled)
                                return;

                            if (props.onSelect)
                                props.onSelect(key, target)
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
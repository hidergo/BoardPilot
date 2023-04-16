
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
        param1?: string | number,
        param2?: string | number
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
                    {props.keyObject.dsp}
                </text>
                <text x={48*keySize} y={40} fontFamily='Inter' fontSize={fontSize*0.8} fill="black" pointerEvents={'none'} textAnchor="end">
                    {props.keyObject.dsp2 || ''}
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
                        rebound={props.reboundKeys?.find(e => v.pos === e.layer * 70 + e.key) !== undefined}
                        disabled={v.disabled}
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
    offsetY = 0;
    const k_right = <g>
        {
            // Map rows
            (props.keymap.keys_right as KeymapJsonFormat[][]).map((row, y) => {
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
                        rebound={props.reboundKeys?.find(e => v.pos === e.layer * 70 + e.key) !== undefined}
                        disabled={v.disabled}
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
import { KeymapDef } from '../Components/Keyboard';
import dcmk1_ansi from '../Keymaps/hidergo/dcmk1/dcmk1_ansi.json'
import dcmk1_iso from '../Keymaps/hidergo/dcmk1/dcmk1_iso.json'
import corne_ansi from '../Keymaps/zmk/corne/corne_ansi.json'

export function getKeymapLayout (product: string) : KeymapDef {
    let keyboardVersion = localStorage.getItem('keyboardVersion');
    if(!keyboardVersion) {
        keyboardVersion = "ansi";
    }

    console.log(product);

    switch(product) {
        case "dcmk1":
            if(keyboardVersion === "ansi")
                return dcmk1_ansi as KeymapDef;
            else if(keyboardVersion === "iso") 
                return dcmk1_iso as KeymapDef;
            
            break;
        case "corne":
            if(keyboardVersion === "ansi" || keyboardVersion === "iso")
                return corne_ansi as KeymapDef;
                
        default:
            console.error(`Unknown product type ${product}`);
    }

    return dcmk1_ansi as KeymapDef;
}
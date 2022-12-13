
// Device names 
export const CONF_ID_DEVICE = [
    "TRANS",                    // 0
    "BCKLGHT",                  // 1
    "BLUETOOTH",                // 2
    "CAPS_WORD",                // 3
    "EXT_POWER",                // 4
    "GRAVE_ESCAPE",             // 5
    "KEY_PRESS",                // 6
    "KEY_REPEAT",               // 7
    "KEY_TOGGLE",               // 8
    "LAYER_TAP",                // 9
    "MAC_TAP",                  // 10
    "MAC_PRESS",                // 11
    "MAC_REL",                  // 12
    "MAC_TAP_TIME",             // 13
    "MAC_WAIT_TIME",            // 14
    "MAC_WAIT_REL",             // 15
    "MOD_TAP",                  // 16
    "MO",                       // 17
    "MOUSE_KEY_PRESS",          // 18
    "MOUSE_MOVE",               // 19
    "MOUSE_SCROLL",             // 20
    "NONE",                     // 21
    "OUTPUTS",                  // 22
    "RESET",                    // 23
    "BOOTLOAD",                 // 24
    "RGB_UG",                   // 25
    "ENC_KEY_PRESS",            // 26
    "STICKY_KEY",               // 27
    "STICKY_LAYER",             // 28
    "TO_LAYER",                 // 29
    "TOGGLE_LAYER",             // 30
];

/**
 * @brief Get keymap device/binding name from conf id
 * @param id 
 * @returns Keymap device name or undefined
 */
export const getKeymapDeviceName = (id: number) : string | undefined => {
    if((id & 0x7F) >= 0 && (id & 0x7F) < CONF_ID_DEVICE.length) {
        return CONF_ID_DEVICE[(id & 0x7F)];
    }

    return undefined;
}

/**
 * @brief Get keymap device ID from name
 * @param name 
 * @returns Keymap device id or undefined
 */
export const getKeymapDeviceId = (name: string) : number | undefined => {
    let ix = CONF_ID_DEVICE.findIndex(e => e === name);
    if(ix >= 0)
        return ix;

    return undefined;
}

type keymapBehaviourValue = { name: string, description?: string, value: number, val2?: boolean };

type keymapBehaviourType = { display: string, description: string, values: keymapBehaviourValue[] };

export const keymapBehaviour : {[key: string]: keymapBehaviourType} = {
    TRANS: {
        display: "Transparent",
        description: "Button press is passed to next layer",
        values: []
    },
    BLUETOOTH: {
        display: "Bluetooth",
        description: "Bluetooth actions",
        values: [
            { name: "Clear", description: "Clears the bluetooth pairings", value: 0 },
            { name: "Next", description: "Selects next bluetooth profile", value: 1 },
            { name: "Prev", description: "Selects previous bluetooth profile", value: 2 },
            { name: "Select", description: "Selects a bluetooth profile", value: 3, val2: true }, // Uses val2!!!
        ]
    },
    KEY_PRESS: {
        display: "Key press",
        description: "Key press handler",
        values: [
            { name: "A", value: 0x00070004 },
            { name: "B", value: 0x00070005 },
            { name: "C", value: 0x00070006 },
            { name: "D", value: 0x00070007 },
            { name: "E", value: 0x00070008 },
            { name: "F", value: 0x00070009 },
            { name: "G", value: 0x0007000A },
            { name: "H", value: 0x0007000B },
            { name: "I", value: 0x0007000C },
            { name: "J", value: 0x0007000D },
            { name: "K", value: 0x0007000E },
            { name: "L", value: 0x0007000F },
            { name: "M", value: 0x00070010 },
            { name: "N", value: 0x00070011 },
            { name: "O", value: 0x00070012 },
            { name: "P", value: 0x00070013 },
            { name: "Q", value: 0x00070014 },
            { name: "R", value: 0x00070015 },
            { name: "S", value: 0x00070016 },
            { name: "T", value: 0x00070017 },
            { name: "U", value: 0x00070018 },
            { name: "V", value: 0x00070019 },
            { name: "W", value: 0x0007001A },
            { name: "X", value: 0x0007001B },
            { name: "Y", value: 0x0007001C },
            { name: "Z", value: 0x0007001D },



        ]
    }
}
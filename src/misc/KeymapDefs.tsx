
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

type keymapBehaviourValue = { name: string, description?: string, value1: number, value2?: number, val1IsInput?: boolean, val2IsInput?: boolean };

type keymapBehaviourValueGroup = { name: string, groupValue?: number, values: keymapBehaviourValue[] };

type keymapBehaviourType = { display: string, description: string, groups: keymapBehaviourValueGroup[] };

export const keymapBehaviours : {[key: string]: keymapBehaviourType} = {
    TRANS: {
        display: "Transparent",
        description: "Button press is passed to next layer",
        groups: [
            { 
                name: "Default", 
                values: [
                    { name: "Transparent", description: "Button press is passed to next layer", value1: 0 }
                ] 
            }
        ]
    },
    BLUETOOTH: {
        display: "Bluetooth",
        description: "Bluetooth actions",
        groups: [
            {
                name: "Default",
                values: [
                    { name: "Clear", description: "Clears the current bluetooth profile", value1: 0 },
                    { name: "Next", description: "Selects next bluetooth profile", value1: 1 },
                    { name: "Prev", description: "Selects previous bluetooth profile", value1: 2 },
                    { name: "Select", description: "Selects a bluetooth profile", value1: 3, value2: 0, val2IsInput: true }
                ]
            }
            
        ]
    },
    KEY_PRESS: {
        display: "Key press",
        description: "Key press handler",
        groups: [
            {
                name: "Alphanumeric",
                values: [
                    { name: "A", value1: 0x00070004 },
                    { name: "B", value1: 0x00070005 },
                    { name: "C", value1: 0x00070006 },
                    { name: "D", value1: 0x00070007 },
                    { name: "E", value1: 0x00070008 },
                    { name: "F", value1: 0x00070009 },
                    { name: "G", value1: 0x0007000A },
                    { name: "H", value1: 0x0007000B },
                    { name: "I", value1: 0x0007000C },
                    { name: "J", value1: 0x0007000D },
                    { name: "K", value1: 0x0007000E },
                    { name: "L", value1: 0x0007000F },
                    { name: "M", value1: 0x00070010 },
                    { name: "N", value1: 0x00070011 },
                    { name: "O", value1: 0x00070012 },
                    { name: "P", value1: 0x00070013 },
                    { name: "Q", value1: 0x00070014 },
                    { name: "R", value1: 0x00070015 },
                    { name: "S", value1: 0x00070016 },
                    { name: "T", value1: 0x00070017 },
                    { name: "U", value1: 0x00070018 },
                    { name: "V", value1: 0x00070019 },
                    { name: "W", value1: 0x0007001A },
                    { name: "X", value1: 0x0007001B },
                    { name: "Y", value1: 0x0007001C },
                    { name: "Z", value1: 0x0007001D },
                    { name: "1", value1: 0x0007001E },
                    { name: "2", value1: 0x0007001F },
                    { name: "3", value1: 0x00070020 },
                    { name: "4", value1: 0x00070021 },
                    { name: "5", value1: 0x00070022 },
                    { name: "6", value1: 0x00070023 },
                    { name: "7", value1: 0x00070024 },
                    { name: "8", value1: 0x00070025 },
                    { name: "9", value1: 0x00070026 },
                    { name: "0", value1: 0x00070027 }
                ],
            },
            {
                name: "Modifier",
                values: [
                    { name: "Left Control", value1: 0x000700E0 },
                    { name: "Left Shift", value1: 0x000700E1 },
                    { name: "Left Alt", value1: 0x000700E2 },
                    { name: "Left GUI", value1: 0x000700E3 },
                    { name: "Right Control", value1: 0x000700E4 },
                    { name: "Right Shift", value1: 0x000700E5 },
                    { name: "Right Alt", value1: 0x000700E6 },
                    { name: "Right GUI", value1: 0x000700E7 },
                    { name: "App", value1: 0x00070065},
                ]
            },
            {
                name: "Function",
                values: [
                    { name: "F1", value1: 0x0007003A },
                    { name: "F2", value1: 0x0007003B },
                    { name: "F3", value1: 0x0007003C },
                    { name: "F4", value1: 0x0007003D },
                    { name: "F5", value1: 0x0007003E },
                    { name: "F6", value1: 0x0007003F },
                    { name: "F7", value1: 0x00070040 },
                    { name: "F8", value1: 0x00070041 },
                    { name: "F9", value1: 0x00070042 },
                    { name: "F10", value1: 0x00070043 },
                    { name: "F11", value1: 0x00070044 },
                    { name: "F12", value1: 0x00070045 },
                    { name: "F13", value1: 0x00070068 },
                    { name: "F14", value1: 0x00070069 },
                    { name: "F15", value1: 0x0007006A },
                    { name: "F16", value1: 0x0007006B },
                    { name: "F17", value1: 0x0007006C },
                    { name: "F18", value1: 0x0007006D },
                    { name: "F19", value1: 0x0007006E },
                    { name: "F20", value1: 0x0007006F },
                    { name: "F21", value1: 0x00070070 },
                    { name: "F22", value1: 0x00070071 },
                    { name: "F23", value1: 0x00070072 },
                    { name: "F24", value1: 0x00070073 }
                ]
            },
            {
                name: "Special",
                values: [
                    { name: "-", value1: 0x0007002D },
                    { name: "=", value1: 0x0007002E },
                    { name: "[", value1: 0x0007002F },
                    { name: "]", value1: 0x00070030 },
                    { name: "\\", value1: 0x00070031 },
                    { name: "#", value1: 0x00070032 },
                    { name: ";", value1: 0x00070033 },
                    { name: "'", value1: 0x00070034 },
                    { name: "`", value1: 0x00070035 },
                    { name: ",", value1: 0x00070036 },
                    { name: ".", value1: 0x00070037 },
                    { name: "/", value1: 0x00070038 },
                ]
            },
            {
                name: "Editing",
                values: [
                    { name: "Enter", value1: 0x00070028 },
                    { name: "Escape", value1: 0x00070029 },
                    { name: "Backspace", value1: 0x0007002A },
                    { name: "Delete", value1: 0x0007004C },
                    { name: "Tab", value1: 0x0007002B },
                    { name: "Space", value1: 0x0007002C },
                    { name: "Caps lock", value1: 0x00070039 },
                    { name: "Insert", value1: 0x00070049 }
                ]
            },
            {
                name: "Media",
                values: [
                    { name: "Mute", value1: 0x000C00E2},
                    { name: "Previous", value1: 0x000C00B6},
                    { name: "Next", value1: 0x000C00B7},
                    { name: "Play/Pause", value1: 0x000C00CD}
                ]
            },
            {
                name: "Navigation",
                values: [
                    { name: "Home", value1: 0x0007004A},
                    { name: "End", value1: 0x0007004D},
                    { name: "Page up", value1: 0x0007004B},
                    { name: "Page down", value1: 0x0007004E},
                    { name: "Right arrow", value1: 0x0007004F},
                    { name: "Left arrow", value1: 0x00070050},
                    { name: "Down arrow", value1: 0x00070051},
                    { name: "Up arrow", value1: 0x00070052}

                ]
            },
            {
                name: "System keys",
                values: [
                    { name: "Num Lock", value1: 0x00070053 },
                    { name: "Print Screen", value1: 0x00070046 },
                    { name: "Pause Break", value1: 0x00070048 },
                ]
            },
            {
                name: "Numpad",
                values: [
                    { name: "Numpad /", value1: 0x00070054 },
                    { name: "Numpad *", value1: 0x00070055 },
                    { name: "Numpad -", value1: 0x00070056 },
                    { name: "Numpad +", value1: 0x00070057 },
                    { name: "Numpad Enter", value1: 0x00070058 },
                    { name: "Numpad 1", value1: 0x00070059 },
                    { name: "Numpad 2", value1: 0x0007005A },
                    { name: "Numpad 3", value1: 0x0007005B },
                    { name: "Numpad 4", value1: 0x0007005C },
                    { name: "Numpad 5", value1: 0x0007005D },
                    { name: "Numpad 6", value1: 0x0007005E },
                    { name: "Numpad 7", value1: 0x0007005F },
                    { name: "Numpad 8", value1: 0x00070060 },
                    { name: "Numpad 9", value1: 0x00070061 },
                    { name: "Numpad 0", value1: 0x00070062 },
                    { name: "Numpad .", value1: 0x00070063 }
                ],
            },
        ]
    },
    MO: {
        display: "Momentary layer",
        description: "Momentarily toggle a layer",
        groups: [
            {
                name: "Default",
                values: [
                    { name: "Default", description: "Set default layer", value1: 0 },
                    { name: "Arrow", description: "Set arrow layer", value1: 1 },
                    { name: "Bottom", description: "Set bottom layer", value1: 2 },

                ]
            }
            
        ]
    },
    RESET: {
        display: "Reset",
        description: "Reset",
        groups: [
            {
                name: "Default",
                values: [
                    { name: "Reset", description: "Resets the device", value1: 0 },
                ]
            }
            
        ]
    },
    BOOTLOAD: {
        display: "Bootloader",
        description: "Bootloader",
        groups: [
            {
                name: "Default",
                values: [
                    { name: "Bootloader", description: "Trigger bootloader mode", value1: 0 },
                ]
            }
            
        ]
    },
}
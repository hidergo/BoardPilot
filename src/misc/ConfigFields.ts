

export enum ConfigField {
    // Invalid key
    ZMK_CONFIG_KEY_INVALID =                0x0000,
    // --------------------------------------------------------------
    // 0x0001 - 0x3FFF: (Recommended) saveable fields
    // Fields that should be saved to NVS, such as keymap or mouse sensitivity
    // --------------------------------------------------------------

    // 0x0001 - 0x0009: Device information fields
    // Device info (struct zmk_config_device_info)
    ZMK_CONFIG_KEY_DEVICE_INFO =            0x0001,
    // 0x000A - 0x001F: Device configuration
    // Sleep timeout (u16) (0 = never sleep)
    ZMK_CONFIG_KEY_SLEEP_TIMEOUT =          0x000A,
    // Peripheral sleep timeout (u16) (0 = never sleep)
    ZMK_CONFIG_KEY_PERIPHERAL_SLEEP_TIMEOUT = 0x000B,


    // 0x0020 - 0x003F: Keyboard configurations 
    // Keymap
    ZMK_CONFIG_KEY_KEYMAP =                 0x0020,

    // 0x0040 - 0x005F: Mouse/trackpad configurations
    // Mouse sensitivity (u8)
    ZMK_CONFIG_KEY_MOUSE_SENSITIVITY =      0x0040,
    // Mouse Y scroll sensitivity (u8)
    ZMK_CONFIG_KEY_SCROLL_SENSITIVITY =     0x0041,
    // Mouse X pan sensitivity (u8)
    ZMK_CONFIG_KEY_PAN_SENSITIVITY =        0x0042,
    // Mouse scroll direction (u8)
    ZMK_CONFIG_KEY_SCROLL_DIRECTION =       0x0043,
    // Touchpad click type (u8) (0 = normal, 1 = left click on left side, right click on right side)
    ZMK_CONFIG_KEY_TP_CLICK_TYPE =          0x0044,

    // 0x0060 - 0x007F: Display configurations
    ZMK_CONFIG_KEY_DISPLAY_CODE =           0x0060,

    // --------------------------------------------------------------
    // 0x4000 - 0x7FFF: (Recommended) Non-saved fields
    // Fields that do not require saving to NVS, such as time or date
    // --------------------------------------------------------------

    // (int32_t[2]) [0] Unix timestamp of time, [1] timezone in seconds
    ZMK_CONFIG_KEY_DATETIME =               0x4000,


    // --------------------------------------------------------------
    // 0x8000 - 0xFFFF: Custom fields
    // Fields that should be used if custom fields are needed
    // --------------------------------------------------------------
    
    // hid:ergo device specific fields
    // IQS5XX register configuration
    ZMK_CONFIG_CUSTOM_IQS5XX_REGS =         0x6001,
}

/**
 * @brief Converts hex string to bytes
 * @param hex 
 * @returns 
 */
export function hexToBytes(hex: string) : Uint8Array {
    let bytes = [];
    for (let c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));

    return new Uint8Array(bytes);
}

/**
 * @brief Converts bytes to hex string
 * @param hex 
 * @returns 
 */
export function bytesToHex(bytes: Uint8Array) : string {
    let hex = [];
    for (let i = 0; i < bytes.length; i++) {
        let current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
        hex.push((current >>> 4).toString(16));
        hex.push((current & 0xF).toString(16));
    }
    return hex.join("");
}
import { ConfigField } from './ConfigFields';
import { DeviceInfo } from './Device';


/**
 * @brief Command list
 */
export enum HidergodCmd {
    APICMD_REGISTER =       0x01,
    APICMD_DEVICES =        0x10,

    // Generic write to the device
    APICMD_ZMK_CONTROL_WRITE =  0x40,
    APICMD_ZMK_CONTROL_READ =   0x41,

    // Events
    APICMD_EVENT =          0x80
}

export enum ApiEventType {
    APIEVENT_NONE,
    APIEVENT_DEVICE_CONNECTED,
    APIEVENT_DEVICE_DISCONNECTED
}

export namespace HidergodMsg {
    /**
     * @brief Default request structure
     */
    export type request = {
        cmd: HidergodCmd,
        // reqid is set in Hidergod.request() function so not needed here
        //reqid: number
    }
    /**
     * @brief Default response structure
     */
    export type response = {
        cmd: HidergodCmd,
        status: boolean,
        reqid: number
    }

    // Messages

    /**
     * @brief Registration request message. Not derived from request
     */
    export interface registerRequest {
        cmd: HidergodCmd.APICMD_REGISTER,
        key: string
    }
    /**
     * @brief Registration response message. Not derived from response
     */
    export interface registerResponse {
        cmd: HidergodCmd.APICMD_REGISTER,
        status: boolean
    }

    /**
     * @brief Request devices
     */
    export interface devicesRequest extends request {
        cmd: HidergodCmd.APICMD_DEVICES
    }
    /**
     * @brief Request devices response
     */
    export interface devicesResponse extends response {
        cmd: HidergodCmd.APICMD_DEVICES,
        devices: DeviceInfo[]
    }
    
    /**
     * @brief Write to zmk_config request
     */
    export interface controlWriteRequest extends request {
        cmd: HidergodCmd.APICMD_ZMK_CONTROL_WRITE,
        device: string,
        field: ConfigField,
        save: boolean,
        // Sent as hex string
        data: string
    }
    /**
     * @brief Write to zmk_config response
     */
    export interface controlWriteResponse extends response {
        cmd: HidergodCmd.APICMD_ZMK_CONTROL_WRITE,
        device: string,
        field: ConfigField
    }

    /**
     * @brief Read from zmk_config request
     */
    export interface controlReadRequest extends request {
        cmd: HidergodCmd.APICMD_ZMK_CONTROL_READ,
        device: string,
        field: ConfigField
    }
    /**
     * @brief Read from zmk_config response
     */
    export interface controlReadResponse extends response {
        cmd: HidergodCmd.APICMD_ZMK_CONTROL_READ,
        device: string,
        field: ConfigField,
        // Received as hex string
        data: string
    }

    /**
     * @brief Event response
     */
    export interface eventResponse {
        cmd: HidergodCmd.APICMD_EVENT,
        type: ApiEventType,
        device: DeviceInfo
    }

}
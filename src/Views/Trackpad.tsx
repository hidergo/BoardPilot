import { Button, Card, Checkbox, Input, Slider, TextField, Tooltip, Typography } from "@mui/material";
import { Box, Container } from "@mui/system";
import React from "react";
import Device from "../Device";
import Hidergod, { HidergodCmd } from "../Hidergod";

/*
    // Refresh rate when the device is active (ms interval)
    uint16_t    activeRefreshRate;
    // Refresh rate when the device is idling (ms interval)
    uint16_t    idleRefreshRate;
    // Which single finger gestures will be enabled
    uint8_t     singleFingerGestureMask;
    // Which multi finger gestures will be enabled
    uint8_t     multiFingerGestureMask;
    // Tap time in ms
    uint16_t    tapTime;
    // Tap distance in pixels
    uint16_t    tapDistance;
    // Touch multiplier
    uint8_t     touchMultiplier;
    // Prox debounce value
    uint8_t     debounce;
    // i2c timeout in ms
    uint8_t     i2cTimeout;
    // Filter settings
    uint8_t     filterSettings;
    uint8_t     filterDynBottomBeta;
    uint8_t     filterDynLowerSpeed;
    uint16_t    filterDynUpperSpeed;

    // Initial scroll distance (px)
    uint16_t    initScrollDistance;

    regconf.activeRefreshRate =         10;
    regconf.idleRefreshRate =           50;
    regconf.singleFingerGestureMask =   GESTURE_SINGLE_TAP | GESTURE_TAP_AND_HOLD;
    regconf.multiFingerGestureMask =    GESTURE_TWO_FINGER_TAP | GESTURE_SCROLLG;
    regconf.tapTime =                   150;
    regconf.tapDistance =               25;
    regconf.touchMultiplier =           0;
    regconf.debounce =                  0;
    regconf.i2cTimeout =                4; 
    regconf.filterSettings =            MAV_FILTER | IIR_FILTER;
    regconf.filterDynBottomBeta =        5;
    regconf.filterDynLowerSpeed =        6;
    regconf.filterDynUpperSpeed =        512;

    regconf.initScrollDistance =        25;
*/

type TrackpadRegsMessage = {
    cmd:    0x40,
    device: string,
    save:   boolean,
    regs: {
        activeRefreshRate?:         number,
        idleRefreshRate?:           number,
        singleFingerGestureMask?:   number,
        multiFingerGestureMask?:    number,
        tapTime?:                   number,
        tapDistance?:               number,
        touchMultiplier?:           number,
        debounce?:                  number,
        i2cTimeout?:                number,
        filterSettings?:            number,
        filterDynBottomBeta?:       number,
        filterDynLowerSpeed?:       number,
        filterDynUpperSpeed?:       number
    }
}

type TrackpadRegsResponse = {
    cmd:    0x40,
    status: boolean,
    reqid:  number
}

type TrackpadConfValue = {
    name: string, 
    title: string, 
    type: 'slider'|'number'|'checkbox'|'checkboxgroup',
    tooltip: string, 
    range?: {max: number, min: number},
    default: number,
    labels?: string[]
};

const TrackpadConfValuesRaw : TrackpadConfValue[] = [
    {
        name:       "activeRefreshRate",
        title:      "Active refresh rate (u16)",
        type:       "slider",
        tooltip:    "Delay in ms between trackpad refreshes (Active mode)",
        range: {
            min: 1,
            max: 100
        },
        default: 10
    },
    {
        name:       "idleRefreshRate",
        title:      "Idle refresh rate (u16)",
        type:       "slider",
        tooltip:    "Delay in ms between trackpad refreshes (Idle mode)",
        range: {
            min: 1,
            max: 500
        },
        default: 50
    },
    {
        name:       "singleFingerGestureMask",
        title:      "Single finger gestures (u8)",
        type:       "checkboxgroup",
        tooltip:    "Single finger gestures",
        default: 0b11, // Single tap, tap and hold
        labels: ["Single tap", "Tap & hold", "Swipe X-", "Swipe X+", "Swipe Y+", "Swipe Y-"]
    },
    {
        name:       "multiFingerGestureMask",
        title:      "Multi finger gestures (u8)",
        type:       "checkboxgroup",
        tooltip:    "Multi finger gestures",
        default: 0b11, // 2 finger tap, Scroll
        labels: ["2 finger tap", "Scroll", "Zoom"]
    },
    {
        name:       "tapTime",
        title:      "Tap time (u16)",
        type:       "slider",
        tooltip:    "Maximum time for finger press to be considered as tap event",
        range: {
            min: 0,
            max: 300
        },
        default: 150
    },
    {
        name:       "tapDistance",
        title:      "Tap distance (u16)",
        type:       "slider",
        tooltip:    "Maximum distance for finger to travel when tapping",
        range: {
            min: 5,
            max: 100
        },
        default: 25
    },
    {
        name:       "touchMultiplier",
        title:      "Touch multiplier (u8)",
        type:       "slider",
        tooltip:    "Multiplier for touch sensitivity(?)",
        range: {
            min: 0,
            max: 100
        },
        default: 0
    },
    {
        name:       "debounce",
        title:      "Debounce (u8)",
        type:       "slider",
        tooltip:    "Proximity debounce value",
        range: {
            min: 0,
            max: 100
        },
        default: 0
    },
    {
        name:       "i2cTimeout",
        title:      "I2C timeout (u8)",
        type:       "slider",
        tooltip:    "Timeout for i2c in ms",
        range: {
            min: 0,
            max: 100
        },
        default: 4
    },
    {
        name:       "filterSettings",
        title:      "Filter settings (u8)",
        type:       "checkboxgroup",
        tooltip:    "Touch filter options",
        default:    0b11, // MAV, IIR
        labels: ["IIR Dynamic", "MAV Filter", "IIR Static", "ALP Count"]
    },
    {
        name:       "filterDynBottomBeta",
        title:      "Dynamic bottom beta (u8)",
        type:       "slider",
        tooltip:    "IIR filter bottom beta",
        range: {
            min: 0,
            max: 255
        },
        default: 5
    },
    {
        name:       "filterDynLowerSpeed",
        title:      "Dynamic lower speed (u8)",
        type:       "slider",
        tooltip:    "IIR filter minimum speed",
        range: {
            min: 0,
            max: 255
        },
        default: 5
    },
    {
        name:       "filterDynUpperSpeed",
        title:      "Dynamic upper speed (u16)",
        type:       "slider",
        tooltip:    "IIR filter maximum speed",
        range: {
            min: 0,
            max: 768
        },
        default: 512
    },
    {
        name:       "initScrollDistance",
        title:      "Initial scroll distance",
        type:       "slider",
        tooltip:    "Minimum distance travelled until scrolling",
        range: {
            min: 0,
            max: 255
        },
        default: 25
    }
];

export default function Trackpad () {

    const [rawValues, setRawValues] = React.useState(TrackpadConfValuesRaw.map(e => {return {name: e.name, value: e.default}}));


    function handleRawValueChange (name: string, newValue: number) {

        const newRawValues = rawValues.map((v, i) => {
            if(v.name === name) {
                return {name: name, value: newValue};
            }
            else {
                return v;
            }
        })

        setRawValues(newRawValues);
    }

    function handleRawValueChangeBit (name: string, newValue: number, bit: number) {

        const newRawValues = rawValues.map((v, i) => {
            if(v.name === name) {
                return {name: name, value: newValue === 0 ? (v.value & ~(1 << bit)) : (v.value | (1 << bit))};
            }
            else {
                return v;
            }
        })

        setRawValues(newRawValues);
    }

    function saveValues (saveNvm: boolean = false) {
        if(Device.selectedDevice === null)
            return;

        let regs : { [key: string]: number } = {};
        rawValues.forEach((e, i) => {
            regs[e.name] = e.value;
        })
        Hidergod.instance?.request({
            cmd: HidergodCmd.APICMD_SET_IQS_REGS,
            device: Device.selectedDevice?.deviceInfo.device.serial,
            save: saveNvm,
            regs: regs
        } as TrackpadRegsMessage, (data) => {
            // Response
        })
    }

    return <Container sx={{paddingTop: 1}}>
        <Card sx={{padding: 2}}>
            <Typography variant="h5" sx={{paddingBottom: 3}}>IQS5XX raw register values</Typography>

            {
                rawValues.map((e, i) => {
                    const z = TrackpadConfValuesRaw[i];
                    return <Box key={"trackpad-conf-raw-" + i}>
                        <Tooltip title={z.tooltip} placement="bottom-start" enterDelay={500}>
                            <Typography variant="subtitle1">{z.title}</Typography>
                        </Tooltip>
                        {
                            z.type === "checkbox" &&
                            <Checkbox 
                                checked={e.value === 1} 
                                onChange={(x) => {handleRawValueChange(e.name, x.target.checked ? 1 : 0)}} 
                            />
                        }
                        {
                            z.type === "checkboxgroup" &&
                            <Box display={'inline-flex'}>
                                {
                                    z.labels &&
                                    z.labels.map((le, li) => {
                                        return <Box key={"checkbox-" + le} sx={{marginRight: 1}}>
                                            <Typography variant="subtitle2">{le}</Typography>
                                            <Checkbox 
                                                checked={((e.value >> li) & 1) === 1} 
                                                onChange={(x) => {handleRawValueChangeBit(e.name, x.target.checked ? 1 : 0, li)}} />
                                        </Box>
                                    })
                                }
                                
                            </Box>
                        }
                        {
                            z.type === "number" &&
                            <TextField 
                                value={e.value} 
                                type={"number"} 
                                inputProps={{min: z.range?.min || 0, max: z.range?.max || 0, step: 1}} 
                                onChange={(x) => {handleRawValueChange(e.name, parseInt(x.target.value))}}
                            />
                        }
                        {
                            z.type === "slider" &&
                            <Box sx={{display: 'inline-flex', width: '100%'}}>
                                <Slider 
                                    value={e.value} 
                                    step={1} 
                                    min={z.range?.min || 0} 
                                    max={z.range?.max || 0} 
                                    sx={{marginRight: 1}}
                                    onChange={(_x, n) => {handleRawValueChange(e.name, n as number)}}
                                />
                                <TextField 
                                    value={e.value} 
                                    type={"number"} 
                                    inputProps={{min: z.range?.min || 0, max: z.range?.max || 0, step: 1}} 
                                    onChange={(x) => {handleRawValueChange(e.name, parseInt(x.target.value))}}
                                />
                            </Box>
                        }
                    </Box>
                })
            }
            <Button onClick={() => {saveValues(false)}}>Apply</Button>
        </Card>
    </Container>;
}
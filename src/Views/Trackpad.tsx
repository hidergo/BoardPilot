import { Button, Card, Checkbox, Input, Slider, TextField, Tooltip, Typography } from "@mui/material";
import { Box, Container } from "@mui/system";
import React, { useEffect } from "react";
import Device from "../Device";
import Hidergod, { HidergodCmd } from "../Hidergod";

type TrackpadSetRegsMessage = {
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
        filterDynUpperSpeed?:       number,
        initScrollDistance?:        number
    }
}

type TrackpadGetRegsResponse = {
    cmd:    0x41,
    status:   boolean,
    regs?: {
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
        filterDynUpperSpeed?:       number,
        initScrollDistance?:        number

    },
    reqid:  number
}

type TrackpadSetRegsResponse = {
    cmd:    0x40,
    status: boolean,
    reqid:  number
}

type TrackpadSetSensitivityResponse = {
    cmd:    0x24,
    status: boolean,
    reqid: number
}

type TrackpadGetSensitivityResponse = {
    cmd:    0x25,
    status: boolean,
    sensitivity: number,
    reqid: number
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

const TrackpadConfDefault = TrackpadConfValuesRaw.map(e => {return {name: e.name, value: e.default}});

export default function Trackpad () {

    const [rawValues, setRawValues] = React.useState(TrackpadConfValuesRaw.map(e => {return {name: e.name, value: e.default}}));

    const [sensitivity, setSensitivity] = React.useState(128);

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
        } as TrackpadSetRegsMessage, (data) => {
            // Response
        })
    }

    function saveSensitivity (saveNvm: boolean = false) {
        Hidergod.instance?.request({
            cmd: HidergodCmd.APICMD_SET_MOUSE_SENS,
            device: Device.selectedDevice?.deviceInfo.device.serial,
            sensitivity: sensitivity,
            save: saveNvm
        }, (data) => {
            const msg = data as TrackpadSetSensitivityResponse;
            if(msg.status) {
                
            }
        })
    }

    function getSensitivity () {
        Hidergod.instance?.request({
            cmd: HidergodCmd.APICMD_GET_MOUSE_SENS,
            device: Device.selectedDevice?.deviceInfo.device.serial
        }, (data) => {
            const msg = data as TrackpadGetSensitivityResponse;
            if(msg.status) {
                setSensitivity(msg.sensitivity);
            }
        })
    }

    function getValues () {
        if(Device.selectedDevice === null) 
            return;

        Hidergod.instance?.request({
            cmd: HidergodCmd.APICMD_GET_IQS_REGS,
            device: Device.selectedDevice?.deviceInfo.device.serial
        }, (data) => {
            const msg = data as TrackpadGetRegsResponse;
            const newRawValues = [...rawValues];
            if(msg.status) {

                if(msg.regs) {
                    Object.keys(msg.regs).forEach(key => {
                        if(msg.regs) {
                            let value = msg.regs[key as keyof typeof msg.regs];
                            if(value !== undefined) {
                                let vindex = newRawValues.findIndex(e => e.name === key); 
                                if(vindex >= 0) {
                                    newRawValues[vindex].value = value;
                                }
                                setRawValues(newRawValues);
                            }
                        }
                    });
                }
            }
        })

        
    }

    useEffect(() => {
        getValues();
        getSensitivity();
    }, []);

    return <Container sx={{paddingTop: 1}}>
        <Card>
            <Typography variant="h5" sx={{paddingBottom: 3}}>Touchpad sensitivity</Typography>
            <Box sx={{display: 'inline-flex', width: '100%'}}>
                <Slider 
                    value={sensitivity} 
                    step={1} 
                    min={0} 
                    max={255} 
                    sx={{marginRight: 1}}
                    onChange={(_x, n) => {setSensitivity(n as number)}}
                />
                <TextField 
                    value={sensitivity} 
                    type={"number"} 
                    inputProps={{min: 0, max: 255}} 
                    onChange={(x) => {setSensitivity(parseInt(x.target.value))}}
                />
            </Box>
            <Button onClick={() => {saveSensitivity(false)}}>Apply</Button>
            <Button onClick={() => {saveSensitivity(true)}}>Apply and save</Button>
        </Card>
        <Card sx={{padding: 2}}>
            <Typography variant="h5" sx={{paddingBottom: 3}}>IQS5XX raw register values</Typography>
            <Button onClick={() => {setRawValues([...TrackpadConfDefault])}}>Reset to default</Button>

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
            <Button onClick={() => {saveValues(true)}}>Apply and save</Button>

        </Card>
        
    </Container>;
}
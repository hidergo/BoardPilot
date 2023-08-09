import { Alert, Button, Card, Checkbox, Divider, Input, Slider, Snackbar, TextField, Tooltip, Typography } from "@mui/material";
import { Box, Container } from "@mui/system";
import React, { useEffect } from "react";
import { ConfigField } from "../misc/ConfigFields";
import Device from "../misc/Device";
import BoardPilotService from "../misc/BoardPilotService";
import { BoardPilotServiceMsg } from "../misc/BoardPilotServiceMsg";
import { colorPalette } from "../Styles/Colors";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import IosShareIcon from '@mui/icons-material/IosShare';
import CachedIcon from '@mui/icons-material/Cached';

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

const sliderStyle = {
    marginRight: 1, 
    paddingTop: 5
}

export default function Trackpad () {

    const [rawValues, setRawValues] = React.useState(TrackpadConfValuesRaw.map(e => {return {name: e.name, value: e.default}}));
    const [sensitivity, setSensitivity] = React.useState(128);
    const [devMenuOpen, setDevMenuOpen] = React.useState(false);

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

    function getRawValue (name: string) : number {
        return rawValues.find(e => e.name === name)?.value || 0;
    }

    function writeConfigIQS5XXRegs (save: boolean) {

        if(!Device.selectedDevice)
            return;

        let data = new Uint8Array(20);
        let dv = new DataView(data.buffer);

        // uint16_t    activeRefreshRate;
        dv.setUint16(0, getRawValue("activeRefreshRate"), true);
        // uint16_t    idleRefreshRate;
        dv.setUint16(2, getRawValue("idleRefreshRate"), true);
        //uint8_t     singleFingerGestureMask;
        dv.setUint8(4, getRawValue("singleFingerGestureMask"));
        // uint8_t     multiFingerGestureMask;
        dv.setUint8(5, getRawValue("multiFingerGestureMask"));
        // uint16_t    tapTime;
        dv.setUint16(6, getRawValue("tapTime"), true);
        // uint16_t    tapDistance;
        dv.setUint16(8, getRawValue("tapDistance"), true);
        // uint8_t     touchMultiplier;
        dv.setUint8(10, getRawValue("touchMultiplier"));
        // uint8_t     debounce;
        dv.setUint8(11, getRawValue("debounce"));
        // uint8_t     i2cTimeout;
        dv.setUint8(12, getRawValue("i2cTimeout"));
        // uint8_t     filterSettings;
        dv.setUint8(13, getRawValue("filterSettings"));
        // uint8_t     filterDynBottomBeta;
        dv.setUint8(14, getRawValue("filterDynBottomBeta"));
        // uint8_t     filterDynLowerSpeed;
        dv.setUint8(15, getRawValue("filterDynLowerSpeed"));
        // uint16_t    filterDynUpperSpeed;
        dv.setUint16(16, getRawValue("filterDynUpperSpeed"), true);
        // uint16_t    initScrollDistance
        dv.setUint16(18, getRawValue("initScrollDistance"), true);


        BoardPilotService.instance?.writeConfig(
            Device.selectedDevice, 
            ConfigField.ZMK_CONFIG_CUSTOM_IQS5XX_REGS, 
            data,
            save,
            (resp) => {
                if(resp.status) {
                    // Ok
                }
                else {
                    // Fail
                }
            }
        );
    }

    function readConfigIQS5XXRegs () {
        if(!Device.selectedDevice)
            return;

        BoardPilotService.instance?.readConfig(
            Device.selectedDevice, 
            ConfigField.ZMK_CONFIG_CUSTOM_IQS5XX_REGS,
            (resp) => {
                if(resp.status) {
                    if(resp.data.length < 20)
                        return;

                    // Ok
                    let rv = [...rawValues];

                    const setRv = (name: string, value: number) => {
                        const i = rv.findIndex(e => e.name === name);
                        if(i >= 0)
                            rv[i].value = value;
                    }

                    let dv = new DataView(resp.data.buffer);

                    // uint16_t    activeRefreshRate;
                    setRv("activeRefreshRate", dv.getUint16(0, true));
                    // uint16_t    idleRefreshRate;
                    setRv("idleRefreshRate", dv.getUint16(2, true));
                    //uint8_t     singleFingerGestureMask;
                    setRv("singleFingerGestureMask", dv.getUint8(4));
                    // uint8_t     multiFingerGestureMask;
                    setRv("multiFingerGestureMask", dv.getUint8(5));
                    // uint16_t    tapTime;
                    setRv("tapTime", dv.getUint16(6, true));
                    // uint16_t    tapDistance;
                    setRv("tapDistance", dv.getUint16(8, true));
                    // uint8_t     touchMultiplier;
                    setRv("touchMultiplier", dv.getUint8(10));
                    // uint8_t     debounce;
                    setRv("debounce", dv.getUint8(11));
                    // uint8_t     i2cTimeout;
                    setRv("i2cTimeout", dv.getUint8(12));
                    // uint8_t     filterSettings;
                    setRv("filterSettings", dv.getUint8(13));
                    // uint8_t     filterDynBottomBeta;
                    setRv("filterDynBottomBeta", dv.getUint8(14));
                    // uint8_t     filterDynLowerSpeed;
                    setRv("filterDynLowerSpeed", dv.getUint8(15));
                    // uint16_t    filterDynUpperSpeed;
                    setRv("filterDynUpperSpeed", dv.getUint16(16, true));
                    // uint16_t    initScrollDistance
                    setRv("initScrollDistance", dv.getUint16(18, true));

                    setRawValues(rv);
                }
                else {
                    // Fail
                }
            }
        );
    }

    function writeConfigMouseSensitivity (save: boolean) {
        if(!Device.selectedDevice)
            return;

        let data = new Uint8Array(1);
        let dv = new DataView(data.buffer);

        // uint8_t      mouseSensitivity;
        dv.setUint8(0, sensitivity);
        
        BoardPilotService.instance?.writeConfig(
            Device.selectedDevice, 
            ConfigField.ZMK_CONFIG_KEY_MOUSE_SENSITIVITY, 
            data,
            save,
            (resp) => {
                if(resp.status) {
                    // Ok
                }
                else {
                    // Fail
                }
            }
        );
    }

    function readConfigMouseSensitivity () {
        if(!Device.selectedDevice)
            return;
        
        BoardPilotService.instance?.readConfig(
            Device.selectedDevice, 
            ConfigField.ZMK_CONFIG_KEY_MOUSE_SENSITIVITY, 
            (resp) => {
                if(resp.status) {
                    if(resp.data.length < 1)
                        return;
                    // Ok
                    setSensitivity(resp.data[0]);
                    
                }
                else {
                    // Fail
                }
            }
        );
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

    useEffect(() => {
        readConfigIQS5XXRegs();
        readConfigMouseSensitivity();
    }, []);

    return <Container sx={{paddingTop: 1, userSelect: 'none', backgroundColor: colorPalette.background, padding: 3, minWidth: "100%"}}>
            <Box>
                <Snackbar
                    open={((Device.selectedDevice?.deviceInfo.device.protocol === "bt") || false)}
                >
                    <Alert
                        severity="warning"
                    >
                        Can't read from device via bluetooth. Existing changes will be overwritten
                    </Alert>
                </Snackbar>
                <Typography variant="h4" sx={{padding: 2, paddingLeft: "10%"}}>Sensitivity</Typography>
                <Box sx={{display: 'inline-flex', width: '80%', paddingLeft: "10%"}}>
                    <Slider 
                        value={sensitivity} 
                        step={1} 
                        min={0} 
                        max={255} 
                        sx={sliderStyle}
                        onChange={(_x, n) => {setSensitivity(n as number)}}
                    />
                    <TextField 
                        value={sensitivity} 
                        type={"number"} 
                        inputProps={{min: 0, max: 255}} 
                        onChange={(x) => {setSensitivity(parseInt(x.target.value))}}
                    />
                </Box>
            </Box>
            <Box sx={{paddingLeft: "10%", paddingBottom: 5}}>
                <Button startIcon={<IosShareIcon/>} variant="contained" style={{margin: 10, marginLeft: 0}} onClick={() => {writeConfigMouseSensitivity(true)}}>Apply</Button>
                <Button variant="outlined" startIcon={!devMenuOpen ? <KeyboardArrowDownIcon/> : <KeyboardArrowUpIcon/>} style={{margin: 10}} onClick={() => {setDevMenuOpen(!devMenuOpen)}}>{!devMenuOpen ? "Open" : "Close"} Advanced Settings</Button>
            </Box>
        {devMenuOpen &&
            <Box>
            <Typography variant="h4" sx={{paddingBottom: 3, paddingLeft: "10%"}}>Trackpad IC (IQS550) raw register values</Typography>
            <Button startIcon={<CachedIcon/>} sx={{marginLeft: "10%", marginBottom:3}} variant="contained" onClick={() => {setRawValues([...TrackpadConfDefault])}}>Reset to default</Button>

            {
                rawValues.map((e, i) => {
                    const z = TrackpadConfValuesRaw[i];
                    return <Box key={"trackpad-conf-raw-" + i}>
                        <Tooltip title={z.tooltip} placement="bottom-start" enterDelay={500}>
                            <Typography variant="subtitle1" sx={{paddingLeft: "10%"}}>{z.title}</Typography>
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
                            <Box display={'inline-flex'} sx={{paddingLeft: "10%"}}>
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
                            <Box sx={{display: 'inline-flex', width: '85%', paddingLeft: "10%"}}>
                                <Slider 
                                    value={e.value} 
                                    step={1} 
                                    min={z.range?.min || 0} 
                                    max={z.range?.max || 0} 
                                    sx={sliderStyle}
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
            <Button variant="outlined"sx={{marginLeft: "10%", marginBottom:3}} onClick={() => {writeConfigIQS5XXRegs(false)}}>Test Changes</Button>
            <Button variant="contained" sx={{marginLeft: 3, marginBottom:3}} onClick={() => {writeConfigIQS5XXRegs(true)}}>Save Changes</Button>
            </Box>}
        
    </Container>;
}
import { Button, Card, Checkbox, Input, Slider, TextField, Tooltip, Typography } from "@mui/material";
import { Box, Container } from "@mui/system";
import React from "react";
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
    }
];

export default function Trackpad () {

    const [rawValues, setRawValues] = React.useState(TrackpadConfValuesRaw.map(e => e.default));


    function handleRawValueChange (index: number, newValue: number) {

        const newRawValues = rawValues.map((v, i) => {
            if(i === index) {
                return newValue;
            }
            else {
                return v;
            }
        })

        setRawValues(newRawValues);
    }

    function handleRawValueChangeBit (index: number, newValue: number, bit: number) {

        const newRawValues = rawValues.map((v, i) => {
            if(i === index) {
                return newValue === 0 ? (v & ~(1 << bit)) : (v | (1 << bit));
            }
            else {
                return v;
            }
        })

        setRawValues(newRawValues);
    }

    function saveValues (saveNvm: boolean = false) {
        Hidergod.instance?.request({
            cmd: HidergodCmd.APICMD_SET_IQS_REGS,
            device: null, // TODO:
            values: rawValues
        }, (data) => {
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
                                checked={e === 1} 
                                onChange={(x) => {handleRawValueChange(i, x.target.checked ? 1 : 0)}} 
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
                                                checked={((e >> li) & 1) === 1} 
                                                onChange={(x) => {handleRawValueChangeBit(i, x.target.checked ? 1 : 0, li)}} />
                                        </Box>
                                    })
                                }
                                
                            </Box>
                        }
                        {
                            z.type === "number" &&
                            <TextField 
                                value={e} 
                                type={"number"} 
                                inputProps={{min: z.range?.min || 0, max: z.range?.max || 0, step: 1}} 
                                onChange={(x) => {handleRawValueChange(i, parseInt(x.target.value))}}
                            />
                        }
                        {
                            z.type === "slider" &&
                            <Box sx={{display: 'inline-flex', width: '100%'}}>
                                <Slider 
                                    value={e} 
                                    step={1} 
                                    min={z.range?.min || 0} 
                                    max={z.range?.max || 0} 
                                    sx={{marginRight: 1}}
                                    onChange={(_x, n) => {handleRawValueChange(i, n as number)}}
                                />
                                <TextField 
                                    value={e} 
                                    type={"number"} 
                                    inputProps={{min: z.range?.min || 0, max: z.range?.max || 0, step: 1}} 
                                    onChange={(x) => {handleRawValueChange(i, parseInt(x.target.value))}}
                                />
                            </Box>
                        }
                    </Box>
                })
            }
        </Card>
    </Container>;
}
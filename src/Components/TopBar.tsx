import { InputLabel, MenuItem, Select } from '@mui/material';
import React, { useEffect, useState } from 'react';
import hidergoLogo from '../assets/hidergo_logo.png';
import Device from '../Device';

const TopBarContainer : React.CSSProperties = {
    background: '#373737',
    padding: 10,
    margin: 0,
    flex: 1,
    display: 'flex',
    maxHeight: 48,
    flexDirection: 'row',
    color: '#FFF',
    
    fontWeight: 800,
    fontFamily: 'AlumniSansPinstripe',
};

const topBarButton : React.CSSProperties = {
    textAlign: 'center',
    fontSize: '2em',
    flex: 1,
    cursor: 'pointer',
    borderRight: '1px solid #888',
};

type OnChangeViewCallback = (view: string) => any;
type OnSelectDeviceCallback = (dev: Device | null) => any;


export default function TopBar (props: {onChangeView: OnChangeViewCallback, onSelectDevice: OnSelectDeviceCallback}) {

    const [devices, setDevices] = useState([...Device.devices]);

    const [selectedDevice, setSelectedDevice] = useState(null as Device | null);

    useEffect(() => {
        setDevices([...Device.devices]);
        setSelectedDevice(Device.selectedDevice);
        Device.addDeviceUpdateListener((d) => {
            setDevices([...Device.devices]);
            setSelectedDevice(Device.selectedDevice);
        })
    }, []);

    return (
        <div style={TopBarContainer}>
            <div style={{flex: 1, display: 'flex'}}>
                <img src={hidergoLogo} style={{ flex: 1, maxWidth: 100}} />
            </div>
            <div style={{flex: 8, padding: 0, margin: 0}}>
                <div style={{display: 'flex', flex: 1, flexDirection: 'row', alignItems: 'center', height: '100%'}}>
                    <div style={topBarButton}>  
                        <p style={{padding: 0, margin: 0}} onClick={() => {props.onChangeView("keymapeditor")}}>
                            Keymap
                        </p>
                    </div>
                    <div style={topBarButton} onClick={() => {props.onChangeView("display")}}>
                        <p style={{padding: 0, margin: 0}}>
                            Display
                        </p>
                    </div>
                    <div style={{...topBarButton, ...{borderRight: 'none'}}} onClick={() => {props.onChangeView("trackpad")}}>
                        <p style={{padding: 0, margin: 0}}>
                            Trackpad
                        </p>
                    </div>
                </div>
            </div>
            {
                devices.length > 0 &&
                <div style={{flex: 1}}>
                    <InputLabel sx={{color: 'white'}} id="device-select-label">Device</InputLabel>
                    <Select
                        label="Device"
                        labelId="device-select-label"
                        value={selectedDevice?.deviceInfo.device.serial}
                        sx={{height: 30, color: 'white'}}
                        onChange={(e) => {
                            const _dev = devices.find(d => d.deviceInfo.device.serial === e.target.value) || null;
                            setSelectedDevice(_dev);
                            props.onSelectDevice(_dev);
                        }}
                    >
                        {
                            devices.map((e, i) => {
                                return <MenuItem value={e.deviceInfo.device.serial} key={"dev-select-" + i}>
                                    {e.deviceInfo.product.product}
                                </MenuItem>
                            })
                        }
                    </Select>
                </div>
            }
            
        </div>
    )

}
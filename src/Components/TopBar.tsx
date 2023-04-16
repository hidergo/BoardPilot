import { InputLabel, MenuItem, Select } from '@mui/material';
import React, { useEffect, useState } from 'react';
import hidergoLogo from '../assets/hidergo_logo.png';
import Device from '../misc/Device';

const TopBarContainer: React.CSSProperties = {
    background: '#373737',
    padding: 10,
    margin: 0,
    flex: 1,
    display: 'flex',
    maxHeight: 48,
    flexDirection: 'row',
    color: '#FFF',

    fontWeight: 400,
    fontFamily: 'Inter',
};

const topBarButton: React.CSSProperties = {
    paddingTop: "0.5em",
    height: "100%",
    textAlign: 'center',
    fontSize: '1.5em',
    flex: 1,
    cursor: 'pointer',
    borderRight: '1px solid #888',
};

type OnChangeViewCallback = (view: string) => any;
type OnSelectDeviceCallback = (dev: Device | null) => any;


export default function TopBar(props: { onChangeView: OnChangeViewCallback, onSelectDevice: OnSelectDeviceCallback }) {

    const [devices, setDevices] = useState<Device[]>([]);

    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

    useEffect(() => {
        setDevices([...Device.devices]);
        setSelectedDevice(Device.selectedDevice);
        Device.addDeviceUpdateListener(() => {
            setDevices([...Device.devices]);
            setSelectedDevice(Device.selectedDevice);
        })
    }, []);

    return (
        <div style={TopBarContainer}>
            <div style={{ flex: 1, display: 'flex', justifyContent: "space-around" }}>
                <img src={hidergoLogo} style={{ flex: 1, maxWidth: 100 }} />
            </div>
            <div style={topBarButton}>
                <p style={{ padding: 0, margin: 0 }} onClick={() => { props.onChangeView("keymapeditor") }}>
                    Keymap
                </p>
            </div>
            <div style={topBarButton} onClick={() => { props.onChangeView("display") }}>
                <p style={{ padding: 0, margin: 0 }}>
                    Display
                </p>
            </div>
            <div style={{ ...topBarButton, ...{ borderRight: 'none' } }} onClick={() => { props.onChangeView("trackpad") }}>
                <p style={{ padding: 0, margin: 0 }}>
                    Trackpad
                </p>
            </div>
            {
                devices.length > 0 &&
                <div style={{ flex: 1, marginLeft: 10 }}>
                    <InputLabel sx={{ color: 'white' }} id="device-select-label">Device</InputLabel>
                    <Select
                        label="Device"
                        labelId="device-select-label"
                        value={selectedDevice?.deviceInfo.device.serial}
                        sx={{ height: 30, color: 'white' }}
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
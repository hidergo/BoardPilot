import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import React, { useEffect, useState } from 'react';
import hidergoLogo from '../assets/boardpilot_logo_white.png'
import Device from '../misc/Device';
import { TopBarButton } from './TopBarButton';
import { Settings } from '@mui/icons-material';

const TopBarContainer: React.CSSProperties = {
    background: '#373737',
    margin: 0,
    flex: 1,
    display: 'flex',
    maxHeight: 70,
    minHeight: 50,
    flexDirection: 'row',
    color: '#FFF',
    userSelect: 'none',
    fontWeight: 400,
    fontFamily: 'Inter',
};

type OnChangeViewCallback = (view: string) => any;
type OnSelectDeviceCallback = (dev: Device | null) => any;


export default function TopBar(props: { onChangeView: OnChangeViewCallback, onSelectDevice: OnSelectDeviceCallback }) {

    const [devices, setDevices] = useState<Device[]>([]);
    const [currentView, setCurrentView] = useState<string>("keymapeditor");
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

            <div style={{ flex: 1, display: 'flex', justifyContent: "space-around", minHeight: 70 }}>
                <img src={hidergoLogo} style={{ flex: 1, maxWidth: 160, maxHeight: 40, paddingTop: 17 }} />
            </div>
            <TopBarButton label="Keymap" currentView={currentView} view="keymapeditor" onButtonClick={() => { setCurrentView("keymapeditor"); props.onChangeView("keymapeditor") }} />
            <TopBarButton label="Display" currentView={currentView} view="display" onButtonClick={() => { setCurrentView("display"); props.onChangeView("display") }} />
            <TopBarButton label="Trackpad" currentView={currentView} view="trackpad" onButtonClick={() => { setCurrentView("trackpad"); props.onChangeView("trackpad") }} />
            {
                devices.length > 0 ?
                    <div style={{ display: 'flex', flex: 1, marginLeft: 10, paddingTop: 22 }}>
                        <FormControl>
                            <InputLabel shrink>
                                Device
                            </InputLabel>
                            <Select
                                labelId="device-select-label"
                                placeholder='Select a device'
                                value={selectedDevice?.deviceInfo.device.serial}
                                sx={{ height: 30, color: 'white', width: 180 }}
                                onChange={(e) => {
                                    const _dev = devices.find(d => d.deviceInfo.device.serial === e.target.value) || null;
                                    setSelectedDevice(_dev);
                                    props.onSelectDevice(_dev);
                                }}
                            >
                                {
                                    devices.length > 0 ?
                                        devices.map((e, i) => {
                                            return <MenuItem value={e.deviceInfo.device.serial} key={"dev-select-" + i}>
                                                {e.deviceInfo.product.product}
                                            </MenuItem>
                                        })
                                        :
                                        <MenuItem disabled>
                                            No devices available or background service is not running
                                        </MenuItem>

                                }
                            </Select>
                        </FormControl>
                        <div style={{ paddingTop: 2, paddingLeft: 2, cursor: 'pointer' }}>
                            <Settings onClick={() => { setCurrentView("settings"); props.onChangeView("settings") }} />
                        </div>
                    </div>
                    :
                    <div style={{ flex: 1, marginLeft: 10, paddingTop: 10, fontSize: 12, paddingRight: 25, textAlign: 'center' }}>
                        No devices available or background service is not running
                    </div>
            }

        </div>
    )

}
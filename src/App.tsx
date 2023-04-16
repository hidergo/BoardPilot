import { Fragment, useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";
import LayoutView from "./Views/KeymapEditor";
import TopBar from "./Components/TopBar";
import KeymapEditor from "./Views/KeymapEditor";
import Home from "./Views/Home";
import { listen } from "@tauri-apps/api/event";
import Hidergod from "./misc/Hidergod";
import Display from "./Views/Display";
import Trackpad from "./Views/Trackpad";
import Device from "./misc/Device";
import { Button, CircularProgress, Typography } from "@mui/material";
import HDLDisplay from "./hdl/HDLDisplay";

let hidergod: Hidergod = new Hidergod();

function App() {
	const [view, setView] = useState("keymapeditor");
	const [selectedDevice, setSelectedDevice] = useState(Device.selectedDevice);
	const [refreshing, setRefreshing] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");

	useEffect(() => {
		console.log("Connecting to device...");
		
		setSelectedDevice(Device.selectedDevice);
        Device.addDeviceUpdateListener((d) => {
            setSelectedDevice(Device.selectedDevice);
        })
	}, []);

	return (
		<div className="container">
			{
				selectedDevice === null &&
				<div style={{flex: 1, display: "flex", flexDirection: "column", width: "100vw", height: "100vh", justifyContent: "space-around"}}>
					<div>
					<Typography variant="h4" style={{textAlign: "center"}}>Connect a device to continue</Typography>
					<div style={{textAlign: "center", paddingTop: 40}}>
						<Button variant="contained" onClick={() => { window.location.reload();}}>Refresh</Button>
					</div>
					<div style={{textAlign: "center", paddingTop: 40, minHeight: 100}}>
						{refreshing && <CircularProgress />}
					</div>
					</div>
				</div>
			}
			{
				selectedDevice !== null &&
				<Fragment>
					<TopBar onChangeView={(view) => { setView(view) }} onSelectDevice={(dev) => { setSelectedDevice(dev) }} />
					<div className="content-container">
						{
							view === "keymapeditor" &&
							<KeymapEditor />
						}
						{
							view === "display" &&
							<Display />
						}
						{
							view == "trackpad" &&
							<Trackpad />
						}
					</div>
				</Fragment>
			}
		</div>

	);
}

export default App;

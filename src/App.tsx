import { Fragment, useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";
import TopBar from "./Components/TopBar";
import Home from "./Views/Home";
import { listen } from "@tauri-apps/api/event";
import Hidergod from "./misc/Hidergod";
import Display from "./Views/Display";
import Trackpad from "./Views/Trackpad";
import Device from "./misc/Device";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import HDLDisplay from "./hdl/HDLDisplay";
import KeymapEditor from "./Views/KeymapEditor";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

let hidergod: Hidergod = new Hidergod();


const darkTheme = createTheme({
	palette: {
		mode: 'dark',
	},
});

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
			<ThemeProvider theme={darkTheme}>
				<Fragment>
					<TopBar onChangeView={(view) => { setView(view) }} onSelectDevice={(dev) => { setSelectedDevice(dev) }} />
					<Box className="content-container">
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
					</Box>
				</Fragment>
			</ThemeProvider>
		</div>

	);
}

export default App;

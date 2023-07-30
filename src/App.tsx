import { Fragment, useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";
import TopBar from "./Components/TopBar";
import Home from "./Views/Home";
import { listen } from "@tauri-apps/api/event";
import BoardPilotService from "./misc/BoardPilotService";
import Display from "./Views/Display";
import Trackpad from "./Views/Trackpad";
import Device from "./misc/Device";
import { Box, Button, CircularProgress, MenuItem, Select, Typography } from "@mui/material";
import HDLDisplay from "./hdl/HDLDisplay";
import KeymapEditor from "./Views/KeymapEditor";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Settings from "./Views/Settings";
import { colorPalette } from "./Styles/Colors";

let boardPilotService: BoardPilotService = new BoardPilotService();

const darkTheme = createTheme({
	palette: {
		mode: 'dark',
	},
	typography: {
		allVariants: {
		  color: colorPalette.text,
		}
	  }
});

function App() {
	const [view, setView] = useState("keymapeditor");
	const [selectedDevice, setSelectedDevice] = useState(Device.selectedDevice);
	const [refreshing, setRefreshing] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");
	const [keyboardVersion, setKeyboardVersion] = useState(localStorage.getItem('keyboardVersion') || '');
	const [keyboard, setKeyboard] = useState(localStorage.getItem('keyboard') || '');

	useEffect(() => {
		console.log("Connecting to device...");
		keyboardVersion === '' || keyboard === '' ? setView("initialsetup") : setView("keymapeditor");
		setSelectedDevice(Device.selectedDevice);
		Device.addDeviceUpdateListener((d) => {
			setSelectedDevice(Device.selectedDevice);
		})
	}, []);

	const handleKeyboardVariantChange = (event: any) => {
		const selectedVersion = event.target.value;
		setKeyboardVersion(selectedVersion);
		localStorage.setItem('keyboardVersion', selectedVersion);
		console.log(selectedVersion);
	};

	const handleKeyboardChange = (event: any) => {
		const selectedKeyboard = event.target.value;
		setKeyboard(selectedKeyboard);
		localStorage.setItem('keyboard', selectedKeyboard);
		console.log(selectedKeyboard);
	};

	const handleClickStart = () => {

	};

	const initialSetup = (
		<Box sx={{ backgroundColor: colorPalette.background, width: "50%", height: "100vh", margin: 'auto', display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', marginTop: -10}}>
			<Typography textAlign={'center'} sx={{ paddingTop: 5, paddingBottom: 9 }} variant="h3">Welcome to BoardPilot!</Typography>
			<Box sx={{ display: "flex", flexDirection: "row", gap: "1rem", marginTop: "1rem", width: '100%', justifyContent: 'center' }}>
				<Typography sx={{ paddingTop: 0.5, width: 300 }} variant="h6">Select Keyboard</Typography>
				<Box sx={{ display: "flex", flexDirection: "row", gap: "1rem", width: 100 }}>
					<Select size="small" value={keyboard} onChange={handleKeyboardChange}>
						<MenuItem value="hidergo_disconnect_mk1">Disconnect MK1</MenuItem>
					</Select>
				</Box>
			</Box>
			<Box sx={{ display: "flex", flexDirection: "row", gap: "1rem", marginTop: "1rem", width: '100%', justifyContent: 'center' }}>
				<Typography sx={{ paddingTop: 0.5, width: 300 }} variant="h6">Select Variant</Typography>
				<Box sx={{ display: "flex", flexDirection: "row", gap: "1rem", width: 100 }}>
					<Select size="small" value={keyboardVersion} onChange={handleKeyboardVariantChange}>
						<MenuItem value="ansi">ANSI</MenuItem>
						<MenuItem value="iso">ISO</MenuItem>
					</Select>
				</Box>
			</Box>
			<Button disabled={(keyboardVersion === '' || keyboard === '') ? true : false} variant="contained" sx={{marginTop: 10, width: 300, marginLeft: 20}} onClick={() => {setView("keymapeditor")}}>Start</Button>
		</Box>
	);


	return (
		<div className="container">
			<ThemeProvider theme={darkTheme}>
			{
					view === "initialsetup" ? initialSetup :
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
							{
								view === "settings" &&
								<Settings />
							}
						</Box>
					</Fragment>
			}
			</ThemeProvider>
		</div>

	);
}

export default App;

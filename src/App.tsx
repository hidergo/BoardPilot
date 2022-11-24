import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";
import LayoutView from "./Views/KeymapEditor";
import TopBar from "./Components/TopBar";
import KeymapEditor from "./Views/KeymapEditor";
import Home from "./Views/Home";
import { listen } from "@tauri-apps/api/event";
import Hidergod from "./Hidergod";
import Display from "./Views/Display";
import Trackpad from "./Views/Trackpad";

let hidergod : Hidergod = new Hidergod();

function App() {
	const [view, setView] = useState("keymapeditor");

	return (
		<div className="container">
			<TopBar onChangeView={(view) => {setView(view)}} />
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
		</div>
		
  	);
}

export default App;

import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";
import LayoutView from "./Views/KeymapEditor";
import TopBar from "./Components/TopBar";
import KeymapEditor from "./Views/KeymapEditor";
import Home from "./Views/Home";

function App() {
	const [greetMsg, setGreetMsg] = useState("");
	const [name, setName] = useState("");
	const [view, setView] = useState("home");

	async function greet() {
		setGreetMsg(await invoke("greet", { name }));
	}

	return (
		<div className="container">
			<TopBar onChangeView={(view) => {setView(view)}} />
			<div className="content-container">
				{
					view === "home" &&
					<Home />
				}
				{
					view === "keymapeditor" &&
					<KeymapEditor />
				}
			</div>
		</div>
		
  	);
}

export default App;

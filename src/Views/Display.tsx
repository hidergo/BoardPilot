import { Box, Button, Card, CircularProgress, SxProps } from "@mui/material";
import { open, save } from "@tauri-apps/api/dialog";
import { readBinaryFile, readTextFile, writeTextFile } from "@tauri-apps/api/fs";
import HDLCompiler, { FileReaderInterface } from "hdl-cmp-ts/src/HDLCompiler";
import { dirname } from "path-browserify";
import { createRef, useEffect, useRef, useState } from "react";
import Editor from "react-simple-code-editor";
import HDLDisplay from "../hdl/HDLDisplay";
import { highlight, languages } from "prismjs";
import { basename } from "@tauri-apps/api/path";

const loadingBoxStyle : SxProps = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
}

const outerBoxStyle : SxProps = {
    display: "flex",
    flexDirection: "row",
    height: "100%"
}

const previewBoxStyle : SxProps = {
    display: "flex",
    flex: 1,
    flexDirection: "column"
}

const editorBoxStyle : SxProps = {
    flex: 1
}

export default function Display () {
    
    useEffect(() => {

        HDLDisplay.load().then(() => {
            // WASM loaded
            setHdlLoaded(true)
        }).catch(e => {
            // Loading WASM failed
        });

    }, []);

    const [hdlLoaded, setHdlLoaded] = useState(false);
    const [code, setCode] = useState("");
    const [currentFilePath, setCurrentFilePath] = useState<string|null>(null);
    const [hdlBasePath, setHDLBasePath] = useState("./");
    
    const canv = createRef<HTMLCanvasElement>();
    const canvasContainer = createRef<HTMLDivElement>();

    const fileReaderInterface : FileReaderInterface = (path, type) => {
        if(type === "text") {
            return readTextFile(path);
        }
        else if(type === "binary") {
            return readBinaryFile(path);
        }
    }

    function buildHDL (bytes: Uint8Array) {
        let err = HDLDisplay.buildHDL(80, 128, Array.from(bytes), bytes.length);
        if(err !== 0) {
            console.warn("Failed to build HDL " + err);
            return;
        }
        err = HDLDisplay.updateHDL();
        if(err !== 0) {
            console.warn("Failed to update HDL " + err);
            return;
        }
        const addr = HDLDisplay.getScreenBuffer();
        console.log("ADDR: " + addr);
        console.log(HDLDisplay.driver)
        if(canv.current) {
            if(HDLDisplay.driver) {
                const arr = new Uint8Array(HDLDisplay.driver.HEAP8.buffer, addr, 80 * 128 / 8);
                const ctx = canv.current.getContext("2d");
                
                if(ctx) {
                    ctx.imageSmoothingEnabled = false;
                    for(let i = 0; i < 80 * 128 / 8; i++) {
                        for(let p = 0; p < 8; p++) {
                            const _x = (Math.floor(i * 8) + p) % 80;
                            const _y = (Math.floor(i * 8 / 80));
                            if((arr[i] >> (7 - p)) & 1) {
                                ctx.fillStyle = "white";
                            }
                            else {
                                ctx.fillStyle = "black";
                            }
                            ctx.fillRect(_x, _y, 1, 1);
                        }
                    }
                }
                else {
                    console.log("NO CTX");
                }
            }
        }
        else {
            console.log("NO CURRENT CANVAS");
        }
    }

    async function openFileDialog () {
        const file = await open({
            filters: [{
                name: 'HDL file (.hdl, .bin)',
                extensions: ['hdl', 'bin']
            }]
        })
        if(file) {
            await readHDLFile(file as string);
        }
    }

    async function exportFile () {
        const file = await save({
            filters: [{
                name: 'C source file',
                extensions: ['c']
            }]
        })
        if(file) {
            const cmp = new HDLCompiler(fileReaderInterface);
            cmp.basePath = hdlBasePath
            let ok = await cmp.load(code);
            if(!ok) {
                console.log("Failed to parse file");
                return;
            }
            const bytes = cmp.compile();
            const escapedName = (await basename(file)).replace("-", "_");
let content = `
// HDL output file
// Original size: ${code.length}B, Compiled size: ${bytes.length}B
            
// HDL output size
const unsigned long HDL_PAGE_SIZE_${escapedName} = ${bytes.length};
// Output
unsigned char HDL_PAGE_${escapedName}[] = {
`;
            for(let x = 0; x < bytes.length; x++) {
                if(x % 16 === 0 && x !== 1) {
                    content += '\n';
                }
                content += "0x" + bytes[x].toString(16);
                if(x !== bytes.length - 1) {
                    content += ", ";
                }
            }
content += `};`;
            await writeTextFile(file, content);
        }
    }

    async function writeFileDialog () {
        const file = await save({
            filters: [{
                name: 'HDL file (.hdl)',
                extensions: ['hdl']
            }]
        })
        if(file) {
            await writeTextFile(file, code);
            setCurrentFilePath(file);
            setHDLBasePath(dirname(file) + "/");
        }
    }

    async function readHDLFile (file: string) {
        onViewResize();
        let bytes = new Uint8Array(0);
        switch((file).split(".").pop()) {
            case "bin":
                bytes = await readBinaryFile(file);
                break;
            case "hdl":
                const txt = await readTextFile(file);
                const cmp = new HDLCompiler(fileReaderInterface);
                setCode(txt);
                cmp.basePath = dirname(file) + "/";
                setHDLBasePath(cmp.basePath);
                setCurrentFilePath(file);
                let ok = await cmp.load(txt);
                if(!ok) {
                    console.log("Failed to parse file");
                    return;
                }
                bytes = cmp.compile();

                break;
            default:
                console.log("Unknown extension");
                return; 
        }
        buildHDL(bytes);
    }
    
    async function loadHDLCode (code: string, basePath: string) {
        const cmp = new HDLCompiler(fileReaderInterface);
        cmp.basePath = basePath;
        setCode(code);
        let ok = await cmp.load(code);
        if(!ok) {
            console.log("Failed to parse file");
            return;
        }
        const bytes = cmp.compile();

        buildHDL(bytes);
    }

    async function onSaveFile () {
        if(currentFilePath === null) {
            // Show save file dialog
            await writeFileDialog();
        }
        else {
            // Save file on current path
            await writeTextFile(currentFilePath, code);
        }
        // Reload HDL
        await loadHDLCode(code, hdlBasePath);
    }

    function onViewResize () {
        if(canvasContainer.current && canv.current) {
            const ratio = 80 / 128;
            canv.current.style.height = canvasContainer.current.clientHeight + "px";
            canv.current.style.width = (canvasContainer.current.clientHeight * ratio) + "px";
        }
    }

    function newFile () {
        setCode("");
        setCurrentFilePath(null);
        setHDLBasePath("./");
    }

    // Waiting for WASM to load
    if(!hdlLoaded) {
        return <Box sx={loadingBoxStyle}>
            <CircularProgress />
        </Box>
    }

    return <Box sx={outerBoxStyle}>
            <Box sx={previewBoxStyle}>
                <Box sx={{flex: 1, maxHeight: 50}}>

                </Box>
                <Box sx={{flex: 5, padding: 10}}>
                    <div style={{display: "flex", alignItems: "center", justifyContent: "center", height: "100%"}} ref={canvasContainer}>
                        <canvas style={{border: "1px solid rgba(0,0,0,0.3)", imageRendering: "pixelated"}} width={80} height={128} ref={canv}></canvas>
                    </div>
                </Box>
            </Box>
            <Box sx={editorBoxStyle}>
                <Card elevation={4} sx={{width: '100%', height: '100%', boxSizing: 'border-box'}}>
                    <Box style={{flex: 1}}>
                        <Button  onClick={openFileDialog} variant="contained">Open file</Button>
                        <Button  onClick={newFile} variant="contained">New file</Button>
                        <Button  onClick={exportFile} variant="contained">Export</Button>

                    </Box>
                    <Box style={{flex: 7, height: "85vh", overflow: "auto"}}>
                        <Editor 
                            
                            value={code}
                            onValueChange={c => setCode(c)}
                            highlight={c => highlight(c, languages.xml, "xml")}
                            onKeyDown={(e) => {
                                if(e.ctrlKey) {
                                    if(e.key === 's') {
                                        onSaveFile();
                                    }
                                    else if(e.key === 'n') {
                                        newFile();
                                    }
                                }
                                
                            }}
                            style={{
                                fontFamily: 'monaco, monospace',
                                width: '100%',
                                minHeight: '100%'
                            }}
                        />
                    </Box>
                </Card>
            </Box>
    </Box>;
}
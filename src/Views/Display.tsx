import { Box, Button, Card, CircularProgress, SxProps } from "@mui/material";
import { open } from "@tauri-apps/api/dialog";
import { readBinaryFile, readTextFile } from "@tauri-apps/api/fs";
import HDLCompiler, { FileReaderInterface } from "hdl-cmp-ts/src/HDLCompiler";
import { createRef, useEffect, useRef, useState } from "react";
import HDLDisplay from "../hdl/HDLDisplay";

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

    const canv = createRef<HTMLCanvasElement>();
    const canvasContainer = createRef<HTMLDivElement>();


    async function openFileDialog () {
        const file = await open({
            filters: [{
                name: 'HDL file (.hdl, .bin)',
                extensions: ['hdl', 'bin']
            }]
        })
        onViewResize();
        if(file) {
            
            let bytes = new Uint8Array(0);
            switch((file as string).split(".").pop()) {
                case "bin":
                    bytes = await readBinaryFile(file as string);
                    break;
                case "hdl":
                    const txt = await readTextFile(file as string);
                    //const cmp = new HDLCompiler(txt);
                    break;
                default:
                    console.log("Unknown extension");
                    return; 
            }
            
            
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

    }

    function onViewResize () {
        if(canvasContainer.current && canv.current) {
            const ratio = 80 / 128;
            canv.current.style.height = canvasContainer.current.clientHeight + "px";
            canv.current.style.width = (canvasContainer.current.clientHeight * ratio) + "px";


        }
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
                    <Button onClick={openFileDialog} variant="contained">Open file</Button>
                </Card>
            </Box>
    </Box>;
}
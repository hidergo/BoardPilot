import { Box, Button, Card, CircularProgress } from "@mui/material";
import { open } from "@tauri-apps/api/dialog";
import { readBinaryFile } from "@tauri-apps/api/fs";
import { createRef, useEffect, useRef, useState } from "react";
import HDLDisplay from "../hdl/HDLDisplay";

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

    let canv = createRef<HTMLCanvasElement>();

    async function openFileDialog () {
        const file = await open({
            filters: [{
                name: 'HDL file (.hdl, .bin)',
                extensions: ['hdl', 'bin']
            }]
        })
        if(file) {
            const bytes = await readBinaryFile(file as string);
            
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
                        /*
                        for(let y = 0; y < 128; y++) {
                            for(let x = 0; x < 80; x++) {
                                const px = arr[Math.floor(y / 80) + x]
                            }
                        }
                        */
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

    if(!hdlLoaded) {
        return <Box>
            <CircularProgress />
        </Box>
    }

    return <Box>
        <Card>
            <Button onClick={openFileDialog} variant="contained">Open file</Button>
            <canvas width={80} height={128} ref={canv}>

            </canvas>
        </Card>
    </Box>;
}
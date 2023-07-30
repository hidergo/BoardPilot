import { Select, MenuItem, Divider, Typography } from "@mui/material";
import { Box, Container } from "@mui/system";
import React, { useEffect, useRef, useState } from "react";
import { colorPalette } from "../Styles/Colors";

export default function Trackpad() {

    const [keyboardVersion, setKeyboardVersion] = useState(localStorage.getItem('keyboardVersion') || '');

    const handleKeyboardVariantChange = (event: any) => {
        const selectedVersion = event.target.value;
        setKeyboardVersion(selectedVersion);
        localStorage.setItem('keyboardVersion', selectedVersion);
    };

    return (
        <Container>
            <Box sx={{userSelect: 'none', display: 'inline-flex', flexDirection: 'column', width: '80%', paddingLeft: "10%" }}>
                <Typography
                    sx={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem", color: colorPalette.text }}
                    variant="h4"
                >
                    Settings
                </Typography>
                <Divider />
                <Box sx={{ display: "flex", flexDirection: "row", gap: "1rem", marginTop: "1rem", width: '100%' }}>
                    <Typography sx={{ paddingTop: 1, width: '20%', color: colorPalette.text }} variant="h6">Select Keyboard</Typography>
                    <Box sx={{ display: "flex", flexDirection: "row", gap: "1rem" }}>
                        <Select disabled size="small" value={"hidergo_disconnect_mk1"}>
                            <MenuItem value="hidergo_disconnect_mk1">Disconnect MK1</MenuItem>
                        </Select>
                    </Box>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "row", gap: "1rem", marginTop: "1rem", width: '100%' }}>
                    <Typography sx={{ paddingTop: 1, width: '20%', color: colorPalette.text }} variant="h6">Select Variant</Typography>
                    <Box sx={{ display: "flex", flexDirection: "row", gap: "1rem" }}>
                        <Select size="small" value={keyboardVersion} onChange={handleKeyboardVariantChange}>
                            <MenuItem value="ansi">ANSI</MenuItem>
                            <MenuItem value="iso">ISO</MenuItem>
                        </Select>
                    </Box>
                </Box>
            </Box>
        </Container>
    );
}
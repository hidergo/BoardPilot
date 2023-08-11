# BoardPilot tauri frontend app.

This is a tauri app which allows you to interface with the BoardPilot background service.

Currently it is possible to change the keymap, edit the display contents and change trackpad variables. Reading and writing to a device is supported on Windows and Linux via USB. Bluetooth is not yet supported.

This program runs an external, more lightweight binary called [BoardPilotService](https://github.com/hidergo/BoardPilotService). The service uses [hidapi](https://github.com/osmakari/hidapi) to read and write custom data to the device. BoardPilot communicates with BoardPilotService with local TCP socket.

:warning:**NOTE** On linux, if you don't want to run this program as super user, your user must be in `dialout` group (`uucp` group on Arch based distros). Without this this group the program cannot connect to the device.

## Development environment setup

1. Install tauri toolchain according to the documentation here: [Link](https://tauri.app/v1/guides/getting-started/prerequisites)
2. Install Node.js
3. Run `git submodule init && git submodule update`
3. Run `npm i`
4. Run `npm run tauri dev`

You are ready to start.

## Recommended VSCode IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Features 

### Keymap editor

This software includes a keymap editor, which allows you to bind almost any key on the keyboard to another key press or other ZMK operations. 

### Display editor

With the display editor, you can change the appearance of your device's display. Currently only right display can be edited on the DCMK1. Display is edited with a custom XML-style language called HDL. A very short documentation for HDL can be found [here](https://github.com/hidergo/hdl-cmp-ts/blob/master/doc.md)

### Trackpad configuration

You can change the device's trackpad sensitivity from this view. The view also contains more advanced setup for the trackpad.

## License

This project is licensed under the Apache 2.0 License with a commercial use restriction. Please see the [LICENSE](./LICENSE) file for more details.

If you are interested in licensing this software for commercial purposes, contact [cs@hidergo.fi](mailto:cs@hidergo.fi) for more information.

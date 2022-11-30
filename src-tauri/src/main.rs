#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

#[derive(Clone, serde::Serialize)]
struct Payload {
  message: String,
}

use std::{net::TcpStream, io::Read, io::Write};

use tauri::Window;

static mut tcp_stream: Option<TcpStream> = None;

fn hidergod_recv_thread (mut stream: TcpStream, window: Window) {
    let mut buffer = [0u8; 4096];
    window.emit("api_onopen", Payload { message: "".into() }).unwrap();
    let mut err = 0;
    loop {
        match stream.read(&mut buffer) {
            Ok(size) => {
                if size == 0 {
                    window.emit("api_onclose", Payload { message: "".into() }).unwrap();
                    err = 1;
                }
                else {
                    let msg = String::from_utf8_lossy(&buffer);
                    let trimmed = msg.trim_matches(char::from(0));
                    window.emit("api_onmessage", Payload { message: trimmed.to_string() }).unwrap();
                }
                buffer.fill(0);
            },
            Err(_err) => {
                err = 1;
            }
        };
        if err == 1 {
            break;
        }
    }
    println!("Listen thread exit");
} 

#[tauri::command]
fn hidergod_connect (window: Window, port: u16) -> bool {
    println!("Connecting to server...");
    unsafe {
        if tcp_stream.is_some() {
            match &tcp_stream {
                None => {
    
                }
                Some(s) => {
                    s.shutdown(std::net::Shutdown::Both);
                    println!("Shutdown old Tcp stream");
                }
            }
            
        }
    }

    let stream = TcpStream::connect(
            format!("{}{}", "127.0.0.1:", port.to_string())
    );

    match stream {
        Ok(strm) => {
            let _handle = std::thread::spawn(move || {
                let nstrm = strm.try_clone().unwrap();
                unsafe {
                    tcp_stream = Some(nstrm);
                }
                hidergod_recv_thread(strm, window);
            });
            println!("Connected to server");
            return true;
        },
        Err(_err) => {
            println!("{}", _err);
            return false;
        }
    };
    
}

#[tauri::command]
fn hidergod_send (message: String) {
    unsafe {
        match &tcp_stream {
            None => {

            }
            Some(s) => {
                let mut nstrm = s.try_clone().unwrap();
                nstrm.write(message.as_bytes()).unwrap();
            }
        }
        
    }
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![hidergod_connect, hidergod_send])

        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";

export type OnResponseCallback = (data: object | null) => any;

type AuthenticationResponse = {cmd: 0x01, status: boolean};

export default class Hidergod {

    private static _reqid = 0;
    private static get reqid () {
        return this._reqid++;
    }

    private connected = false;

    private _requests : {reqid: number, callback: OnResponseCallback}[] = [];

    constructor (port: number = 24429) {

        // Set events
        listen('api_onopen', (event) => {
            console.log("ONOPEN");
            this.onConnect(true);
        });

        listen('api_onclose', (event) => {
            console.log("ONCLOSE");

            this.onClose(true);

        });
    
        listen('api_onmessage', (event) => {
            console.log("ONMESSAGE");
            this.onMessage((event.payload as {message: string}).message);
        });

        // Connect
        invoke("hidergod_connect", {port: port});
    }



    public request (msg: object, onResponse: OnResponseCallback | undefined = undefined) : boolean {
        if(!this.connected)
            return false;

        const _req_id = Hidergod.reqid;
        const nmsg = {
            ...msg,
            reqid: _req_id
        };

        invoke("hidergod_send", {message: JSON.stringify(nmsg)});
        if(onResponse) {
            this._requests.push({reqid: _req_id, callback: onResponse});
        }
        return true;
    }

    private authenticate () {

        console.log("Authenticating...")
        const msg = {
            cmd: 0x01,
            key: "p*kG462jhJBY166EZLKxf9Du"
        };

        this.request(msg, (data) => {
            const resp = data as AuthenticationResponse;
            
            if(data && resp.status) {
                console.log("Logged in to the API");
            }
            else {
                console.warn("Could not connect to API. Check service");
            }
        });
    }

    private onConnect (ok: boolean) {
        console.log("Socket connected");
        this.connected = true;
        this.authenticate();
    }

    private onMessage (data: string) {
        try {
            const jsn = JSON.parse(data);
            if(jsn.reqid) {
                for(let i = 0; i < this._requests.length; i++) {
                    let r = this._requests[i];
                    if(r.reqid === jsn.reqid) {
                        r.callback(jsn);
                        this._requests.splice(i, 1);
                        break;
                    }
                }
            }
        }
        catch(e) {

        }
    }

    private onClose (ok: boolean) {
        this.connected = false;
    }

}
import { Socket } from "net";

export type OnResponseCallback = (data: object | null) => any;

type AuthenticationResponse = {cmd: 0x01, status: boolean};

export default class Hidergod {

    private client: Socket | null = null;

    private static _reqid = 0;
    private static get reqid () {
        return this._reqid++;
    }

    private _requests : {reqid: number, callback: OnResponseCallback}[] = [];

    constructor (port: number = 24429) {

        if(this.client == null) {
            this.client = new Socket();
        }

        this.client.on('connect', this.onConnect);
        this.client.on('data', this.onMessage);
        this.client.on('close', this.onClose);

        this.client.connect(port, '127.0.0.1');
    }

    public request (msg: object, onResponse: OnResponseCallback | undefined = undefined) {
        const _req_id = Hidergod.reqid;
        const nmsg = {
            ...msg,
            reqid: _req_id
        };

        this.client?.write(JSON.stringify(nmsg));
        if(onResponse) {
            this._requests.push({reqid: _req_id, callback: onResponse});
        }
    }

    private authenticate () {
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

    private onConnect (err: boolean) {
        console.log("Socket connected");
        this.authenticate();
    }

    private onMessage (data: Buffer) {
        try {
            const jsn = JSON.parse(data.toString());
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

    private onClose (err: boolean) {

    }

}
import { MapAuthControlDelegate } from './Common/MapAuthDelegate.ios';

declare var EsriMapAuthenticator: any;

export class MapAuthenticator {

    private static _instance: MapAuthenticator
    private _native: any;
    private _context: any;
    private _onAuthResult: Function;
    private _isAuthRunning: Boolean = false;

    public static getInstance(): MapAuthenticator {
        if (!MapAuthenticator._instance) {
            MapAuthenticator._instance = new MapAuthenticator();
        }
        return MapAuthenticator._instance;
    }

    public create(activity: any, mapType: String) {
        this._native = new EsriMapAuthenticator();
        this._native.mapAuthDelegate = MapAuthControlDelegate.initWithCallback(this.onAuthResult.bind(this));
    }

    public runAuth(context: any, authConfig: any,
            onAuthResult: (context: any, isSuccess: Boolean,
                errorMessage: String, jsonPayload: String) => void) {
        if (this._isAuthRunning) {
            return;
        }
        this._isAuthRunning = true;
        this._context = context;
        this._onAuthResult = onAuthResult
        this._native?.runAuth(JSON.stringify(authConfig));
    }

    public isAuthRunning(): Boolean {
        return this._isAuthRunning;
    }

    public removeAuth(authInfo: any): Boolean {
        if (this._isAuthRunning) {
            return false;
        }        
        return this._native?.removeAuth(JSON.stringify(authInfo));
    }

    public destroy() {
        if (this._isAuthRunning) {
            return;
        }
        this._native?.destroy();
    }

    public onAuthResult(isSuccess: Boolean, errorMessage: String, jsonPayload: String): void {
        this._isAuthRunning = false;
        if (this._onAuthResult) {
            this._onAuthResult(this._context, isSuccess, errorMessage, JSON.stringify(jsonPayload));
        }
    }
}

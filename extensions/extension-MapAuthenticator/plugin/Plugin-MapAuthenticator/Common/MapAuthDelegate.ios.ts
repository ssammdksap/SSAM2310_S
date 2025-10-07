interface MapAuthDelegate extends NSObjectProtocol { // tslint:disable-line
    onAuthResult?(jsonString: string): void;
}

declare var MapAuthDelegate: {
    prototype: MapAuthDelegate;
};

@NativeClass()
class MapAuthControlDelegate extends NSObject implements MapAuthDelegate {

    public static ObjCProtocols = [MapAuthDelegate]; // tslint:disable-line

    static _onAuthResult: Function;

    public static initWithCallback(onAuthResult: Function): MapAuthControlDelegate {
        MapAuthControlDelegate._onAuthResult = onAuthResult;
        let delegate = new MapAuthControlDelegate();
        return delegate;
    }

    public onAuthResult(jsonString: string): void {
        let payload = JSON.parse(jsonString);
        if (MapAuthControlDelegate._onAuthResult) {
            MapAuthControlDelegate._onAuthResult(payload.IsSuccess, payload.ErrorMessage, payload.TokenInfo);
        }
    }
}

export { MapAuthControlDelegate }
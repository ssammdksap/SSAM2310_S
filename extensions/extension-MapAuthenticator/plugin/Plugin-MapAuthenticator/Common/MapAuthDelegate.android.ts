declare var com;

@NativeClass()
@Interfaces([com.sap.sam.android.plugin.mapauthenticator.IMapAuthDelegate])
class MapAuthDelegate extends java.lang.Object {
    private _impl: any;

    public constructor(impl: IMapAuthDelegate) {
        super();
        this._impl = impl;
    }

    public onAuthResult(isSuccess: Boolean, errorMessage: String, jsonPayload: String) {
        if (this._impl) {
            this._impl.onAuthResult(isSuccess, errorMessage, jsonPayload);
        }
    }
}

export { MapAuthDelegate }

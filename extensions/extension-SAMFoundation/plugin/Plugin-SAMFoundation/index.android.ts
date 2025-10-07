import * as app from '@nativescript/core/application';
import { AnalyticsEventLogger } from './AnalyticsEventLogger';

declare var com;
declare var java;

export class FoundationPluginManager {
    private static _instance: FoundationPluginManager;

    private secureStorage: SecureStorage;
    private config:String

    public init(context: any, storageConfig: string) {
        if(this.secureStorage){
            this.updateStorageConfig(storageConfig)
            return;
        }
        const holder = new com.sap.sam.android.plugin.samfoundation.wrapper.GenericEncryptedStorageWrapper();
        holder.init(app.android.context, storageConfig)
        this.config = storageConfig
        this.secureStorage =  new SecureStorage(holder.getInstance());
    }

    public updateStorageConfig(storageConfig: string){
        if(this.secureStorage && storageConfig != this.config){
            this.secureStorage.updateConfig(storageConfig);
            this.config = storageConfig
        }
    }

    public static getInstance(): FoundationPluginManager {
        if (!FoundationPluginManager._instance) {
            FoundationPluginManager._instance = new FoundationPluginManager();
        }
        return FoundationPluginManager._instance;
    }

    public static newSecureStorage(storageConfig: string){
        const holder = new com.sap.sam.android.plugin.samfoundation.wrapper.GenericEncryptedStorageWrapper();
        holder.testMethodsAvailability();
        holder.storeContext(app.android.context);
        holder.storeConfig(storageConfig);
        holder.test();
        const storage = holder.newStorageWithCachedData();
        return new SecureStorage(storage);
    }

    public getSecureStorage():SecureStorage{
        return this.secureStorage
    }
}

export class SecureStorage{

    private secureStorage: any;

     constructor(secureStorage:any) {
         this.secureStorage = secureStorage
     }

    public updateConfig(config){
        this.secureStorage.updateStorageConfig(config);
    }

    public putStringValue(key:String, value:String){
        return this.secureStorage.putStringValue(key,value);
    }

    public putIntegerValue(key:String, value:number){
        return this.secureStorage.putIntegerValue(key,value);
    }

    public putLongValue(key:String, value:bigint){
        return this.secureStorage.putLongValue(key,value);
    }

    public putFloatValue(key:String, value:any){
        return this.secureStorage.putFloatValue(key,value);
    }

    public putBooleanValue(key:String, value:boolean){
        return this.secureStorage.putBooleanValue(key,value);
    }


    public getStringValue(key:string) : string {
        return this.secureStorage.getStringValue(key);
    }

    public getIntegerValue(key:string): number {
        return this.secureStorage.getIntegerValue(key);
    }

    public getLongValue(key:string): bigint {
        return this.secureStorage.getLongValue(key);
    }

    public getFloatValue(key:string): number {
        return this.secureStorage.getFloatValue(key);
    }

    public getBooleanValue(key:string):boolean {
        return this.secureStorage.getLongValue(key);
    }

    public getStringValueOrDefault(key:string, defaultValue:string) {
        return this.secureStorage.getStringValueOrDefault(key, defaultValue);
    }

    public getIntegerValueOrDefault(key:string, defaultValue:number) {
        return this.secureStorage.getIntegerValueOrDefault(key, defaultValue);
    }

    public getLongValueOrDefault(key:string, defaultValue:bigint) {
        return this.secureStorage.getLongValueOrDefault(key, defaultValue);
    }

    public getFloatValueOrDefault(key:string, defaultValue:number) {
        return this.secureStorage.getFloatValueOrDefault(key, defaultValue);
    }

    public getBooleanValueOrDefault(key:string, defaultValue:boolean) {
        return this.secureStorage.getBooleanValueOrDefault(key, defaultValue);
    }


}

export class AnalyticsManager extends AnalyticsEventLogger implements IAnalyticsManagerDelegate {
    private static _instance: AnalyticsManager;
    private _initCompleteCallback?: IInitCompleteCallback;
    private _isInitComplete: Boolean = false;
    private _nativeAnalytics: any;

    private constructor() {
        super();
        this._nativeAnalytics = new com.sap.sam.android.plugin.samfoundation.analytics.AnalyticsManager();
    }

    public static getInstance(): AnalyticsManager {
        if (!AnalyticsManager._instance) {
            AnalyticsManager._instance = new AnalyticsManager();
        }
        return AnalyticsManager._instance;
    }

    public async init(context: any, config: any): Promise<Boolean> {
        if (await super.init(context, config) === false) {
            return Promise.resolve(false);
        }
        return new Promise((resolve, reject) => {
            this._initCompleteCallback = (isSuccess: Boolean, errorMessage?: string) => {
                isSuccess ? resolve(true) : reject(new Error(errorMessage));
            };
            this._nativeAnalytics?.initWithUserData(app.android.context, config, new AnalyticsManagerDelegate(this));
        });
    }

    public logEvent(eventInfo: string): Boolean {
        if (!this._isInitComplete || !this._nativeAnalytics) {
            return false;
        }
        this._nativeAnalytics.launchEngageActivity(app.android.context, eventInfo);
        return true;
    }

    public onInitComplete(isSuccess: Boolean, errorMessage: string) {
        this._isInitComplete = isSuccess;
        if (this._initCompleteCallback) {
            this._initCompleteCallback(isSuccess, errorMessage);
        }
    }
}

interface IAnalyticsManagerDelegate {
    onInitComplete: (isSuccess: Boolean, errorMessage: string) => void,
}

interface IInitCompleteCallback {
    (isSuccess: Boolean, errorMessage?: string) : void;
}

@NativeClass()
@Interfaces([com.sap.sam.android.plugin.samfoundation.analytics.IAnalyticsManagerDelegate])
class AnalyticsManagerDelegate extends java.lang.Object {
    private _impl: IAnalyticsManagerDelegate;

    public constructor(impl: IAnalyticsManagerDelegate) {
        super();
        this._impl = impl;
    }

    public onInitComplete(isSuccess: Boolean, errorMessage: string) {
        if (this._impl) {
            this._impl.onInitComplete(isSuccess, errorMessage);
        }
    }
}

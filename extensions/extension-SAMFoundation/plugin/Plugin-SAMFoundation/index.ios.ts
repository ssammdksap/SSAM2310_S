declare var SAMSecureStore: any;
declare var Analytics: any;

import * as app from '@nativescript/core/application';
import { AnalyticsEventLogger } from './AnalyticsEventLogger';

export class FoundationPluginManager {
    private static _instance: FoundationPluginManager;

    private secureStorage: SecureStorage;

    public init(context: any, storageConfig: string) {
        if (this.secureStorage) return;
        let nativeStore = new SAMSecureStore(storageConfig);
        this.secureStorage = new SecureStorage(nativeStore);
    }

    public updateStorageConfig(storageConfig: string) {
        this.secureStorage.updateConfig(storageConfig);
    }

    public static newSecureStorage(storageConfig: string): SecureStorage {
        let nativeStore = new SAMSecureStore(storageConfig);
        return new SecureStorage(nativeStore)
    }

    public static getInstance(): FoundationPluginManager {
        if (!FoundationPluginManager._instance) {
            FoundationPluginManager._instance = new FoundationPluginManager();
        }
        return FoundationPluginManager._instance;
    }

    public getSecureStorage(): SecureStorage {
        return this.secureStorage
    }
}

export class SecureStorage {
    private secureStorage: any;

    constructor(secureStorage: any) {
        this.secureStorage = secureStorage
    }

    public updateConfig(config) {
        this.secureStorage.updateConfig(config);
    }

    public putStringValue(key: String, value: String) {
        return this.secureStorage.putStringValueWithKeyValue(key, value);
    }

    public putIntegerValue(key: String, value: number) {
        return this.secureStorage.putIntegerValueWithKeyValue(key, value);
    }

    public putLongValue(key: String, value: bigint) {
        return this.secureStorage.putLongValueWithKeyValue(key, value);
    }

    public putFloatValue(key: String, value: any) {
        return this.secureStorage.putFloatValueWithKeyValue(key, value);
    }

    public putBooleanValue(key: String, value: boolean) {
        return this.secureStorage.putBooleanValueWithKeyValue(key, value);
    }

    public getStringValue(key: string) : string {
        return this.secureStorage.getStringValueWithKey(key);
    }

    public getIntegerValue(key: string): number {
        return this.secureStorage.getIntegerValueWithKey(key);
    }

    public getLongValue(key: string): bigint {
        return this.secureStorage.getLongValueWithKey(key);
    }

    public getFloatValue(key: string): number {
        return this.secureStorage.getFloatValueWithKey(key);
    }

    public getBooleanValue(key: string):boolean {
        return this.secureStorage.getLongValueWithKey(key);
    }

    public getStringValueOrDefault(key: string, defaultValue: string) {
        return this.secureStorage.getStringValueOrDefaultWithKeyDefaultValue(key, defaultValue);
    }

    public getIntegerValueOrDefault(key: string, defaultValue: number) {
        return this.secureStorage.getIntegerValueOrDefaultWithKeyDefaultValue(key, defaultValue);
    }

    public getLongValueOrDefault(key: string, defaultValue: bigint) {
        return this.secureStorage.getLongValueOrDefaultWithKeyDefaultValue(key, defaultValue);
    }

    public getFloatValueOrDefault(key: string, defaultValue: number) {
        return this.secureStorage.getFloatValueOrDefaultWithKeyDefaultValue(key, defaultValue);
    }

    public getBooleanValueOrDefault(key: string, defaultValue: boolean) {
        return this.secureStorage.getBooleanValueOrDefaultWithKeyDefaultValue(key, defaultValue);
    }
}

export class AnalyticsManager extends AnalyticsEventLogger {
    private static _instance: AnalyticsManager;
    private analytics: any;

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
        this.analytics = new Analytics(config);
        return Promise.resolve(true);
    }

    public logEvent(eventInfo: string): Boolean {
        if (!this.analytics) {
            return false;
        }
        this.analytics.logEvent(eventInfo);
        return true;
    }
}

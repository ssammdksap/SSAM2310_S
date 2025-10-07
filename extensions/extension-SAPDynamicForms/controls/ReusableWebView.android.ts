import { BaseWebView } from './BaseWebView';
import { WebView, LoadEventData } from '@nativescript/core/ui/web-view';
import { EventData } from '@nativescript/core/data/observable';
import { SDFWebViewClient } from './SDFWebViewClient';
import { SDFWebChromeClient } from './SDFWebChromeClient';

import SDFLogger from './SDFLogger';

declare const com: any

@NativeClass
class JSInterface extends com.sap.mobile.apps.sdf.JSInterfaceObject {
    messageHandler: (message: string) => void;

    // constructor
    constructor(messageHandler: (message: string) => void) {
        super();
        this.messageHandler = messageHandler;
    }

    public _postMessage(message: string): void {
        this.messageHandler(message);
    }
}

export class ReusableWebView extends BaseWebView {

    private _webView: WebView;
    private _hasLoaded: boolean = false;

    public static getReusableWebView(reset: boolean): BaseWebView {
        const reusableWebView = new ReusableWebView();
        ReusableWebView.reusableWebView = reusableWebView;
        BaseWebView.reusableWebView = reusableWebView;
        reusableWebView._reloadRequired = false;
        reusableWebView.initialize();
        return reusableWebView;
    }

    public getView(): any {
        return this._webView;
    }

    public viewIsNative(): boolean {
        return false;
    }

    public initialLoadPlatform(): void {
        SDFLogger.debug('ReusableWebView.initialLoadPlatform()');

        if (this._formConfig.debug) {
            android.webkit.WebView.setWebContentsDebuggingEnabled(true);
        }
        this._webView.android.addJavascriptInterface(new JSInterface(this.processJSMessage), 'AndroidListener');

        // Do not allow caching since the contents may have changed during a sync
        this._webView.android.getSettings().setCacheMode(android.webkit.WebSettings.LOAD_NO_CACHE);
        
        const wvc = new SDFWebViewClient(this._webView.android.getWebViewClient().owner);
        wvc.reusableWebView = this;
        this._webView.android.setWebViewClient(wvc);

        const wcc = new SDFWebChromeClient(this._webView.android.getWebViewClient().owner);
        wcc.reusableWebView = this;
        this._webView.android.setWebChromeClient(wcc);

        const url = BaseWebView.INITIAL_PAGE_URL;
        SDFLogger.debug(`WebView loading ${url}`);
        this._webView.android.loadUrl(url);
    }

    protected decodeBase64(b64: string): any {
        return android.util.Base64.decode(b64, android.util.Base64.DEFAULT);
    }

    public resetHeight(width: number, height: number) {
        // if (this._webView) {
        //     this._webView.frame = CGRectMake(0, 0, width, height);
        // }
    }

    protected initialize(): void {        
        this._webView = new WebView();
        this._webView.on('loadStarted', this.onLoadStarted, this);
        this._webView.on('loadFinished', this.onLoadFinished, this);
        this._webView.on('pageStarted', this.onPageStarted, this);
    }

    public evaluateJavaScript(expression: string): void {
        if (this._webView && this._webView.android)
            this._webView.android.evaluateJavascript(expression, null);
    }

    private onLoadStarted(eventData: LoadEventData) {
        //TODO: setup script manipulation for android listener
        this._webView.android.getSettings().setDisplayZoomControls(false);
    }

    private onLoadFinished(eventData: LoadEventData) {
        if (eventData.error || this._hasLoaded) {
            //TODO: log this!
            return;
        }

        this._hasLoaded = true;
        ReusableWebView.reusableWebView.reloadWebView(ReusableWebView.reusableWebView.formConfig);
    }

    private onPageStarted(eventData: EventData) {
    }

    protected loadDataIntoWebView(templateData: string, applicationName: any, formName: any, formId: any, formData: any, formStatus: any, formVersion: any, startDate: any, fontSize: any, contextXML: any, formProperties: string): void {
        // inject JS to capture console.log output and send to android
        this.evaluateJavaScript('var webkit = { messageHandlers: { formRunner: AndroidListener} };');
        const script = super.generateLoggingScript();
        this.evaluateJavaScript(script);
        super.loadDataIntoWebView(templateData, applicationName, formName, formId, formData, formStatus, formVersion, startDate, fontSize, contextXML, formProperties);
    }

    /**
     * Using the base class instead can lead to crashes
     * @param {string} message
     * @param {any} thisobject
     */
    public processJSMessage(message: any) {
        super.processJSMessage(message, ReusableWebView.reusableWebView);
    }

    /**
    * Convert A String to Base64 String
    * @param {string} textString
    * @returns {string}
    */
    public transformStringToBase64(textString: string): string {
        const text = new java.lang.String(textString);
        const data = text.getBytes('UTF-8');
        const base64String = android.util.Base64.encodeToString(data, android.util.Base64.NO_WRAP);
        return base64String;
    }
}

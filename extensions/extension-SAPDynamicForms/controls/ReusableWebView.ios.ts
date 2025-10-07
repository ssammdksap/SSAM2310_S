import { IContext } from 'mdk-core/context/IContext';
import { BaseWebView } from './BaseWebView';
import SDFLogger from './SDFLogger';

@NativeClass()
class WKScriptMessageHandlerImpl extends NSObject implements WKScriptMessageHandler {
    public static ObjCProtocols: any = [WKScriptMessageHandler];
    public locationPromise: any;
    protected _context: any;
    protected _submissionHandler: string;

    public static init(): WKScriptMessageHandlerImpl {
        const handler = <WKScriptMessageHandlerImpl>WKScriptMessageHandlerImpl.new();
        return handler;
    }

    set context(context) {this._context = context;}
    get context() {return this._context;}
    set submissionHandler(submissionHandler) {this._submissionHandler = submissionHandler;}
    get submissionHandler() {return this._submissionHandler;}

    public userContentControllerDidReceiveScriptMessage(userContentController: WKUserContentController, message: WKScriptMessage): void {
        ReusableWebView.reusableWebView.processJSMessage(message.body, undefined);
    }
}

@NativeClass()
class WKNavigationHandlerImpl extends NSObject implements WKNavigationDelegate {
    public static ObjCProtocols = [WKNavigationDelegate];
    _context: IContext;

    public setContext(context) {
        this._context = context;
    }

    public static init(): WKNavigationHandlerImpl {
        const handler = <WKNavigationHandlerImpl>WKNavigationHandlerImpl.new();
        return handler;
    }

    public webViewDecidePolicyForNavigationActionDecisionHandler?(webView: WKWebView, navigationAction: WKNavigationAction, decisionHandler: (p1: WKNavigationActionPolicy) => void): void {
        const handledSchemes = [BaseWebView.CUSTOM_SCHEME];
        const req = navigationAction.request;
        const scheme = req.URL.scheme;
        SDFLogger.debug(`entered decidePolicyForNavigationAction - method: ${req.HTTPMethod} scheme: ${scheme} url: ${req.URL.absoluteString}`);
        let response = WKNavigationActionPolicy.Allow;
        if (navigationAction.shouldPerformDownload) {
            response = WKNavigationActionPolicy.Download;
        }

        if (handledSchemes.every((handledScheme) => handledScheme !== scheme)) {
            //throw it to the OS to handle it
            SDFLogger.info(`found scheme that is not handled by default: ${scheme}`);
            if (UIApplication.sharedApplication.canOpenURL(req.URL)) {
                SDFLogger.info(`found that the os can handle this url: ${req.URL.absoluteString}`);
                UIApplication.sharedApplication.openURL(req.URL);
                response = WKNavigationActionPolicy.Cancel;
            }
        }

        decisionHandler(response);

        SDFLogger.debug('exit decidePolicyForNavigationAction');
    }

    public webViewDidFinishNavigation(webView: WKWebView, navigation: WKNavigation): void {
        SDFLogger.debug('entered webViewDidFinishNavigation');
        ReusableWebView.reusableWebView.reloadWebView(ReusableWebView.reusableWebView.formConfig);

        SDFLogger.debug('exit webViewDidFinishNavigation');
    }
}

@NativeClass()
class WKURLSchemeHandlerImpl extends NSObject implements WKURLSchemeHandler {
    public static ObjCProtocols = [WKURLSchemeHandler];
    public reusableWebView: any;

    public static init(): WKURLSchemeHandlerImpl {
        const handler = <WKURLSchemeHandlerImpl>WKURLSchemeHandlerImpl.new();
        return handler;
    }

    public webViewStartURLSchemeTask(webView: WKWebView, urlSchemeTask: WKURLSchemeTask): void {
        const req = urlSchemeTask.request;
        SDFLogger.debug(`startURLSchemeTask - method: ${req.HTTPMethod} url: ${req.URL.absoluteString}`);

        const url = req.URL;

        const data = this.reusableWebView.loadFromStore(url.absoluteString);
        if (!data) {
            SDFLogger.error('Responding with 404');
            const resp = NSHTTPURLResponse.alloc().initWithURLStatusCodeHTTPVersionHeaderFields(url, 404, 'HTTP/1.1', null);
            urlSchemeTask.didReceiveResponse(resp);
            return;
        }

        SDFLogger.info(`Responding with 200: mimeType: ${data.mimeType} length: ${data.content.length} encoding: ${data.encoding}`);
        const resp = NSURLResponse.alloc().initWithURLMIMETypeExpectedContentLengthTextEncodingName(url, data.mimeType, data.content.length, data.encoding);

        SDFLogger.debug('Sending response');
        urlSchemeTask.didReceiveResponse(resp);
        urlSchemeTask.didReceiveData(data.content);
        urlSchemeTask.didFinish();

        SDFLogger.debug('Finished URL scheme task');
    }

    public webViewStopURLSchemeTask(webView: WKWebView, urlSchemeTask: WKURLSchemeTask): void {
        SDFLogger.debug('stopURLSchemeTask');
    }
}

export class ReusableWebView extends BaseWebView {
    private _webView: WKWebView;

    private _config: WKWebViewConfiguration;
    private _urlSchemeHandler: WKURLSchemeHandlerImpl;
    private _userContentController: WKUserContentController;
    private _webviewNavigationDelegate: WKNavigationHandlerImpl;
    private _scriptMessageHandler: WKScriptMessageHandlerImpl;

    set submissionHandler(submissionHandler: string) {this._scriptMessageHandler.submissionHandler = submissionHandler;}
    get submissionHandler(): string {return this._scriptMessageHandler.submissionHandler;}

    set context(context: any) {this._context = context; this._scriptMessageHandler.context = context;}

    public static getReusableWebView(reset: boolean): BaseWebView {
        if (ReusableWebView.reusableWebView && !reset) {
            const reusableWebView = <ReusableWebView>ReusableWebView.reusableWebView;
            reusableWebView._reloadRequired = true;
            return reusableWebView;
        } else {
            const reusableWebView = new ReusableWebView();
            ReusableWebView.reusableWebView = reusableWebView;
            //reusableWebView._templateDataMap = new Map();
            reusableWebView._reloadRequired = false;
            reusableWebView.initialize();
            return reusableWebView;
        }
    }

    public getView(): any {
        return this._webView;
    }

    public viewIsNative(): boolean {
        return true;
    }

    public initialLoadPlatform(): void {
        SDFLogger.debug('ReusableWebView.initialLoadPlatform()');
        const debugDelay = this._formConfig.debugDelay || 0;

        if (debugDelay > 0) {
            this._webView.inspectable = true;
        }
        const url = NSURL.URLWithString(BaseWebView.INITIAL_PAGE_URL);
        this._webView.loadRequest(NSURLRequest.requestWithURL(url));
    }

    public decodeBase64(b64: string) {
        return NSData.alloc().initWithBase64Encoding(b64);
    }

    public resetHeight(width: number, height: number) {
        if (this._webView) {
            this._webView.frame = CGRectMake(0, 0, width, height);
        }
    }

    protected initialize(): void {
        SDFLogger.debug('ReusableWebView.initialize()');

        // initialize user content controller
        this._userContentController = WKUserContentController.new();
        this._scriptMessageHandler = WKScriptMessageHandlerImpl.init();
        this._scriptMessageHandler.context = this._context;
        this._userContentController.addScriptMessageHandlerName(this._scriptMessageHandler, 'formRunner');

        // setup config
        this._config = WKWebViewConfiguration.new();
        this._config.userContentController = this._userContentController;
        this._urlSchemeHandler = WKURLSchemeHandlerImpl.init();
        this._urlSchemeHandler.reusableWebView = this;
        this._config.setURLSchemeHandlerForURLScheme(this._urlSchemeHandler, BaseWebView.CUSTOM_SCHEME);
        this._config.websiteDataStore = WKWebsiteDataStore.nonPersistentDataStore();
        this._config.limitsNavigationsToAppBoundDomains = true;
        this._webView = WKWebView.alloc().initWithFrameConfiguration(CGRectMake(0, 0, 2000, 2000), this._config);

        this._webviewNavigationDelegate = WKNavigationHandlerImpl.init();
        this._webviewNavigationDelegate.setContext(this._context);
        this._webView.navigationDelegate = this._webviewNavigationDelegate;
    }

    public evaluateJavaScript(expression: string): void {
        this._webView.evaluateJavaScriptCompletionHandler(NSString.stringWithString(expression).description, (error: NSError) => {
            if (error !== null) {
                SDFLogger.error('JAVASCRIPT ERROR: ' + error)
                SDFLogger.debug('ATTEMPTED EVAL: ' + expression);
            }
        });
    }

    protected loadDataIntoWebView(templateData: string, applicationName: any, formName: any, formId: any, formData: any, formStatus: any, formVersion: any, startDate: any, fontSize: any, contextXML: any, formProperties: any): void {
        // inject JS to capture console.log output and send to iOS
        const script = super.generateLoggingScript();
        this.evaluateJavaScript(script);
        super.loadDataIntoWebView(templateData, applicationName, formName, formId, formData, formStatus, formVersion, startDate, fontSize, contextXML, formProperties);
    }

    /**
    * Convert A String to Base64 String
    * @param {string} textString
    * @returns {string}
    */
    public transformStringToBase64(textString) {
        const text = NSString.stringWithString(textString);
        const data = text.dataUsingEncoding(NSUTF8StringEncoding);
        // fails to compile with a 0 value. perhaps nativescript cannot handle implicit conversion to NSUInteger?
        const base64String = data.base64EncodedStringWithOptions(NSDataBase64EncodingOptions.EncodingEndLineWithLineFeed - NSDataBase64EncodingOptions.EncodingEndLineWithLineFeed);
        return base64String;
    }
}

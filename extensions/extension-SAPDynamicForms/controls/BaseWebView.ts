import { EventHandler } from 'mdk-core/EventHandler';
import { IContext } from 'mdk-core/context/IContext';
import { Context } from 'mdk-core/context/Context';
import { JsonToXml } from './JsonToXml';

import SDFLogger from './SDFLogger';

export abstract class BaseWebView {
    public static readonly CUSTOM_SCHEME = 'sdflocal';
    // Add a fake host to the URL since otherwise Android gets confused and duplicates the first path component
    public static readonly CUSTOM_URL_PREFIX = `${BaseWebView.CUSTOM_SCHEME}://sdf-host`;
    public static readonly INITIAL_PAGE_URL = `${BaseWebView.CUSTOM_URL_PREFIX}/forms/_/formload`;
    public static reusableWebView: BaseWebView;
    public static readonly SDF_CONSOLE_LOG_TAG = 'SDFConsole';

    protected _reloadRequired = false;
    protected _isApplicationSuspended = false;
    protected _context: IContext;
    protected _cacheMaxLimit: number;
    protected _isFormDataSafe: boolean = false;
    protected _formTemplateDataHandler: string;
    protected _submissionHandler: string;
    protected _formConfig: any;
    protected _isFormDataSafeCallback: ((_: boolean) => void)|undefined;
    protected _isFormDataSafeTimeout: any;
    protected _fileStore = {};

    public abstract getView(): any;
    public abstract viewIsNative(): boolean;

    public reloadRequired() {
        return this._reloadRequired;
    }

    public setIsApplicationSuspended(value) {
        this._isApplicationSuspended = value;
    }
    public getIsApplicationSuspended() {
        return this._isApplicationSuspended;
    }

    set isFormDataSafe(isFormDataSafe: boolean) {this._isFormDataSafe = isFormDataSafe;}
    get isFormDataSafe(): boolean {return this._isFormDataSafe;}
    set isFormDataSafeCallback(isFormDataSafe: ((_: boolean) => void)|undefined) {this._isFormDataSafeCallback = isFormDataSafe;};
    get isFormDataSafeCallback(): ((_: boolean) => void) | undefined {return this._isFormDataSafeCallback;};
    set isFormDataSafeTimeout(timeout: any) {this._isFormDataSafeTimeout = timeout;};
    get isFormDataSafeTimeout(): any {return this._isFormDataSafeTimeout;};
    set formTemplateDataHandler(formTemplateDataHandler: string) {this._formTemplateDataHandler = formTemplateDataHandler;}
    get formTemplateDataHandler(): string {return this._formTemplateDataHandler;}
    set submissionHandler(submissionHandler: string) {this._submissionHandler = submissionHandler;}
    get submissionHandler(): string {return this._submissionHandler;}
    set formConfig(formConfig: Object) {this._formConfig = formConfig;}
    get formConfig(): Object {return this._formConfig;}
    set context(context: IContext) {this._context = context;}
    get context(): IContext {return this._context;}

    /**
     * calls pushButton in the underlying javascript with the provided button name.
     * for everyone's sanity, the button name provided must match regex /^[-_.A-Za-z1-9]*$/
     * @param buttonName name of the button
     */
    public pressButton(buttonName) {
        // sanitize the button name
        const regex = /^[-_.A-Za-z1-9]*$/;
        if (!buttonName.match(regex)) {
            throw new Error(`pressButton button name must only contain characters that match ${regex}`);
        }
        
        this.evaluateJavaScript(`pushButton('${buttonName}')`);
    }

    public setCacheMaxLimit(cacheMaxLimit) {
        this._cacheMaxLimit = cacheMaxLimit;
    }

    public initialLoad(): void {
        // debug delay for debugger attachment.
        const debugDelay = this._formConfig.debugDelay || 0;
        setTimeout(() => this.initialLoadPlatform(), debugDelay)
    }

    protected abstract initialLoadPlatform(): void;

    public reloadWebView(formConfig: any) {
        new EventHandler().executeActionOrRule(this._formTemplateDataHandler, this._context).then((result) => {
            if (result && result.length > 0) {
                let binding = {};
                if (this.context && this.context.binding) {
                    binding = this.context.binding;
                }
                this.loadDataIntoWebView(
                    result, 
                    formConfig.applicationName, 
                    formConfig.formName, 
                    formConfig.formId, 
                    formConfig.formData, 
                    formConfig.formStatus, 
                    formConfig.formVersion, 
                    formConfig.startDate, 
                    formConfig.fontSize,
                    JsonToXml(binding),
                    formConfig.formProperties);
            }
        });
    }

    protected loadDataIntoWebView(templateData: string, applicationName, formName, formId, formData, formStatus, formVersion, startDate, fontSize, contextXML, formProperties): void {
        // method to create JSON string to call WebView's initData method
        let localFormData = formData;
        if (typeof(localFormData) !== 'string' || localFormData === 'PGZvcm0+PC9mb3JtPg==s') { // b64 to <form></form>
            localFormData = '';
        }
        const endDate = new Date().getTime();
        const timeDiff = endDate - startDate;

        const debugDelay = 0;

        // template data
        const JSMethodString = [
            templateData, 
            applicationName, 
            formName, 
            formId, 
            localFormData,
            formStatus, 
            formVersion, 
            this._cacheMaxLimit, 
            fontSize, 
            timeDiff, 
            contextXML,
            debugDelay,
            formProperties].reduce((prev, current) => {
                return prev + '\'' + String(current) + '\',';
            }, 'initData(') + '\'\')';
        
        // call Webview's initData method
        this.evaluateJavaScript(JSMethodString);
    }

    public destroyForm() {
        this.evaluateJavaScript('destroyForm()');
    }

    public warmupForm(templateData, applicationName, formName, formVersion) {
        // template data
        const JSMethodString = [
            templateData, 
            applicationName, 
            formName, 
            formVersion].reduce((prev, current) => {
                return prev + '\'' + current + '\',';
            }, 'warmupForm(') + ')';
        this.evaluateJavaScript(JSMethodString);
    }

    public getIsFormDataSafe(callback: (_: boolean) => void, timeoutms: number) {
        const currentTimeout = this.isFormDataSafeTimeout;
        // avoid multiple calls
        if (currentTimeout) {
            return;
        }
        this.isFormDataSafeCallback = callback;
        const timeoutCallback = () => {
            this.isFormDataSafeTimeout = undefined;
            this.isFormDataSafeCallback = undefined;

            callback(false);
        }

        const timeout = setTimeout(timeoutCallback, timeoutms);
        this.isFormDataSafeTimeout = timeout;
        this.isFormDataSafeCallback = callback;

        this.evaluateJavaScript('postMessageIsFormDataSafe()');
    }

    public isFormDataSafeReturned(result: boolean) {
        SDFLogger.debug('isformdatasafereturned called');
        const currentTimeout = this.isFormDataSafeTimeout;
        // avoid multiple calls
        if (!currentTimeout) {
            return;
        }

        clearTimeout(currentTimeout)

        const callback = this.isFormDataSafeCallback;
        if (callback) {
            callback(result);
        }

        this.isFormDataSafeTimeout = undefined;
        this.isFormDataSafeCallback = undefined;
    }

    public processJSMessage(message: any, thisobject: any) {
        let jsonData: any;
        let self = this;
        // android has an invalid 'this'
        if (thisobject) {
            self = thisobject;
        }
        try {
            jsonData = JSON.parse(message);
        } catch (error) {
            SDFLogger.error(`Error parsing message json: ${error}`);
            SDFLogger.debug(`invalid json: ${message}`)
            return;
        }
        const communicationType: string = jsonData['communication-type'];
        const data: string = jsonData.data;
        const eventHandler: any = new EventHandler();

        if (communicationType === 'log') {
            self.processLogMessage(message);
        } else if ((communicationType === 'isFormDataSafe')) {
            self.isFormDataSafe = data === 'true';
            self.isFormDataSafeReturned(self.isFormDataSafe);
        } else if (self.submissionHandler) {
            let ruleContext = self._context;
            if (self._context) {
                ruleContext = new Context(jsonData, self._context.element);
            }
            const promiseId = jsonData.promiseid;
            return eventHandler.executeActionOrRule(self.submissionHandler, ruleContext).then((result) => {
                let resultstring = result;
                try {
                    if (typeof resultstring !== 'string') {
                        resultstring = JSON.stringify(result);
                    }
                } catch (error) {
                    throw new Error(`Submission result not a string or json. ${error}`);
                }
                const responseJson = {
                    statusCode: 200,
                    headers: [['Content-Type', 'application/json']],
                    body: self.transformStringToBase64(resultstring).replace(/\n/g,''),
                }
                
                self.evaluateJavaScript(`SDFSubmissionProvider.promiseResolve(${promiseId}, '${JSON.stringify(responseJson)}');`);
            })
            .catch ((error) => {
                SDFLogger.error(error);
                let e = '';
                if (error && error.message) {
                    e = error.message;
                }
                const responseJson = {
                    statusCode: 500,
                    headers: [['Content-Type', 'text/plain']],
                    body: self.transformStringToBase64(e).replace(/\n/g,''),
                };
                self.evaluateJavaScript(`SDFSubmissionProvider.promiseReject(${promiseId}, '${JSON.stringify(responseJson)}');`);
            });
        } else {
            SDFLogger.error('Message recieved with no submission handler defined');
        }
    }

    public processLogMessage(message: string) {
        try {
            const msgObj = JSON.parse(message);
            const parsedMsg = typeof msgObj.message === 'string' ? msgObj.message : JSON.stringify(msgObj.message);
            switch(msgObj.level) {
                case 'log':
                case 'info':
                    SDFLogger.log(parsedMsg, BaseWebView.SDF_CONSOLE_LOG_TAG);
                    break;
                case 'debug':
                    SDFLogger.debug(parsedMsg, BaseWebView.SDF_CONSOLE_LOG_TAG);
                    break;
                case 'warn':
                    SDFLogger.warn(parsedMsg, BaseWebView.SDF_CONSOLE_LOG_TAG);
                    break;
                default:
                    SDFLogger.error(parsedMsg, BaseWebView.SDF_CONSOLE_LOG_TAG);
                    break;
            }
        } catch {
            SDFLogger.error(message, BaseWebView.SDF_CONSOLE_LOG_TAG);
        }
    }

    public abstract evaluateJavaScript(expression: string);
    public abstract resetHeight(width: number, height: number): void;
    public abstract transformStringToBase64(string: string): string;
    protected abstract decodeBase64(b64: string): any;
  
    public storeFiles(results: any) {
        for (let i = 0; i < results.length; i++) {
            const obj = results.getItem(i);
            SDFLogger.debug(`Storing '${obj.URLPath}' with content type ${obj.ContentType}`);
            const data = {
                ...this.parseContentType(obj.ContentType),
                content: this.decodeBase64(obj.FileContent)
            };
            this._fileStore[obj.URLPath] = data;
            SDFLogger.debug(`Stored '${obj.URLPath}' = mimeType: ${data.mimeType} encoding: ${data.encoding} len: ${data.content.length}`);
        }
    }
  
    private parseContentType(contentType: string | undefined) {
        if (!contentType) return { mimeType: null, encoding: null };
        const parts = contentType.split(';', 2).map(s => s.trim());
        const p1 = parts[1]?.toLowerCase();
        const charset = p1 && p1.startsWith('charset=') ? p1.slice('charset='.length) : null;
        return {
            mimeType: parts[0],
            encoding: charset
        }
    }

    public loadFromStore(url: string) {
        if (url === `${BaseWebView.CUSTOM_URL_PREFIX}/forms/_/formload`) {
            // Hack to allow relative requests for resources like /forms/_/apps/fr/style/images/sap/SAP_R_grad_scrn.png to work.
            // This will be unnecessary when Orbeon starts using Webpack for runtime files.
            url = `${BaseWebView.CUSTOM_URL_PREFIX}/forms/fr/service/formload`;
        }
        const path = url.slice(BaseWebView.CUSTOM_URL_PREFIX.length);
        SDFLogger.debug(`Attempting to load from store: ${path}`);
        const obj = this._fileStore[path];
        return obj;
    }

    protected generateLoggingScript() {
        const circularReplacer = `
            function SDFCircularReplacer() {
                const MAXDEPTH = 5;
                const ancestors = [];
                return function (key, value) {
                    if (typeof value !== "object" || value === null) {
                        return value;
                    }
                    // 'this' is the object that value is contained in,
                    // i.e., its direct parent.
                    while (ancestors.length > 0 && ancestors.at(-1) !== this) {
                        ancestors.pop();
                    }
                    if (ancestors.length > MAXDEPTH) {
                        return "[Depth limit reached]";
                    }
                    if (ancestors.includes(value)) {
                        return "[Circular]";
                    }
                    ancestors.push(value);
                    return value;
                };
            }`;
        const sources = ['debug','info','log','warn','error']
            .map(source => `
                if (typeof window.console._${source} !== 'function') {
                    window.console._${source} = window.console.${source}; 
                }
                window.console.${source} = (...msg) => {
                    window.console._${source}(msg);
                    try {
                        const message = JSON.stringify({'communication-type': 'log', level: '${source}', message: msg}, SDFCircularReplacer());
                        webkit.messageHandlers.formRunner.postMessage(message);
                    } catch (e) {
                        window.console._${source}('ERROR: ${source} invalid log message ' + e);
                    }
                };`)
            .join('');
        const script = circularReplacer + sources;

        return script;
    }
}

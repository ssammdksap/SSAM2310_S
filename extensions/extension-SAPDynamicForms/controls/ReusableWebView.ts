import { IContext } from 'mdk-core/context/IContext';

export class ReusableWebView {
    public static getReusableWebView(reset: boolean): ReusableWebView {return undefined;}
    public getView(): any {return undefined;}
    public viewIsNative(): boolean{return false;}
    public reloadRequired(): boolean {return undefined;}
    public setIsApplicationSuspended(value: boolean) {}
    public getIsApplicationSuspended(): boolean {return undefined;}
    set isFormDataSafe(isFormDataSafe: boolean) {}
    get isFormDataSafe(): boolean {return undefined;}
    set isFormDataSafeCallback(isFormDataSafe: () => void) {}
    get isFormDataSafeCallback(): () => void {return () => {};}
    set formTemplateDataHandler(formTemplateDataHandler: string) {}
    get formTemplateDataHandler(): string {return undefined;}
    set submissionHandler(submissionHandler: string) {}
    get submissionHandler(): string {return undefined;}
    set formConfig(formConfig: Object) {}
    get formConfig(): Object {return undefined;}
    set context(context: IContext) {}
    get context(): IContext {return undefined;}

    public getIsFormDataSafe(callback: (isFormDataSafe: boolean) => void, timeout: number) {callback(false)}
    public isFormDataSafeReturned(isFormDataSafe: boolean) {}
    public pressButton(buttonname: string) {}
    public setCacheMaxLimit(cacheMaxLimit) {}
    public initialLoad(): void {}
    protected initialLoadPlatform(): void {}
    public reloadWebView(formConfig: any) {}
    public destroyForm() {}
    public warmupForm(templateData, applicationName, formName, formVersion) {}
    public evaluateJavaScript(expression: string) {}
    public resetHeight(width: number, height: number): void {}
    public processJSMessage(message: any): void {}
    public processLogMessage(message: string): void {}
    public transformStringToBase64(string: string): string {return undefined;}
    public storeFiles(results: any): void {}
    public loadFromStore(url: string) {}
}
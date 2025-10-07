import { WebViewBase } from '@nativescript/core/ui/web-view/web-view-common';
import { Application } from '@nativescript/core';
import SDFLogger from './SDFLogger';

@NativeClass
export class SDFWebChromeClient extends android.webkit.WebChromeClient {
    public static FILE_CHOOSER_REQUEST_CODE: number = 25723;
    public reusableWebView: any;
    constructor(public owner: WebViewBase) {
        super();

        return global.__native(this);
    }

    public onShowFileChooser(webView: globalAndroid.webkit.WebView, filePathCallback: globalAndroid.webkit.ValueCallback<androidNative.Array<globalAndroid.net.Uri>>, fileChooserParams: globalAndroid.webkit.WebChromeClient.FileChooserParams): boolean {
        SDFLogger.debug('file chooser entered');
        const activity = Application.AndroidApplication.foregroundActivity || Application.AndroidApplication.startActivity;
        
        Application.android.on(Application.AndroidApplication.activityResultEvent, handleResult);

        function handleResult(args) {
            const requestCode = args.requestCode;
            const resultCode = args.resultCode;
            const resultIntent = args.intent;

            SDFLogger.debug(`requestcode: ${requestCode} resultCode: ${resultCode} mode: ${fileChooserParams.getMode()}`);
            if (requestCode === SDFWebChromeClient.FILE_CHOOSER_REQUEST_CODE) {
                if (resultCode === android.app.Activity.RESULT_OK) {
                    SDFLogger.debug('file chooser result received');
                    
                    let results = android.webkit.WebChromeClient.FileChooserParams.parseResult(resultCode, resultIntent);
                    
                    // multiple file selection returns in a different format
                    try {
                        let clip = resultIntent.getClipData();
                        if (clip) {
                            let count = clip.getItemCount();

                            // create a typed array
                            results = Array.create(android.net.Uri, count);
                            for (let i = 0; i < count; i++) {
                                let clipItem = clip.getItemAt(i);
                                if (clipItem) {
                                    results[i] = clipItem.getUri();
                                }
                            }
                        }
                    } catch (e) {
                        SDFLogger.error(`Error parsing multiple file selection result: ${e}`);
                    }
                    
                    filePathCallback.onReceiveValue(results);
                }
                
                Application.android.off(Application.AndroidApplication.activityResultEvent, handleResult);
            }
        }

        activity.startActivityForResult(fileChooserParams.createIntent(), SDFWebChromeClient.FILE_CHOOSER_REQUEST_CODE);
        
        return true;
    }
}

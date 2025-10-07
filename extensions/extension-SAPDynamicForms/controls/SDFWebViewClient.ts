import { WebViewBase } from '@nativescript/core/ui/web-view/web-view-common';
import { openUrl } from '@nativescript/core/utils';
import { BaseWebView } from './BaseWebView';

import SDFLogger from './SDFLogger';

// Copy of NativeScript's WebViewClientImpl plus our customizations. We can't simply extend it because
// 1. NativeScript doesn't allow extending NativeClasses
// 2. NativeScript doesn't export their class
@NativeClass
export class SDFWebViewClient extends android.webkit.WebViewClient {
  constructor(public owner: WebViewBase) {
    super();

    return global.__native(this);
  }

  public shouldOverrideUrlLoading(view: android.webkit.WebView, target: any) {
    const url: string = target instanceof android.webkit.WebResourceRequest ? target.getUrl().toString() : target;

    SDFLogger.debug(`WebViewClientClass.shouldOverrideUrlLoading(${url})`);

    // Handle schemes like mailto, tel, etc
    if (!android.webkit.URLUtil.isNetworkUrl(url)) {
      return openUrl(url);
    }

    return false;
  }

  public onPageStarted(view: android.webkit.WebView, url: string, favicon: android.graphics.Bitmap) {
    super.onPageStarted(view, url, favicon);
    const owner = this.owner;
    if (owner) {
      SDFLogger.debug(`WebViewClientClass.onPageStarted(${url}, ${favicon})`);
      owner._onLoadStarted(url, undefined);
    }
  }

  public onPageFinished(view: android.webkit.WebView, url: string) {
    super.onPageFinished(view, url);
    const owner = this.owner;
    if (owner) {
      SDFLogger.debug(`WebViewClientClass.onPageFinished(${url})`)
      owner._onLoadFinished(url, undefined);
    }
  }

  public onReceivedError(...args) {
    const view: android.webkit.WebView = args[0];

    if (arguments.length === 4) {
      const errorCode: number = args[1];
      const description: string = args[2];
      const failingUrl: string = args[3];

      super.onReceivedError(view, errorCode, description, failingUrl);

      const owner = this.owner;
      if (owner) {
        SDFLogger.debug(`WebViewClientClass.onReceivedError(${errorCode}, ${description}, ${failingUrl})`);
        owner._onLoadFinished(failingUrl, description + '(' + errorCode + ')');
      }
    } else {
      const request: any = args[1];
      const error: any = args[2];

      // before API version 23 there's no onReceiveError with 3 parameters, so it shouldn't come here
      // but we don't have the onReceivedError with 3 parameters there and that's why we are ignorint tye typescript error
      // @ts-ignore TS2554
      super.onReceivedError(view, request, error);

      const owner = this.owner;
      if (owner) {
        SDFLogger.debug(`WebViewClientClass.onReceivedError(${error.getErrorCode()}, ${error.getDescription()}, (${error.getUrl && error.getUrl()}))`);
        owner._onLoadFinished(error.getUrl && error.getUrl(), error.getDescription() + '(' + error.getErrorCode() + ')');
      }
    }
  }

  /******************************
   *     SAP customizations     *
   ******************************/

  public reusableWebView: any;

  // Intercept requests to return file contents from OData store, falling back to asset file if necessary
  public shouldInterceptRequest(webView: android.webkit.WebView, req: string | android.webkit.WebResourceRequest): android.webkit.WebResourceResponse {
    if (typeof req === 'string') {
      SDFLogger.error('String url overload for shouldInterceptRequest unsupported');
      throw new Error('String url overload for shouldInterceptRequest unsupported');
    }

    const url = req.getUrl();
    SDFLogger.info(`shouldInterceptRequest for ${url}`);

    if (url.getScheme() !== BaseWebView.CUSTOM_SCHEME) {
      SDFLogger.info(`Request not for managed scheme - returning null`);
      return null;
    }

    const data = this.reusableWebView.loadFromStore(url.toString());
    if (!data) {
      SDFLogger.info('Responding with 404');
      return new android.webkit.WebResourceResponse(null, null, 404, 'Not Found', null, null);
    }

    SDFLogger.info(`Responding with 200: mimeType: ${data.mimeType} length: ${data.content.length} encoding: ${data.encoding}`);
    const inputStream = new java.io.ByteArrayInputStream(data.content);
    return new android.webkit.WebResourceResponse(data.mimeType, data.encoding, inputStream);
  }
}

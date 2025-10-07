declare var HierarchyBridge: any;

import {HierarchyControlDelegate} from '../Common/HierarchyControlDelegate';

export class HierarchyControl {

    protected _delegate: any;

    // Returns a view
    public create(params, dataService, extension): any {
        this._delegate = HierarchyControlDelegate.init(dataService, null, null);

        let bridge = HierarchyBridge.new()
        extension._bridge = bridge;
        this._delegate.setControlExtension(extension);
        
        return bridge.viewController(params, this._delegate);
    }

    public getDelegate(): any {
        return this._delegate;
    }

    public setDelegate(delegate) {
        this._delegate = delegate;
    }
};

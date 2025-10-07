import { BaseExtension } from 'extension-Common/BaseExtension';
import { BarcodeScannerExtBridge } from 'extension-BarcodeScanner';
import { BarcodeScannerParser } from './BarcodeScannerParser';
import { Utils } from 'extension-Common/Utils';
import { ITargetServiceSpecifier } from 'mdk-core/data/ITargetSpecifier';
import { ValueResolver } from 'mdk-core/utils/ValueResolver';

export class BarcodeScannerExtension extends BaseExtension {

    protected _actionToRun: any;
    protected _itemForAction: any;
    protected _isNavigatedToEditPage = false;
    protected _isActivityNeeded = false;

    public initialize(props) {
        this._parser = new BarcodeScannerParser();
        super.initialize(props, ['Properties']);
        let barcodeScanner: BarcodeScannerExtBridge = new BarcodeScannerExtBridge();
        let vc = barcodeScanner.create(this.getParams(), this.getDataService(), this);
        this.setViewController(vc);
        this.page().actionBarHidden = true;
    }

    public getObjects(jsonDictionary, type) {
        this.getObjectsService(jsonDictionary).then(objects => {
            if (objects.length === 0) {
                // No items to scan
                // Do a BackNavigaton to prevent a possible crash
                this.runAction('/SAPAssetManager/Actions/Page/ClosePage.action', null);
            } else {
                if (Utils.isAndroid()) {
                    jsonDictionary.BusinessObjects = objects.filter(obj => !obj.ScannerData.Properties.Filter);
                    this._bridge.callback(JSON.stringify(jsonDictionary), type);
                } else {
                    jsonDictionary.Objects = objects;
                    this._bridge.callback(jsonDictionary, type);
                }
            }
        });
    }

    public getTargetService(target): ITargetServiceSpecifier {
        let tss = super.getTargetService(target);
        tss.queryOptions = this._parser.parseValue(tss.queryOptions, this.page().context);
        if (target.ReadLink) {
            tss.readLink = target.ReadLink;
            delete tss.keyProperties;
        }
        return tss;
    }

    public runActionWithInfoAndService(actionInfo, type, dataService) {
        let context = this.page().context;
        switch (type) {
            case 'Confirm':
                try {
                    super.ODataUpdate(actionInfo).then(result => {
                        if (result) {
                            this._bridge.callback(result, 'Confirm');
                        } else {
                            this._bridge.callback(result, 'Empty');
                        }
                    }, reject => {
                        console.log(reject);
                        this._bridge.callback(JSON.stringify(this.getErrorJSON()), 'Error');
                    });
                } catch (error) {
                    this._bridge.callback(error, 'Error');
                }
                break;
            case 'Edit':
                let action = actionInfo.Action;
                let target = actionInfo.Target;
                let marker = actionInfo.Marker;
                actionInfo.Target.EntitySet = this._parser.parseValue(target.EntitySet, this.page().context);
                if (target) {
                    this._isNavigatedToEditPage = true;
                    dataService.read(this.getTargetService(actionInfo.Target)).then(result => {
                        if (result.length === 1) {
                            let item = result.getItem(0);

                            if(marker && Utils.isAndroid()){
                                if(marker === 'edit'){
                                    this._actionToRun = action;
                                    this._itemForAction = item;
                                } else {
                                    this.runAction(action, item).then(results => {
                                        if (results) {
                                            this._bridge.callback('', 'Edit');
                                        }
                                    }).catch(error => {
                                        this._bridge.callback(error, 'Empty');
                                    });
                                }
                            } else {
                                this.runAction(action, item).then(results => {
                                    if (results) {
                                        if (Utils.isAndroid()) {
                                            this._bridge.callback('', 'Edit');
                                        } else {
                                            this._bridge.callback(results, 'Edit');
                                        }
                                    }
                                }).catch(error => {
                                    this._bridge.callback(error, 'Empty');
                                });
                            }
                        } else {
                            this.runAction(action, null);
                        }
                    });
                } else {
                    this.runAction(action, null);
                }
                break;
            case 'BackNavigation':
                let backNavAction = this.definition()._data.ExtensionProperties.BackNavigation;
                if (backNavAction) {
                    this.runAction(backNavAction, null);
                } else {
                    this.runAction('/SAPAssetManager/Actions/Page/ClosePage.action', null);
                }
            default:
                this._bridge.callback(JSON.stringify(actionInfo), 'Undefined');
                break;
        }
    }

    public getErrorJSON() {
        let errorTitle = this._parser.getExtensionLocalizedValue('bc_action_err_title', undefined, this.context);
        let errorMessage = this._parser.getExtensionLocalizedValue('bc_action_err_update', undefined, this.context);
        return {ErrorTitle: errorTitle, ErrorMessage: errorMessage};
    }

    public onPageLoaded(initialLoading: Boolean) {
        // Workaround: Bring up Edit screen
        if (!initialLoading && this._actionToRun != null) {
            let action = this._actionToRun;
            let item = this._itemForAction;
            this._actionToRun = null;
            this._itemForAction = null;
            this.runAction(action, item);
        }
    }

    public onDismissingModal() {
        this._bridge.callback('', 'Edit');
    }

    private getObjectsService(jsonDictionary): any {
        let entitySet = Utils.isAndroid() ? jsonDictionary.Target.EntitySet : jsonDictionary.EntitySet;
        let schema = this.getObjectsSchema(entitySet);
        // If schema is empty, return immediately
        if (Object.keys(schema).length === 0) {
            return Promise.resolve();
        }
        let targetPorperties = schema.Target;
        return new Promise((resolve, reject) => {
            let aPromises: Promise<any>[] = [];
            Object.keys(targetPorperties).forEach(property => {
                aPromises.push(ValueResolver.resolveValue(targetPorperties[property], this.page().context, true));
            });
                
            return Promise.all(aPromises).then(results => {
                let counter = 0;
                let updateSchema = JSON.parse(JSON.stringify(schema));
                Object.keys(targetPorperties).forEach(property => {
                    updateSchema.Target[property] = results[counter];
                    counter++;                      
                });

                resolve(this.getObjectsWithBinding(updateSchema));
            });
        });
    }

    private getObjectsSchema(entitySet) {
        let properties: any;
        Object.keys(this._params.BusinessObjects).forEach(sKey => {
            let object = Utils.clone(this._params.BusinessObjects[sKey]);
            Object.keys(object).forEach(key => {
                if (key === 'Target') {
                    let target = object[key];
                    Object.keys(target).forEach(targetKey => {
                        if (target[targetKey] === entitySet) {
                            properties = this._params.BusinessObjects[sKey];
                        }
                    });
                }
            });
        });
        return properties;
    }

    private getObjectsWithBinding(schema): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                this.getDataService().read(this.getTargetService(schema.Target)).then(result => {
                    // convert to a regular json array
                    let array = [];
                    for (let i = 0; i < result.length; i++) {
                        array.push(result.getItem(i));
                    }                                         
                    this.bindObjects(schema, array).then(objects => {
                        resolve(objects);
                    });
                });    
            } catch (error) {
                console.log(error);
            }
        });

    }
};

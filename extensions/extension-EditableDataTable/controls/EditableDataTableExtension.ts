import { BaseExtension } from 'extension-Common/BaseExtension';
import { Utils } from 'extension-Common/Utils';
import { NonResolvableObjects } from 'extension-Common/NonResolvableObjects';
import { ValueResolver} from 'mdk-core/utils/ValueResolver';
import { ITargetServiceSpecifier } from 'mdk-core/data/ITargetSpecifier';
import { IDataService } from 'mdk-core/data/IDataService';

import { EditableDataTableCell } from './EditableDataTableCell';
import { EditableDataTableParser } from './EditableDataTableParser';
import { EditableDataTableBridge } from 'extension-EditableDataTable';

enum CellFilter {
    NOT_FILTERED = 0,
    MANDATORY,
    MANDATORY_NOT_MODIFIED,
    MODIFIED,
}

export class EditableDataTableExtension extends BaseExtension {
    protected _delegate: any;
    protected _cellMatrix: EditableDataTableCell[][];
    protected _rowBindings: any[];
    protected _selectedRows: any[];

    public initialize(props) {
        this._parser = new EditableDataTableParser();
        super.initialize(props); 

        let edtBridge: EditableDataTableBridge = new EditableDataTableBridge();
        let nativeObjects = edtBridge.create(this.getParams(), this);
        this._delegate = nativeObjects.delegate;
        this._bridge = nativeObjects.bridge;
        this._cellMatrix = [[],[]];
        this._rowBindings = [];
        this._selectedRows = [];

        this.setViewController(nativeObjects.view);
    }

    public onCreate() {
        let params = Utils.clone(this.getParams());
        let configuration = params?.Configuration;
        let payload = {
            'NumberOfLeadingStickyColumns': configuration?.NumberOfLeadingStickyColumns ?? 0,
            'IsStickyHeaderRow': configuration?.IsStickyHeaderRow ?? true,
            'MaxLinesPerRow': configuration?.MaxLinesPerRow ?? 1,
            'IsHeaderRowVisible': configuration?.IsHeaderRowVisible ?? true,
            'IsSelectionModeEnabled': configuration?.IsSelectionModeEnabled ?? false,
            'IsSelectionColumnAlwaysVisible': configuration?.IsSelectionColumnAlwaysVisible ?? false,
            'IsReadOnly': configuration?.IsReadOnly ?? false,
            'IsCellBackgroundClear': configuration?.IsCellBackgroundClear ?? false,
            'IsSortingIconVisible': configuration?.IsSortingIconVisible ?? true
        };

        if (params?.TableContent) { // static table content
            this.executeActionOrRule(params?.TableContent, this.context).then(result => {
                for (let row = 0; row < result.RowBindings.length; row++) {
                    this._cellMatrix[row] = [];
                    this._rowBindings[row] = result.RowBindings[row];
                }

                for (let col = 0; col < result.Columns.length; col++) {
                    for (let row = 0; row < result.Columns[col].Cells.length; row++) {
                        if (Utils.isAndroid()) {
                            result.Columns[col].Cells[row].Parameters =
                                JSON.stringify(result.Columns[col].Cells[row].Parameters);
                        } else if (result.Columns[col].Cells[row].Parameters.PickerItems) {
                            result.Columns[col].Cells[row].Parameters.PickerItems =
                                JSON.stringify(result.Columns[col].Cells[row].Parameters.PickerItems);
                        }
                        this._cellMatrix[row][col] = new EditableDataTableCell(
                            this, row, col, this._rowBindings[row], result.Columns[col].Cells[row]);
                    }
                }

                payload['Columns'] = result.Columns;

                this.setTableContent(payload);
            });
        } else { // dynamic table content
            let namePromises = [];
            let widthPromises = [];
            let dynamicWidthPromises = [];
            let columnList = [];

            params.Columns.forEach((column) => {
                columnList.push({}); // place holder
                column.IsDynamicWidth = (column.IsDynamicWidth === true);
                namePromises.push(ValueResolver.resolveValue(column['HeaderName'], this.context));
                widthPromises.push(ValueResolver.resolveValue(column['PreferredWidth'], this.context));
                dynamicWidthPromises.push(ValueResolver.resolveValue(column['IsDynamicWidth'], this.context));
            });

            Promise.all(namePromises).then(results => {
                for (let i = 0; i < results.length; i++) {
                    columnList[i].HeaderName = results[i] ?? "";
                }
                Promise.all(widthPromises).then(results => {
                    let columns: {}[] = [];
                    for (let i = 0; i < results.length; i++) {
                        columnList[i].PreferredWidth = results[i] ?? 100;
                        columnList[i].Cells = [];
                        columns.push(columnList[i]);
                    }
                    Promise.all(dynamicWidthPromises).then(results => {
                        for (let i = 0; i < results.length; i++) {
                            columnList[i].IsDynamicWidth = results[i] ?? false;
                        }

                        payload['Columns'] = columns;

                        const entitySetPromise = params.Target.EntitySet.includes('.js') ?
                            this.executeActionOrRule(params.Target.EntitySet, this.context) :
                            Promise.resolve(params.Target.EntitySet);

                        const queryOptionsPromise = params.Target.QueryOptions.includes('.js') ?
                            this.executeActionOrRule(params.Target.QueryOptions, this.context) :
                            Promise.resolve(params.Target.QueryOptions);

                        return Promise.all([entitySetPromise, queryOptionsPromise]).then(results => {
                            params.Target.EntitySet = this._parser.parseValue(results[0], this.context);
                            params.Target.QueryOptions = this._parser.parseValue(results[1], this.context);

                            this.createTableContent({Row: Utils.clone(params.Row),
                                Target: Utils.clone(params.Target)}, payload);
                        });
                    });
                });
            });
        }
    }

    public onValueChange(row, column, cell) {
        const json = JSON.parse(cell);

        this._cellMatrix[row][column].setCell(json);
        this._cellMatrix[row][column].setIsModified(true);

        if (json.OnValueChange) {
            this.executeActionOrRule(json.OnValueChange, this._cellMatrix[row][column].context);
        }
    }

    public onPress(row, column, action) {
        if (action) {
            this.executeActionOrRule(action, this._cellMatrix[row][column].context);
        }
    }

    public onError(message, isDelay) {
        if (isDelay) {
            (new Promise(() => {
                setTimeout(() => {
                    this.showErrorBanner(message);
                }, 500);
            }));
        }
        this.showErrorBanner(message);
    }

    public onCellFocusChange(hasFocus) {
        const actionOrRule = hasFocus ? this.getParams().OnCellGetsFocus : this.getParams().OnCellLostFocus;
        if (actionOrRule) {
            this.executeActionOrRule(actionOrRule, this.context);
        }
    }

    public onSelectedRowsChange(selectedRows) {
        this._selectedRows = JSON.parse(selectedRows);
        const onSelectedRowsChange = this.getParams().OnSelectedRowsChange;
        if (onSelectedRowsChange) {
            this.executeActionOrRule(onSelectedRowsChange, this.context);
        }
    }

    public getAllCells() {
        return this._cellMatrix.flat();
    }

    public getRows() {
        return this._cellMatrix;
    }

    public getRowBindings() {
        return this._rowBindings;
    }

    public getRowCells(row) {
        return this._cellMatrix[row];
    }

    public getRowCellByName(row, name) {
        if (row < 0 || row >= this._cellMatrix.length) {
            return undefined;
        }
        for (let i = 0; i < this._cellMatrix[row].length; i++) {
            if (name === this._cellMatrix[row][i].getName()) {
                return this._cellMatrix[row][i];
            }
        }
        return undefined;
    }

    public getRowCellTypeByName(row, name) {
        const cell = this.getRowCellByName(row, name);
        if (cell) {
            return cell.getType();
        }
        return undefined;
    }

    public getCell(row, column) {
        return this._cellMatrix[row][column];
    }

    public getAllValues() {
        return this.getValues(CellFilter.NOT_FILTERED);
    }

    public getUpdatedValues() {
        return this.getValues(CellFilter.MODIFIED);
    }

    public getMandatoryValues(notUpdated = false) {
        return this.getValues(notUpdated ? CellFilter.MANDATORY_NOT_MODIFIED : CellFilter.MANDATORY);
    }

    public applyFilter(filteredRows) {
        this.sendCallback({ FilteredRows: (filteredRows && filteredRows.length > 0) ? filteredRows : [] }, 'ApplyFilter');
    }

    public resetFilter() {
        this.sendCallback({}, 'ResetFilter');
    }

    public setSelectedRows(selectedRows) {
        this._selectedRows = Object.assign([], selectedRows);
        this.sendCallback({ SelectedRows: (selectedRows && selectedRows.length > 0) ? selectedRows : [] }, 'SetSelectedRows');
    }

    public getSelectedRows() {
        return this._selectedRows;
    }

    public getSelectedMasterRowIndex() {
        if (this._selectedRows && this._selectedRows.length > 0) {
            return this._selectedRows[0];
        }
        return undefined;
    }

    public getSelectedDisabledRowIndexes() {
        if (this._selectedRows && this._selectedRows.length > 1) {
            return this._selectedRows.slice(1);
        }
        return [];
    }

    public paginateListPicker(target: string, currentPage: number, itemsPerPage: number) {
        this.paginateDatabase(JSON.parse(target), currentPage, itemsPerPage, 'PaginateListPicker');
    }

    public searchListPicker(target: string, searchText: string, currentPage: number, itemsPerPage: number) {
        let json = JSON.parse(target);

        if (json.Target.QueryOptions.includes('.js')) {
            this.executeActionOrRule(json.Target.QueryOptions, this.context).then(result => {
                if (result && result.length > 0) {
                    json.Target.QueryOptions = result;
                    this.searchDatabase(json, searchText.toLowerCase(), currentPage, itemsPerPage);
                }
            });
        } else {
            this.searchDatabase(json, searchText.toLowerCase(), currentPage, itemsPerPage);
        }
    }

    public localizedValue(key: string, params: string): any {
        return this._parser.getExtensionLocalizedValue(key, params, this.context);
    }

    public processQueries(queries: Object[], rowBindings = undefined): Promise<any> {
        return this.runQueries(queries, rowBindings).then(results => {
            let arrObjects = [];
            if (results.length > 0) {
                results.forEach(result => {
                    if (result.length > 0) {
                        result.forEach(item => {
                            arrObjects.push(item);
                        });
                    }
               });
            }
            return arrObjects;
        });
    }

    public runQueries(targets, rowBindings): Promise<any> {
        if (targets.length > 0) {
            let aPromises: Promise<any>[] = [];
            return new Promise((resolve, reject) => {
                targets.forEach(item => {
                    let target = Utils.clone(item.Target);
                    delete item.Target;
                    aPromises.push(this.getObjectsWithBinding(item, target, rowBindings));
                });
                return Promise.all(aPromises).then(results => {
                    resolve(results);
                });
            });
        } else {
            return Promise.resolve([]);
        }
    }

    public getObjectsWithBinding(schema, target, rowBindings): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                this.getDataService().read(this.getTargetService(target)).then(result => {
                    let array = [];
                    for (let i = 0; i < result.length; i++) {
                        array.push(result.getItem(i));
                        if (rowBindings) {
                            rowBindings[i] = result.getItem(i);
                        }
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

    public getTargetService(target): ITargetServiceSpecifier {
        return {
            entitySet: decodeURIComponent(target.EntitySet),
            keyProperties: target.KeyProperties ? target.KeyProperties : [],
            offlineEnabled: true,
            properties: target.Properties ? target.Properties : [],
            queryOptions: decodeURIComponent(target.QueryOptions),
            serviceUrl: IDataService.instance().urlForServiceName(target.Service),
            uniqueIdType: 0,
        };
    }

    public onPageUnloaded(pageExists: boolean) {
        if (!pageExists) {
            // Page is being unloaded and does not exists on the back stack
            // It should be told to drop extra resources
            this._delegate.setControlExtension(undefined);
            this._delegate = undefined;
            this.setViewController(undefined);
            this._bridge = undefined;
        }
    }

    private createTableContent(params, payload) {
        let resolveAsyncRow = async function(extension: any, params: any, row: any) {
            const colPromises = [];
            for (let col = 0; col < items.length; col++) {
                colPromises.push(extension.resolveAsyncObject(extension.context.clientAPI,
                    params.Row.Items[col], extension._rowBindings[row], nonResolvableKeys));
            }
            const colResults = await Promise.all(colPromises);
            extension._cellMatrix[row] = [];
            for (let col = 0; col < colResults.length; col++) {
                params.Row.Items[col] = colResults[col];
                if (typeof (items[col]) === 'object') {
                    onValueChangeObjects.restore(params.Row.Items[col], col);
                    actionObjects.restore(params.Row.Items[col].Parameters, col);
                    displayValueObjects.restore(params.Row.Items[col].Parameters.PickerItems, col);
                    returnValueObjects.restore(params.Row.Items[col].Parameters.PickerItems, col);
                    // icon info re-org
                    if (params.Row.Items[col].Parameters.hasOwnProperty(iconObjects.getKey())) {
                        params.Row.Items[col].Parameters.IconInfo = { Name: iconObjects.getValueByIndex(col).replace(/^.*[\\/]/, '') };
                        if (Utils.isAndroid()) { // to avoid huge duplicated data in JSON for Android
                            if (!iconSet.has(params.Row.Items[col].Parameters.IconInfo.Name)) {
                                params.Row.Items[col].Parameters.IconInfo.Icon = Utils.clone(params.Row.Items[col].Parameters.Icon);
                                iconSet.add(params.Row.Items[col].Parameters.IconInfo.Name);
                            }
                        } else { // keep Icon data for iOS because it's mandatory
                            params.Row.Items[col].Parameters.IconInfo.Icon = Utils.clone(params.Row.Items[col].Parameters.Icon);
                        }
                        delete params.Row.Items[col].Parameters.Icon;
                    }
                }
                if (Utils.isAndroid()) {
                    params.Row.Items[col].Parameters =
                        JSON.stringify(params.Row.Items[col].Parameters);
                } else if (params.Row.Items[col].Parameters.PickerItems) {
                    params.Row.Items[col].Parameters.PickerItems =
                        JSON.stringify(params.Row.Items[col].Parameters.PickerItems);
                }
                payload.Columns[col].Cells.push(params.Row.Items[col]);
                extension._cellMatrix[row][col] = new EditableDataTableCell(
                    extension, row, col, extension._rowBindings[row], params.Row.Items[col]);
            }
            return Promise.resolve();
        };

        const items = params.Row.Items;
        const onValueChangeObjects = new NonResolvableObjects('OnValueChange');
        const displayValueObjects = new NonResolvableObjects('DisplayValue');
        const returnValueObjects = new NonResolvableObjects('ReturnValue');
        const actionObjects = new NonResolvableObjects('Action');
        const iconObjects = new NonResolvableObjects('Icon');
        const iconSet = new Set();
        const nonResolvableKeys = [ onValueChangeObjects.getKey(), displayValueObjects.getKey(),
            returnValueObjects.getKey(), actionObjects.getKey() ];

        for (let i = 0; i < items.length; i++) {
            if (typeof(items[i]) === 'object') {
                displayValueObjects.cache(items[i].Parameters.PickerItems, i);
                returnValueObjects.cache(items[i].Parameters.PickerItems, i);
                onValueChangeObjects.cache(items[i], i);
                actionObjects.cache(items[i].Parameters, i);
                iconObjects.cache(items[i].Parameters, i, false);
            }
        }

        this.processQueries([params], this._rowBindings).then(async rowResults => {
            if (rowResults && rowResults.length > 0) {
                const rowPromises = [];
                let row = 0;
                for (let rowResult of rowResults) {
                    rowPromises.push(await resolveAsyncRow(this, rowResult, row));
                    row++;
                }
                Promise.all(rowPromises).then(() => {
                    this.setTableContent(payload);
                });
            } else {
                // callback metadata even there is none
                this.notifyOnLoaded();
            }
        });
    }

    private setTableContent(payload) {
        this.sendCallback(payload, 'SetTableContent');
        // notify metadata that data were loaded to native
        this.notifyOnLoaded();
    }

    private notifyOnLoaded() {
        const onLoaded = this.getParams().OnLoaded;
        if (onLoaded) {
            this.executeActionOrRule(onLoaded, this.context);
        }
    }

    private searchDatabase(json, searchText, currentPage, itemsPerPage) {
        if (!json.DisplayValue || !json.Target) {
            return;
        }

        const values = json.DisplayValue.match(/\{(.+?)\}/g);

        if (!values || values.length === 0) {
            return;
        }

        let VALUE = (v: string) => {
            return 'substringof(\'' + searchText + '\', tolower(' + v.slice(1, -1) + ')) eq true';
        }

        // build the searching filter
        let i = 0, filter = '(';
        while (i < values.length - 1) {
            filter += VALUE(values[i]) + ' or ';
            i++;
        }
        filter += VALUE(values[i]) + ')';

        // build the whole queryOptions
        let queryOptions = Utils.splitQueryOptions(json.Target.QueryOptions);
        if (queryOptions) {
            queryOptions['$filter'] = queryOptions['$filter'] ? (queryOptions['$filter'] + ' and ' + filter) : filter;
        }
        json.Target.QueryOptions = Utils.joinQueryOptions(queryOptions);

        this.paginateDatabase(json, currentPage, itemsPerPage, 'SearchListPicker');
    }

    private paginateDatabase(json, currentPage, itemsPerPage, callbackType) {
        json.Target.QueryOptions += (json.Target.QueryOptions.length > 0 ? '&' : '') + '$top=' + itemsPerPage;
        if (currentPage > 0) {
            json.Target.QueryOptions += '&$skip=' + currentPage * itemsPerPage;
        }
        this.processQueries([json]).then(result => {
            if (this._bridge != null) {
                const data = {Values: result};
                this._bridge.callback(Utils.isAndroid() ?
                    JSON.stringify(data) : data, callbackType);
            }
        });
    }

    private getValues(cellFilter: CellFilter = CellFilter.NOT_FILTERED) {
        const values = [];
        for (let i = 0; i < this._cellMatrix.length; i++) {
            const properties = {};
            for (let j = 0; j < this._cellMatrix[i].length; j++) {
                const cell = this._cellMatrix[i][j];
                if ((cellFilter === CellFilter.MANDATORY && cell.isMandatory()) ||
                    (cellFilter === CellFilter.MANDATORY_NOT_MODIFIED && cell.isMandatory() && !cell.isModified()) ||
                    (cellFilter === CellFilter.MODIFIED && cell.isModified()) ||
                     cellFilter === CellFilter.NOT_FILTERED) {
                    properties[cell.getProperty()] = cell.getValue();
                }
            }
            if (Object.entries(properties).length > 0) {
                values.push({
                    Properties: properties,
                    OdataBinding: this._rowBindings[i],
                    RowIndex: i,
                });
            }
        }
        return values;
    }

    private showErrorBanner(message) {
        const prefix = this.localizedValue('error_found', '');
        this.executeAction({
            'Name': '/SAPAssetManager/Actions/ErrorBannerMessage.action',
            'Properties': {
                'Message': prefix + ': ' + message,
            },
        });
    }
}

/*
* SEWA Order Address Fields searchable on list view 
*
*/
import ValidationLibrary from '../../../../SAPAssetManager/Rules/Common/Library/ValidationLibrary';
import PersonaLibrary from '../../../../SAPAssetManager/Rules/Persona/PersonaLibrary';
import WorkOrdersFSMQueryOption from '../../../../SAPAssetManager/Rules/WorkOrders/ListView/WorkOrdersFSMQueryOption';
import WorkOrdersListViewQueryOption from './WorkOrdersListViewQueryOption';

export default function WorkOrdersListViewQueryOptionWrapper(clientAPI) {
    if (PersonaLibrary.isFieldServiceTechnician(clientAPI)) {
        return WorkOrdersFSMQueryOption(clientAPI).then(fsmQueryOptions => {
            let queryOptions = WorkOrdersListViewQueryOption(clientAPI);
            if (!ValidationLibrary.evalIsEmpty(fsmQueryOptions)) {
                queryOptions.filter(fsmQueryOptions);
            }
            return queryOptions;
        });
    } else {
        return WorkOrdersListViewQueryOption(clientAPI);
    }
}

/*
* SEWA Order Address Fields searchable on list view MSYED
*
*/
import { WorkOrderLibrary as libWo} from '../../../../SAPAssetManager/Rules/WorkOrders/WorkOrderLibrary';
import libSuper from '../../../../SAPAssetManager/Rules/Supervisor/SupervisorLibrary';
import libCommon from '../../../../SAPAssetManager/Rules/Common/Library/CommonLibrary';
import phaseModelExpand from '../../../../SAPAssetManager/Rules/PhaseModel/PhaseModelListViewQueryOptionExpand';
import IsPhaseModelEnabled from '../../../../SAPAssetManager/Rules/Common/IsPhaseModelEnabled';
import userFeaturesLib from '../../../../SAPAssetManager/Rules/UserFeatures/UserFeaturesLibrary';

export default function WorkOrdersListViewQueryOption(context) {
    let searchString = context.searchString;
    let clockedInString = context.localizeText('clocked_in').substring('Clocked In');
    let lowercaseClockedInString = context.localizeText('clocked_in_lowercase').substring('clocked in');
    let meterQueryOptions = 'OrderISULinks/Device_Nav/RegisterGroup_Nav,OrderISULinks/Device_Nav/DeviceCategory_Nav,OrderISULinks/Device_Nav/Equipment_Nav/ObjectStatus_Nav/SystemStatus_Nav,Address/AddressCommunication,OrderISULinks/DeviceLocation_Nav/FuncLocation_Nav/Address/AddressCommunication,OrderISULinks/ConnectionObject_Nav/FuncLocation_Nav/Address/AddressCommunication,OrderISULinks/ConnectionObject_Nav/FuncLocation_Nav/ObjectStatus_Nav/SystemStatus_Nav';
    if ((searchString !== '') && (searchString === clockedInString) || (searchString === lowercaseClockedInString)) {
        let queryBuilder = context.dataQueryBuilder();
        return context.read('/SAPAssetManager/Services/AssetManager.service', 'UserTimeEntries', ['PreferenceGroup','OrderId', 'WOHeader_Nav/ObjectKey'], '$orderby=PreferenceValue desc&$top=1&$expand=WOHeader_Nav').then(function(results) {
            if (results && results.length > 0) {
                let row = results.getItem(0);
                if (row.PreferenceGroup === 'CLOCK_IN') {
                    if (userFeaturesLib.isFeatureEnabled(context, context.getGlobalDefinition('/SAPAssetManager/Globals/Features/Meter.global').getValue())) {
                        queryBuilder.expand(meterQueryOptions); 
                    }
                    queryBuilder.expand('UserTimeEntry_Nav');
                    queryBuilder.filter(`OrderId eq '${row.OrderId}'`);
                    return queryBuilder;
                }
                return queryBuilder(''); 
            }
            return queryBuilder(''); 
        }).catch(() => {
            return queryBuilder(''); //Read failure so return a blank string
        });
    }
    let filter = '';
    let filters = [];
    let queryBuilder;
    searchString = searchString.toLowerCase();
    if (searchString) {
        //Standard order filters (required when using a dataQueryBuilder)
        filters.push(`substringof('${searchString}', tolower(OrderId))`);
        filters.push(`substringof('${searchString}', tolower(WOPriority/PriorityDescription))`);
        filters.push(`substringof('${searchString}', tolower(OrderDescription))`);
        // SEWA Search  
        filters.push(`substringof('${searchString}', tolower(Address/ConsumerNumber))`);
        filters.push(`substringof('${searchString}', tolower(Address/SEWAAreaCode))`);
        filters.push(`substringof('${searchString}', tolower(Address/Building))`);
        filters.push(`substringof('${searchString}', tolower(Address/PlotNo))`);
        filters.push(`substringof('${searchString}', tolower(Address/HouseNum))`);
        

        filters.push(`substringof('${searchString}', tolower(FunctionalLocation/Address/ConsumerNumber))`);
        filters.push(`substringof('${searchString}', tolower(FunctionalLocation/Address/SEWAAreaCode))`);
        filters.push(`substringof('${searchString}', tolower(FunctionalLocation/Address/Building))`);
        filters.push(`substringof('${searchString}', tolower(FunctionalLocation/Address/PlotNo))`);
        filters.push(`substringof('${searchString}', tolower(FunctionalLocation/Address/HouseNum))`);
        
        if (libSuper.isSupervisorFeatureEnabled(context)) {
            //Supervisor assigned to filters
            filters.push(`WOPartners/any(wp : wp/PartnerFunction eq 'VW' and (substringof('${searchString}', tolower(wp/Employee_Nav/FirstName)) or substringof('${searchString}', tolower(wp/Employee_Nav/LastName))))`);
        }
        filter = '(' + filters.join(' or ') + ')';
    }
    if (libCommon.isDefined(context.binding)) {
        if (libCommon.isDefined(context.binding.isHighPriorityList)) {
            queryBuilder = libWo.getHighPriorityWorkOrdersQueryOptions(context);  
        } else if ((libSuper.isSupervisorFeatureEnabled(context)) && libCommon.isDefined(context.binding.isSupervisorWorkOrdersList)) {
            queryBuilder = libSuper.getFilterForWOPendingReview(context);  
        } else if ((libSuper.isSupervisorFeatureEnabled(context)) && libCommon.isDefined(context.binding.isTechnicianWorkOrdersList)) {
            queryBuilder = libSuper.getFilterForSubmittedWO(context);
        }
        if (queryBuilder) {
            if (userFeaturesLib.isFeatureEnabled(context, context.getGlobalDefinition('/SAPAssetManager/Globals/Features/Meter.global').getValue())) {
                queryBuilder.expand(meterQueryOptions);
            }
            if (IsPhaseModelEnabled(context)) {
                queryBuilder.expand(phaseModelExpand('ORI'));
            }
            if (filter) {
                // SEWA Business Partners Additional Expand
                queryBuilder.expand('WOPartners/Address_Nav');
                queryBuilder.filter().and(filter);
            }
            return queryBuilder;
        }
    }
    queryBuilder = libWo.getWorkOrdersListViewQueryOptions(context);
    if (IsPhaseModelEnabled(context)) {
        queryBuilder.expand(phaseModelExpand('ORI'));
    }
    if (filter) {
        queryBuilder.filter(filter);
    }
    if (libCommon.isDefined(context.binding) && libCommon.isDefined(context.binding.isInitialFilterNeeded)) {
        // getting filter values from state variable - slice(8) is need to remove '$filter='
        queryBuilder.filter(libCommon.getStateVariable(context,'WORKORDER_FILTER').slice(8));
    } 
    return queryBuilder;
}

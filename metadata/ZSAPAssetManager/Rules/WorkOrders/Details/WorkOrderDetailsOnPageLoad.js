import libWOStatus from '../../../../SAPAssetManager/Rules/WorkOrders/MobileStatus/WorkOrderMobileStatusLibrary';
import libCom from '../../../../SAPAssetManager/Rules/Common/Library/CommonLibrary';
import WorkOrderDetailsToolbarVisibility from '../../../../SAPAssetManager/Rules/WorkOrders/Details/WorkOrderDetailsToolbarVisibility';
import Logger from '../../../../SAPAssetManager/Rules/Log/Logger';

export default function WorkOrderDetailsOnPageLoad(context) {
    libCom.removeStateVariable(context, 'IgnoreToolbarUpdate');
    libCom.removeStateVariable(context, 'ZMeterNumber');
    libCom.removeStateVariable(context, 'SerialNumOrderType');
    libCom.removeStateVariable(context, 'ZOrderIDMeter');
    libCom.removeStateVariable(context, 'ZBusinessPartner');
    libCom.setStateVariable(context, 'SerialNumOrderType', context.binding.OrderType);
    libCom.setStateVariable(context,'ZOrderIDMeter', context.binding.OrderId);

    //Store Work Order Device meter number
    if (context.binding.OrderISULinks[0].Device_Nav) {
        libCom.setStateVariable(context, 'ZMeterNumber', context.binding.OrderISULinks[0].Device_Nav.Device); // set Assigned Work order meter number
    }

    //Store Work order business partner details
    if (context.binding.WOPartners[0].Address_Nav) {
        let AddressNum = context.binding.WOPartners[0].Address_Nav.AddressNum
        return context.read('/SAPAssetManager/Services/AssetManager.service', 'MyWorkOrderPartners', [], "$filter=AddressNum eq '" + AddressNum + "'").then(order => {
            if (order.getItem.length > 0) {
                libCom.setStateVariable(context, 'ZBusinessPartner', order.getItem(0).Partner);
                return true;
            }
        });

    }

    // Hide the action bar based if order is complete and set the flag indicating if action items are visible or not
    return libWOStatus.isOrderComplete(context).then(status => {
        if (status) {
            context.setActionBarItemVisible(0, false);
        }
        return WorkOrderDetailsToolbarVisibility(context).then(visibility => {
            let toolbar = context.getToolbar();
            if (toolbar) {
                try {
                    toolbar.setVisible(visibility);
                } catch (error) {
                    Logger.error('Toolbar visibility', error);
                }
            }
        });
    });
}

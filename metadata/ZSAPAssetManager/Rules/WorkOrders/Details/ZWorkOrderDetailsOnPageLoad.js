import libWOStatus from '../../../../SAPAssetManager/Rules/WorkOrders/MobileStatus/WorkOrderMobileStatusLibrary';
import libCom from '../../../../SAPAssetManager/Rules/Common/Library/CommonLibrary';
import WorkOrderDetailsToolbarVisibility from '../../../../SAPAssetManager/Rules/WorkOrders/Details/WorkOrderDetailsToolbarVisibility';
import Logger from '../../../../SAPAssetManager/Rules/Log/Logger';
import ZGetPartnerDetails from './ZGetPartnerDetails';
import ZGetDeviceSerialNumber from './ZGetDeviceSerialNumber';


export default function WorkOrderDetailsOnPageLoad(context) {
    libCom.removeStateVariable(context, 'IgnoreToolbarUpdate');
    libCom.removeStateVariable(context, 'ZMeterNumber');
    libCom.removeStateVariable(context, 'SerialNumOrderType');
    libCom.removeStateVariable(context, 'ZOrderIDMeter');
    libCom.removeStateVariable(context, 'ZBusinessPartner');
    libCom.removeStateVariable(context, 'ZDeviceSerialNum');
    libCom.setStateVariable(context, 'SerialNumOrderType', context.binding.OrderType);
    libCom.setStateVariable(context, 'ZOrderIDMeter', context.binding.OrderId);
    if (context.binding.WOHeader) {
        libCom.setStateVariable(context, 'SerialNumOrderType', context.binding.WOHeader.OrderType);
    }
    if (context.binding.WOHeader) {
        libCom.setStateVariable(context, 'ZOrderIDMeter', context.binding.WOHeader.OrderId);
    }

    //Store Work Order Device meter number
    if (context.binding.OrderISULinks[0] && context.binding.OrderISULinks[0].Device_Nav) {
        libCom.setStateVariable(context, 'ZMeterNumber', context.binding.OrderISULinks[0].Device_Nav.Device); // set Assigned Work order meter number
    }

    //Store Work order business partner details
    if (context.binding.WOPartners[0]) {
        let AddressNum = context.binding.WOPartners[0].Address_Nav.AddressNum;
        ZGetPartnerDetails(context, AddressNum);
    }

    //Store Work order Serial number for Installation order.
    if (context.binding) {
        ZGetDeviceSerialNumber(context);
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

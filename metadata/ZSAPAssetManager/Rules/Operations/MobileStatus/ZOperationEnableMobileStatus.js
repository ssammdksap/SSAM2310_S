/**
* GAP293 - Disable Start Operation if System Status contains WCM & User Status is not FLIV or PSSP
*/
import OperationEnableMobileStatus from '../../../../SAPAssetManager/Rules/Operations/MobileStatus/OperationEnableMobileStatus';

export default function ZOperationEnableMobileStatus(context) {
    var enable = OperationEnableMobileStatus(context);

    if (context.binding.WOHeader) {
        return context.read('/SAPAssetManager/Services/AssetManager.service', 'MyWorkOrderHeaders', [], "$filter=OrderId eq '" + context.binding.WOHeader.OrderId + "'&$expand=OrderMobileStatus_Nav").then(order => {
            if (order.getItem.length > 0) {
                const WCM = context.getGlobalDefinition('/ZSAPAssetManager/Globals/MobileStatus/WCMStatus.global').getValue();
                let sysStatus = order.getItem(0).OrderMobileStatus_Nav.SystemStatus;
                if (sysStatus.includes(WCM)) {
                    const FLIV = context.getGlobalDefinition('/ZSAPAssetManager/Globals/MobileStatus/FLIVUserStatus.global').getValue();
                    const PSSP = context.getGlobalDefinition('/ZSAPAssetManager/Globals/MobileStatus/PSSPUserStatus.global').getValue();
                    let userStatus = order.getItem(0).OrderMobileStatus_Nav.UserStatus;
                    if (userStatus === FLIV || userStatus === PSSP)
                        return enable;
                    return Promise.resolve(false);
                }
                return enable;
            } else {
                return enable;
            }
        });
    }
    return enable;
}
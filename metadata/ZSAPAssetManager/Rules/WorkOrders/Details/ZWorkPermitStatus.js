/**
* GAP293 - Return the User Status description if System Status contains WCM
*/
export default function ZWorkPermitStatus(context) {

    let sysStatus = context.binding.OrderMobileStatus_Nav.SystemStatus;
    const WCM = context.getGlobalDefinition('/ZSAPAssetManager/Globals/MobileStatus/WCMStatus.global').getValue();

    if (sysStatus.includes(WCM)) {
        let userStatusCode = context.binding.OrderMobileStatus_Nav.UserStatusCode;
        const STATUSPROFILE = context.getGlobalDefinition('/ZSAPAssetManager/Globals/MobileStatus/WCMStatusProfile.global').getValue();
        return context.read('/SAPAssetManager/Services/AssetManager.service', 'UserStatuses', [], "$filter=UserStatus eq '" + userStatusCode + "' and StatusProfile eq '" + STATUSPROFILE + "'").then(status => {
            if (status.getItem.length > 0) {
                return status.getItem(0).StatusText;
            } else {
                return context.binding.OrderMobileStatus_Nav.UserStatus;
            }
        });
    } else {
        return '';
    }

    
}
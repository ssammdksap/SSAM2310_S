/**
* GAP293 - Return the new tag object for Work Permit Status
*/

import ZWorkPermitStatus from './ZWorkPermitStatus.js';

export default function ZWorkPermitTag(context) {
    var binding = context.getPageProxy().binding;
    var permitTag = {
        "Text": "",
        "Color": "red"
    };
    
    let userStatus = binding.OrderMobileStatus_Nav.UserStatus;
    const FLIV = context.getGlobalDefinition('/ZSAPAssetManager/Globals/MobileStatus/FLIVUserStatus.global').getValue();
    if(userStatus === FLIV)
        permitTag.Color = "green";

    return Promise.resolve(ZWorkPermitStatus(context)).then(text => {
        permitTag.Text = text;
        return permitTag;
    });
}
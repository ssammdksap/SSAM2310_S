/**
*  Notification Activity Create Update Required Fields - Make Comments Mandatory for ZOTR - Others Catalog Codes
* @param {IClientAPI} clientAPI
*/

import libCommon from '../../../../SAPAssetManager/Rules/Common/Library/CommonLibrary';

export default function NotificationActivityCreateUpdateRequired(context) {
    let requiredFields = ['DescriptionTitle',
        'GroupLstPkr',
        'CodeLstPkr'];
    const code = libCommon.getControlValue(libCommon.getControlProxy(context, 'CodeLstPkr'));
    const othCode = libCommon.getAppParam(context, 'ZEXCEPTIONS', 'OtherExceptions');

    if (code === othCode && libCommon.IsOnCreate(context)) {
        requiredFields.push('LongTextNote');
    }

    return requiredFields;

}
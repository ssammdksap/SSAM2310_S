/**
* Describe this function...
* @param {IClientAPI} clientAPI
*/
import libCommon from '../../../../SAPAssetManager/Rules/Common/Library/CommonLibrary';
export default function ZGetBusinessPartner(context) {
    let ZBusinessPartner = libCommon.getStateVariable(context, 'ZBusinessPartner');
    return ZBusinessPartner;

}
import common from '../../../../SAPAssetManager/Rules/Common/Library/CommonLibrary';

export default function GetMultifactor(context) {

    var MFValue = common.getTargetPathValue(context, '#Control:QuantityFactor/#Value')
    if (MFValue) {
        return MFValue;
    } else {
        return "";
    }

}

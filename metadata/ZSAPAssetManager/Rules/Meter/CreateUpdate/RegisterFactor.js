/**
* GAP095 and GAP121S Pass Register Factor based on Device Category 
* @param {IClientAPI} clientAPI
*/
import common from '../../../../SAPAssetManager/Rules/Common/Library/CommonLibrary';

export default function RegisterFactor(context) {
    return context.read('/SAPAssetManager/Services/AssetManager.service', context.getClientData().DeviceReadLink, [], '$expand=DeviceCategory_Nav').then(function(result) {
      
        let ctMeterCategory = common.getAppParam(context, 'ZMeterCategory', 'CTMeter');
        let RegisterFactorfromUI = context.evaluateTargetPath('#Control:RegisterFactor/#Value');
        
        if (result.length > 0 && result.getItem(0) && RegisterFactorfromUI && context.binding.Device_Nav.DeviceCategory_Nav.Description && context.binding.Device_Nav.DeviceCategory_Nav.Description == ctMeterCategory) {
            return RegisterFactorfromUI/5;
        } else {
            return RegisterFactorfromUI;
        }
    }).catch(function() {
        return RegisterFactorfromUI;
    });
}
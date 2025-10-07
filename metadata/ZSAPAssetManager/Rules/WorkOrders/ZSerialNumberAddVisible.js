
/**
* New Requirement to enable Add Serial number for specific CS orders that are configured in Config panel. 
*
*/
import common from '../../../SAPAssetManager/Rules/Common/Library/CommonLibrary';

export default function ZSerialNumberAddVisible(context) {
	let SerialNumAllowedTypes  =  common.getAppParam(context, 'ZSERIALNUMENABLE', 'MeterOrderTypes');
    let SerialNumAllowedTypesA = SerialNumAllowedTypes.split(","); 
    let OrderType = context.binding.OrderType;
    if(SerialNumAllowedTypes){
    	if (SerialNumAllowedTypesA.includes(OrderType)){
        	return true;
    	}
		 else {
		 	return false;
		 }
    }
    else {
    	return false;
    }
	
}


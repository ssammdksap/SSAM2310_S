/**
* SEWA This function  points to correct Entity Set for address fields 
* @param {IClientAPI} clientAPI
*/
export default function WorkOrderAddressEntitySet(context) {

    var woHeaderAddress = context.binding.AddressNum;

    if (context.binding.AddressNum === '' || context.binding.AddressNum === null || context.binding.AddressNum === undefined) {
        if (context.binding.FunctionalLocation)
            return context.binding['@odata.readLink'] + '/FunctionalLocation/Address';
        else
            return context.binding;
    }
    else
        return context.binding['@odata.readLink'] + '/Address';


}
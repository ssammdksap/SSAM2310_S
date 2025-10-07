/**
* Format Telephone Number
* @param {IClientAPI} clientAPI
*/
export default function WorkOrderTelNumberFormat(context) {
    return context.binding.AddressCommunication[0].TelNumber;
}
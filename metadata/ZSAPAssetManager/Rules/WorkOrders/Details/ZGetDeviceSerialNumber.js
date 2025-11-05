/**
* Describe this function...
* @param {IClientAPI} clientAPI
*/
import QueryBuilder from '../../../../SAPAssetManager/Rules/Common/Query/QueryBuilder';
import libCom from '../../../../SAPAssetManager/Rules/Common/Library/CommonLibrary';
// export default function ZGetDeviceSerialNumber(context) {

export default async function ZGetDeviceSerialNumber(context) {

    //Get Serial number for installation order 

    let queryBuilder = new QueryBuilder();
    let binding = context.binding;
    let orderId = binding.OrderId;
    let operationNo = binding.OperationNo;

    if (orderId) {
        queryBuilder.addFilter(`OrderId eq '${orderId}'`);
    }

    if (operationNo) {
        queryBuilder.addFilter(`OperationNo eq '${operationNo}'`);
    }
    if (queryBuilder) {
        return context.read('/SAPAssetManager/Services/AssetManager.service', 'MyWorkOrderComponentMatDocs', [], queryBuilder.build()).then(results2 => {
            if (results2.getItem(0)) {
                let MatDocNum = results2.getItem(0).MaterialDocNumber;

                return context.read('/SAPAssetManager/Services/AssetManager.service', 'MatDocItemSerialNums', [], "$filter=MaterialDocNumber eq '" + MatDocNum + "'").then(results3 => {
                    if (results3.getItem(0)) {
                        libCom.setStateVariable(context, 'ZDeviceSerialNum', results3.getItem(0).SerialNum);
                        return true
                    } else {
                        libCom.setStateVariable(context, 'ZDeviceSerialNum', "");
                    }
                })

            }

        });
    }
}
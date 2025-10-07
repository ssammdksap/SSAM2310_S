import libCom from '../../../../SAPAssetManager/Rules/Common/Library/CommonLibrary';

export default function StorageLocationQueryOptions(context) {
    let queryOptions = '$orderby=StorageLocation';
    let plant = context.binding.Plant;
    let WOHeadBinding = context.read('/SAPAssetManager/Services/AssetManager.service', 'MyWorkOrderHeaders', [], "$filter=OrderId eq '" + context.binding.OrderId + "'")
    let OrderType = "";
    return WOHeadBinding.then(results => {
        if (results && results.length > 0) {
            OrderType = results.getItem(0).OrderType;
        }
        if (context.binding && context.binding.Plant) {

            if (plant == "7001" && OrderType == "0020") {
                let ResidentialSloc = libCom.getAppParam(context, 'ZRESIDENTIALSLOC', 'ResidentialSloc');
                let ResidentialSlocArry = ResidentialSloc.split(",");

                let resTypeFilterString = ResidentialSlocArry.map(type => `StorageLocation eq '${type}'`).join(' or ');

                queryOptions = `$orderby=StorageLocation&$filter=Plant eq '${plant}' and (${resTypeFilterString})`

            } else if (plant == "7001" && OrderType == "0031") {

                let CommercialSloc = libCom.getAppParam(context, 'ZCOMMERCIALSLOC', 'CommercialSloc');
                let CommercialSlocArry = CommercialSloc.split(",");

                let ComTypeFilterString = CommercialSlocArry.map(type => `StorageLocation eq '${type}'`).join(' or ');

                queryOptions = `$orderby=StorageLocation&$filter=Plant eq '${plant}' and (${ComTypeFilterString})`

            } else {
                queryOptions = `$orderby=StorageLocation&$filter=Plant eq '${context.binding.Plant}'`;
            }
        }
        return queryOptions;
    })
}
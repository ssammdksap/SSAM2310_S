import ResetValidationOnInput from '../../../../SAPAssetManager/Rules/Common/Validation/ResetValidationOnInput';
import Logger from '../../../../SAPAssetManager/Rules/Log/Logger';
import UpdateOnlineQueryOptions from '../../../../SAPAssetManager/Rules/Parts/CreateUpdate/UpdateOnlineQueryOptions';
import libCom from '../../../../SAPAssetManager/Rules/Common/Library/CommonLibrary';

export default function PlantPickerOnChange(context) {
    try {
        ResetValidationOnInput(context);
        let plant = '';

        if (context.getValue().length > 0) {
            plant = context.getValue()[0].ReturnValue;
        }

        if (plant) {
            let storageLocationLstPkr = context.getPageProxy().evaluateTargetPathForAPI('#Control:StorageLocationLstPkr');
            let storageLocationLstPkrSpecifier = storageLocationLstPkr.getTargetSpecifier();
            //start
            let storagelocationQueryOptions = "";
            if (plant == "7001" && (context.binding.OrderType == "0020" || context.binding.WOHeader.OrderType =="0020")) {
                let ResidentialSloc = libCom.getAppParam(context, 'ZRESIDENTIALSLOC', 'ResidentialSloc');
                let ResidentialSlocArry = ResidentialSloc.split(",");

                let resTypeFilterString = ResidentialSlocArry.map(type => `StorageLocation eq '${type}'`).join(' or ');

                storagelocationQueryOptions = `$orderby=StorageLocation&$filter=Plant eq '${plant}' and (${resTypeFilterString})`

                //let storagelocationQueryOptions = `$orderby=StorageLocation&$filter=Plant eq '${plant}' `;
                //storagelocationQueryOptions = `$orderby=StorageLocation&$filter=Plant eq '${plant}' and (StorageLocation eq 'VN01' or StorageLocation eq 'VN02' or StorageLocation eq 'VN03' or StorageLocation eq 'VN04' or StorageLocation eq 'VN05' or StorageLocation eq 'VN06' or StorageLocation eq 'VN07' or StorageLocation eq 'VN08' or StorageLocation eq 'VN09' or StorageLocation eq 'VN10' or StorageLocation eq 'VN11' or StorageLocation eq 'VN12' or StorageLocation eq 'VN13' or StorageLocation eq 'VN14' or StorageLocation eq 'VN14' or StorageLocation eq 'VN15' or StorageLocation eq 'VN16' or StorageLocation eq 'VN17' or StorageLocation eq 'VN18' or StorageLocation eq 'VN19' or StorageLocation eq 'VN20' or StorageLocation eq 'VN21' or StorageLocation eq 'VN22' or StorageLocation eq 'VN23' or StorageLocation eq 'VN24' or StorageLocation eq 'VN25' or StorageLocation eq 'VN26') `;
            } else if (plant == "7001" && (context.binding.OrderType == "0031" || context.binding.WOHeader.OrderType =="0031")) {

                let CommercialSloc = libCom.getAppParam(context, 'ZCOMMERCIALSLOC', 'CommercialSloc');
                let CommercialSlocArry = CommercialSloc.split(",");

                let ComTypeFilterString = CommercialSlocArry.map(type => `StorageLocation eq '${type}'`).join(' or ');

                storagelocationQueryOptions = `$orderby=StorageLocation&$filter=Plant eq '${plant}' and (${ComTypeFilterString})`

            } else {
                storagelocationQueryOptions = `$orderby=StorageLocation&$filter=Plant eq '${plant}' `;
            }
            // let storagelocationQueryOptions = `$orderby=StorageLocation&$filter=Plant eq '${plant}' `;
            //end
            storageLocationLstPkrSpecifier.setEntitySet('StorageLocations');
            storageLocationLstPkrSpecifier.setQueryOptions(storagelocationQueryOptions);
            storageLocationLstPkrSpecifier.setReturnValue('{StorageLocation}');
            storageLocationLstPkr.setTargetSpecifier(storageLocationLstPkrSpecifier);
            UpdateOnlineQueryOptions(context);
        }

    } catch (err) {
        /**Implementing our Logger class*/
        Logger.error(context.getGlobalDefinition('/SAPAssetManager/Globals/Logs/CategoryParts.global').getValue(), `PartLibrary.partCreateUpdateOnChange(PlantLstPkr) error: ${err}`);
    }
}

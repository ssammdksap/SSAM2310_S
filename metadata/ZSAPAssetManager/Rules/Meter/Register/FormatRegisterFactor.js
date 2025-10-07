export default function FormatRegisterFactor(context) {
   
    let register = context.binding.RegisterNum;
    let registerGroup = context.binding.RegisterGroup;
    return context.read('/SAPAssetManager/Services/AssetManager.service', 'Registers', [], `$filter=RegisterGroup eq '${registerGroup}' and RegisterNum eq '${register}'&$orderby=RegisterNum`).then(function(result) {
        if (result && result.length > 0) {
            if (result.getItem(0).RegisterFactor) {
                return context.localizeText(result.getItem(0).RegisterFactor);
            }
            return '-';
        } else {
            return '-';
        }
    });
}

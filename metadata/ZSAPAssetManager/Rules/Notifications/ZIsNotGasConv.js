
export default function ZIsNotGasConv(context) {
    let binding = context.binding;
    if (binding['@odata.type'] !== '#sap_mobile.MyNotificationHeader') {
        binding = context.getPageProxy().binding;
    }

    if (binding.NotificationType === '31' || binding.NotificationType === '20')
        return false;
    else if (binding.OrderType === '0031' || binding.OrderType === '0020')
        return false;
    else if (binding.WOHeader.OrderType === '0031' || binding.WOHeader.OrderType === '0020')
        return false;
    else
        return true;

}
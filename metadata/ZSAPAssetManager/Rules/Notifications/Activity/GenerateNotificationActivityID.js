import GenerateLocalID from '../../../../SAPAssetManager/Rules/Common/GenerateLocalID';

export default function GenerateNotificationActivityID(context) {
    if (context.binding && context.binding.ActivitySequenceNumber) {
        return context.binding.ActivitySequenceNumber;
    }

    // UAT Defect - Added condition to cater for Add Activity from Work Order Header Details Page
    if (context.binding['@odata.type'] === '#sap_mobile.MyWorkOrderHeader')
        return GenerateLocalID(context, context.binding['@odata.readLink'] + '/Notification/Activities', 'ActivitySequenceNumber', '0000', '', '');
    else

        return GenerateLocalID(context, context.binding['@odata.readLink'] + '/Activities', 'ActivitySequenceNumber', '0000', '', '');
}



// UAT Defect - Created this rule, so that proper read link can be returned 
// when Add Activity is done from Work Order Details Page

export default function ZNotificationActivityCreateReadLink(context) {
    if (context.binding['@odata.type'] === '#sap_mobile.MyWorkOrderHeader')
        return context.binding['@odata.readLink'] + '/Notification';
    else
        return context.binding['@odata.readLink'];
}
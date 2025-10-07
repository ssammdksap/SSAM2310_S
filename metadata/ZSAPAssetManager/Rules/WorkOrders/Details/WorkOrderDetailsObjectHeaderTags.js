import libWoMobile from '../../../../SAPAssetManager/Rules/WorkOrders/MobileStatus/WorkOrderMobileStatusLibrary';
import libClock from '../../../../SAPAssetManager/Rules/ClockInClockOut/ClockInClockOutLibrary';
import libCommon from '../../../../SAPAssetManager/Rules/Common/Library/CommonLibrary';
import checkDigitalSignatureState from '../../../../SAPAssetManager/Rules/DigitalSignature/CheckDigitalSignatureState';
import digitalSigLib from '../../../../SAPAssetManager/Rules/DigitalSignature/DigitalSignatureLibrary';
import ZWorkPermitTag from './ZWorkPermitTag.js';
import { WorkOrderLibrary as libWO } from '../../../../SAPAssetManager/Rules/WorkOrders/WorkOrderLibrary';

export default function WorkOrderDetailsObjectHeaderTags(context) {
    let binding = context.getBindingObject();
    var tags = [];
    tags.push(context.getBindingObject().OrderType);
   
    if (context.getPageProxy().getClientData().isWOSigned) {
        tags.push(context.localizeText('SIGNED'));
    } 
    if (binding.MarkedJob && binding.MarkedJob.PreferenceValue && binding.MarkedJob.PreferenceValue === 'true') {
        tags.push(context.localizeText('FAVORITE'));
    }
    return libWoMobile.headerMobileStatus(context).then((mStatus) => {
        if (mStatus === 'D-COMPLETE') {
            return tags;
        }
        var woStarted = libCommon.getAppParam(context, 'MOBILESTATUS', context.getGlobalDefinition('/SAPAssetManager/Globals/MobileStatus/ParameterNames/StartParameterName.global').getValue());
        if (libClock.isBusinessObjectClockedIn(context) && libClock.allowClockInOverride(context, mStatus)) { //Clock in/out feature enabled and user is clocked in to this WO, regardless of mobile status
            tags.push(context.localizeText(woStarted) + '-' + context.localizeText('clocked_in'));
            if (digitalSigLib.isDigitalSignatureEnabled(context)) {
                return checkDigitalSignatureState(context).then(function(state) {
                    if (state !== '') {
                        tags.push(state);
                        return tags;
                    } else {
                        return tags;
                    }
                }).catch(() => {
                    return tags;
                 });
            } else {
                return tags;
            }
        } else {
            tags.push(context.localizeText(mStatus));
            if (digitalSigLib.isDigitalSignatureEnabled(context)) {
                return checkDigitalSignatureState(context).then(function(state) {
                    if (state !== '') {
                        tags.push(context.localizeText('signed'));
                        return tags;
                    } else {
                        return tags;
                    }
                }).catch(() => {
                    return tags;
                 });
            } else {
                return Promise.resolve(ZWorkPermitTag(context)).then(permitTag => {
                    tags.push(context.localizeText(permitTag));
                    return tags;
                });
                //return tags;
            }
        }
    }).then((result) => {
        return libWO.addTagsForWCMAndCreatedWorkOrder(context, result);
    });
}

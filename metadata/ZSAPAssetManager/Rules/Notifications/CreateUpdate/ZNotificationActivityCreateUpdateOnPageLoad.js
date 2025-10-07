import libCommon from '../../../../SAPAssetManager/Rules/Common/Library/CommonLibrary';
import style from '../../../../SAPAssetManager/Rules/Common/Style/StyleFormCellButton';
import hideCancel from '../../../../SAPAssetManager/Rules/ErrorArchive/HideCancelForErrorArchiveFix';

export default function NotificationActivityCreateUpdateOnPageLoad(context) {
    var caption;
    hideCancel(context);
    if (libCommon.IsOnCreate(context))	{
        caption = context.localizeText('add_serial_number');
    } else	{
        caption = context.localizeText('add_serial_number');
    }
    context.setCaption(caption);
    style(context, 'DiscardButton');
    libCommon.saveInitialValues(context);
}

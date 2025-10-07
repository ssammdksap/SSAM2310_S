import CommonLibrary from '../../../../SAPAssetManager/Rules/Common/Library/CommonLibrary';

/**
* Function that targets validation library to clear input if something was entered
* @param {IClientAPI} context
*/
export default function ZOnMeterCodeTypeChange(context) {
    CommonLibrary.clearValidationOnInput(context);
    let MeterNumber = CommonLibrary.getStateVariable(context, 'ZMeterNumber');
    let SerialNumOrderType = CommonLibrary.getStateVariable(context, 'SerialNumOrderType');

    if (context.getValue()[0].ReturnValue == "MINS") {
        if (SerialNumOrderType == "0014") {
            let ScannerCtr = context.getPageProxy().getControl('FormCellContainer').getControl('ScannerButton');
            let DescriptionTitleCtr = context.getPageProxy().getControl('FormCellContainer').getControl('DescriptionTitle');
            ScannerCtr.setVisible(false);
            DescriptionTitleCtr.setEditable(false);
            DescriptionTitleCtr.setValue("");
        } else {
            let ScannerCtr = context.getPageProxy().getControl('FormCellContainer').getControl('ScannerButton');
            let DescriptionTitleCtr = context.getPageProxy().getControl('FormCellContainer').getControl('DescriptionTitle');
            ScannerCtr.setVisible(true);
            DescriptionTitleCtr.setEditable(true);
            DescriptionTitleCtr.setValue("");
        }

    }else {
        let ScannerCtr = context.getPageProxy().getControl('FormCellContainer').getControl('ScannerButton');
        let DescriptionTitleCtr = context.getPageProxy().getControl('FormCellContainer').getControl('DescriptionTitle');
        ScannerCtr.setVisible(false);
        DescriptionTitleCtr.setEditable(false);
        DescriptionTitleCtr.setValue(MeterNumber);
    }

}

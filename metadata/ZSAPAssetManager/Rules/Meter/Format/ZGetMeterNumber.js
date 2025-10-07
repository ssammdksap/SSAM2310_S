import libCom from '../../../../SAPAssetManager/Rules/Common/Library/CommonLibrary';

export default function MeterObjectCell(context) {

    let MeterNumber = libCom.getStateVariable(context, 'ZMeterNumber')
    return MeterNumber

}
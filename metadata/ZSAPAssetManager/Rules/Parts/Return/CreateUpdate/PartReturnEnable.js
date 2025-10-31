import libPart from '../../PartLibrary';
import ZEnableMIGO from '../../../UserAuthorizations/WorkOrders/ZEnableMIGO';

export default function PartReturnEnable(pageProxy) {
    var enable = ZEnableMIGO(pageProxy);

    return libPart.getLocalQuantityIssued(pageProxy, pageProxy.binding).then(localQty => {
        if (pageProxy.binding.WithdrawnQuantity + localQty > 0 && enable) {
            return true;
        }
        return false;
    });
    
    //  return libPart.getLocalQuantityIssued(pageProxy, pageProxy.binding).then(localQty => {
    //     if (pageProxy.binding.WithdrawnQuantity + localQty > 0) {
    //         return true;
    //     }
    //     return false;
    // });
}

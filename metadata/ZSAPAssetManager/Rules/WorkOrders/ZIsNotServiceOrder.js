import { WorkOrderLibrary as libWo } from './WorkOrderLibrary';

/**
 * Checks to see if object in context.binding is a service order or not.
 * Used for showing Add Attachment on Operation.
 * 
 * @param {*} context
 * @returns true if it's not a service order.
 * test
 */
export default function IsServiceOrder(context) {
    return libWo.isServiceOrder(context).then(isSrvOrd => {
        return (!isSrvOrd);
    });
}
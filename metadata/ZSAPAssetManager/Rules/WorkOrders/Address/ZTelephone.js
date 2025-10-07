/**
* Defect 8000000895 - Order Details Page comes blank when FL is blank
* Returns the Telephone from Address Communication
*/
export default function ZTelephone(context) {
    let woHeaderAddress = context.binding.AddressNum;
    if (!woHeaderAddress) {
        if (context.binding.FunctionalLocation) {
            if (context.binding.FunctionalLocation.Address.AddressCommunication.length > 0) {
                let commArray = context.binding.FunctionalLocation.Address.AddressCommunication;
                let commObjT = commArray.find(comm => comm.CommType === 'T');
                let commObjM = commArray.find(comm => comm.CommType === 'M');
                if (commObjT)
                    return commObjT.TelNumber
                else if (commObjM)
                    return commObjM.TelNumber;
                else
                    return "";
            }
            else
                return "";
        }
        else
            return "-";
    }
    else {
        if (context.binding.Address) {
            if (context.binding.Address.AddressCommunication.length > 0) {
                let commArray = context.binding.Address.AddressCommunication;
                let commObjT = commArray.find(comm => comm.CommType === 'T');
                let commObjM = commArray.find(comm => comm.CommType === 'M');
                if (commObjT)
                    return commObjT.TelNumber
                else if (commObjM)
                    return commObjM.TelNumber;
                else
                    return "";
            }
            else
                return "";
        } else {
            return "-";
        }
    }
}
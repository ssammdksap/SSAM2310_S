/**
* Defect 8000000895 - Order Details Page comes blank when FL is blank
* Returns the SEWA Area Code from Address
*/
export default function ZSEWAAreaCode(context) {
    let woHeaderAddress = context.binding.AddressNum;
    if(!woHeaderAddress){
        if (context.binding.FunctionalLocation)
            return context.binding.FunctionalLocation.Address.ZSEWAAreaCode;
        else
            return "-";
    }
    else {
        return context.binding.Address.ZSEWAAreaCode;
    }
}
/**
* Defect 8000000895 - Order Details Page comes blank when FL is blank
* Returns the Area Code from Address
*/
export default function ZAreaCode(context) {
    let woHeaderAddress = context.binding.AddressNum;
    if(!woHeaderAddress){
        if (context.binding.FunctionalLocation)
            return context.binding.FunctionalLocation.Address.ZAreaCode;
        else
            return "-";
    }
    else {
        return context.binding.Address.ZAreaCode;
    }
}
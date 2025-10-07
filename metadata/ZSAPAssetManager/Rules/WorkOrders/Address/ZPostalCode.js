/**
* Defect 8000000895 - Order Details Page comes blank when FL is blank
* Returns the Postal Code from Address
*/
export default function ZPostalCode(context) {
    let woHeaderAddress = context.binding.AddressNum;
    if(!woHeaderAddress){
        if (context.binding.FunctionalLocation)
            return context.binding.FunctionalLocation.Address.PostalCode;
        else
            return "-";
    }
    else {
        return context.binding.Address.PostalCode;
    }
}
/**
* Defect 8000000895 - Order Details Page comes blank when FL is blank
* Returns the Street from Address
*/
export default function ZStreet(context) {
    let woHeaderAddress = context.binding.AddressNum;
    if(!woHeaderAddress){
        if (context.binding.FunctionalLocation)
            return context.binding.FunctionalLocation.Address.Street;
        else
            return "-";
    }
    else {
        return context.binding.Address.Street;
    }
}
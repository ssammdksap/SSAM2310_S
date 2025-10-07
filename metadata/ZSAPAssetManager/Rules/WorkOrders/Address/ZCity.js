/**
* Defect 8000000895 - Order Details Page comes blank when FL is blank
* Returns the City from Address
*/
export default function ZCity(context) {
    let woHeaderAddress = context.binding.AddressNum;
    if(!woHeaderAddress){
        if (context.binding.FunctionalLocation)
            return context.binding.FunctionalLocation.Address.City;
        else
            return "-";
    }
    else {
        return context.binding.Address.City;
    }
}
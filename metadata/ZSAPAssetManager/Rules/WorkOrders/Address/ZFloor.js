/**
* Defect 8000000895 - Order Details Page comes blank when FL is blank
* Returns the Floor from Address
*/
export default function ZFloor(context) {
    let woHeaderAddress = context.binding.AddressNum;
    if(!woHeaderAddress){
        if (context.binding.FunctionalLocation)
            return context.binding.FunctionalLocation.Address.Floor;
        else
            return "-";
    }
    else {
        return context.binding.Address.Floor;
    }
}
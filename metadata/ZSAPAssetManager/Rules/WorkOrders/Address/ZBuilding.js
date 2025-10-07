/**
* Defect 8000000895 - Order Details Page comes blank when FL is blank
* Returns the Building from Address
*/
export default function ZBuilding(context) {
    let woHeaderAddress = context.binding.AddressNum;
    if(!woHeaderAddress){
        if (context.binding.FunctionalLocation)
            return context.binding.FunctionalLocation.Address.Building;
        else
            return "-";
    }
    else {
        return context.binding.Address.Building;
    }
}
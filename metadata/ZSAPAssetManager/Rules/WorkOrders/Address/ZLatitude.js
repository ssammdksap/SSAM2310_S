/**
* Defect 8000000895 - Order Details Page comes blank when FL is blank
* Returns the Y Coordinates from Address
*/
export default function ZLatitude(context) {
    let woHeaderAddress = context.binding.AddressNum;
    if(!woHeaderAddress){
        if (context.binding.FunctionalLocation)
            return context.binding.FunctionalLocation.Address.ZYCoordinate; 
        else
            return "-";
    }
    else {
        return context.binding.Address.ZYCoordinate;
    }
}
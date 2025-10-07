/**
* Defect 8000000895 - Order Details Page comes blank when FL is blank
* Returns the X Coordinates from Address
*/
export default function ZLongitude(context) {
    let woHeaderAddress = context.binding.AddressNum;
    if(!woHeaderAddress){
        if (context.binding.FunctionalLocation)
            return context.binding.FunctionalLocation.Address.ZXCoordinates;
        else
            return "-";
    }
    else {
        return context.binding.Address.ZXCoordinates;
    }
}
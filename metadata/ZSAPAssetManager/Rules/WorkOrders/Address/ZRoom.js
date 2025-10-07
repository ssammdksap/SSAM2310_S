/**
* Defect 8000000895 - Order Details Page comes blank when FL is blank
* Returns the Room Number from Address
*/
export default function ZRoom(context) {
    let woHeaderAddress = context.binding.AddressNum;
    if(!woHeaderAddress){
        if (context.binding.FunctionalLocation)
            return context.binding.FunctionalLocation.Address.RoomNum;
        else
            return "-";
    }
    else {
        return context.binding.Address.RoomNum;
    }
}
/**
* Defect 8000000895 - Order Details Page comes blank when FL is blank
* Returns the Flat No from Address
*/
export default function ZFlatNo(context) {
    let woHeaderAddress = context.binding.AddressNum;
    if(!woHeaderAddress){
        if (context.binding.FunctionalLocation)
            return context.binding.FunctionalLocation.Address.HouseNum;
        else
            return "-";
    }
    else {
        return context.binding.Address.HouseNum;
    }     
}
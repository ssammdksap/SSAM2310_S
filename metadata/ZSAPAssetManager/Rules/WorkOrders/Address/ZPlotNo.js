/**
* Defect 8000000895 - Order Details Page comes blank when FL is blank
* Returns the Plot No from Address
*/
export default function ZPlotNo(context) {
    let woHeaderAddress = context.binding.AddressNum;
    if(!woHeaderAddress){
        if (context.binding.FunctionalLocation)
            return context.binding.FunctionalLocation.Address.ZPlotNo;
        else
            return "-";
    }
    else {
        return context.binding.Address.ZPlotNo;
    }
}
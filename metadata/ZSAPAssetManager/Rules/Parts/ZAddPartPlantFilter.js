
export default function AddPartPlantFilter(context) {
    let OrderId = context.binding.OrderId;
    let OrderType = context.binding.OrderType;
    if(OrderType =="0020" || OrderType =="0031" || context.binding.WOHeader.OrderType == "0020" || context.binding.WOHeader.OrderType =="0031"){
        let filter = "$orderby=Plant&$filter=Plant eq '7001'";
        return filter;
    }else{
        let filter = "$orderby=Plant";
        return filter;
    }

}

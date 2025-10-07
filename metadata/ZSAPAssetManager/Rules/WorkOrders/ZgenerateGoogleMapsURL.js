
export default function ZgenerateGoogleMapsURL(context) {
    // Get the Nativescript Utils Module
    const utilsModule = context.nativescript.utilsModule;
    let url = "https://www.google.com/maps/place/";
    let addressBinding = context.binding;

    if (context.binding.AddressNum === '' || context.binding.AddressNum === null || context.binding.AddressNum === undefined) {
        if (context.binding.FunctionalLocation)
            addressBinding = context.binding.FunctionalLocation.Address;
    }
    else
        addressBinding = context.binding.Address;

    if (addressBinding.ZXCoordinates && addressBinding.ZYCoordinate)
        url = url + addressBinding.ZYCoordinate + "," + addressBinding.ZXCoordinates;
    return utilsModule.openUrl(url);
}
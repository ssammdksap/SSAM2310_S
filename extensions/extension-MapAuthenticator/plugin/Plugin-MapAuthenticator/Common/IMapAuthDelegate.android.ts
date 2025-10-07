interface IMapAuthDelegate { 
    onAuthResult: (isSuccess: Boolean, errorMessage: String, jsonPayload: String) => void,
 } 
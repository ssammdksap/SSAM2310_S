export class MapAuthenticator {
    static getInstance(): MapAuthenticator {
        throw new Error('Abstract getInstance() must be implemented.');
    }
    create(context: any, mapType: String) {
        throw new Error('Abstract method create() must be implemented.');
    }
    runAuth(context: any, authConfig: any, onAuthResult: (context: any, isSuccess: Boolean,
            errorMessage: String, jsonPayload: String) => void) {
        throw new Error('Abstract method runAuth() must be implemented.');
    }
    removeAuth(authInfo: any): Boolean {
        throw new Error('Abstract method removeAuth() must be implemented.');
    }
    destroy() {
        throw new Error('Abstract method destroy() must be implemented.');
    }
}

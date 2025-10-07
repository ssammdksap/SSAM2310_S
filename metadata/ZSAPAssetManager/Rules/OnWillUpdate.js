export default function OnWillUpdate(clientAPI) {
	return clientAPI.executeAction('/ZSAPAssetManager/Actions/OnWillUpdate.action').then((result) => {
		if (result.data) {
			return Promise.resolve();
		} else {
			return Promise.reject('User Deferred');
		}
	});
}
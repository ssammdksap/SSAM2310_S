
export class AnalyticsEventLogger {
    protected async init(context: any, config: any): Promise<Boolean> {
        const appId = context.evaluateTargetPath('#Application/#AppData/MobileServiceAppId');
        const featurePoliciesUrl = `/mobileservices/Storage/v1/runtime/application/${appId}/global/mobileservices/settingsExchange/featureVectorPolicies`;
        const params = { method: 'GET' };
        try {
            const response = await context.sendRequest(featurePoliciesUrl, params);
            if (response && response.statusCode === 200 && response.content) {
                const featureFlagsData = JSON.parse(response.content.toString());
                if (featureFlagsData.restrictedPolicies) {
                    for (const feature of featureFlagsData.restrictedPolicies) {
                        // hardcoded check for Alchemer feature on purpose
                        if (feature.name === 'Alchemer') {
                            return Promise.resolve(false);
                        }
                    }
                }
            }
            return Promise.resolve(true);
        } catch (error) {
            return Promise.resolve(false);
        }
    }

    public logEvent(eventInfo: string): Boolean {
        return true;
    }
}

{
	"MainPage": "/SAPAssetManager/Pages/SideMenuDrawer.page",
	"OnUserSwitch": "/SAPAssetManager/Rules/ApplicationEvents/ApplicationOnUserSwitch.js",
	"OnWillUpdate": "/SAPAssetManager/Rules/ApplicationEvents/ApplicationOnWillUpdate.js",
	"OnDidUpdate": "/SAPAssetManager/Rules/ApplicationEvents/ApplicationOnDidUpdate.js",
	"Version": "1",
	"OnLaunch": [
		"/SAPAssetManager/Rules/Log/InitializeLoggerAndNativeScriptObject.js",
		"/SAPAssetManager/Rules/Common/PerformAppUpdateCheck.js",
		"/SAPAssetManager/Rules/Sync/InitializeSyncState.js",
		"/SAPAssetManager/Rules/Common/MonitorNetworkState.js",
        "/SAPAssetManager/Rules/Common/SoftInputModeConfig.js"
	],
	"Styles": "/SAPAssetManager/Styles/Styles.less",
	"Localization": "/ZSAPAssetManager/i18n/i18n.properties",
	"OnResume": "/SAPAssetManager/Rules/ApplicationEvents/AutoSync/AutoSyncOnResume.js",
	"OnReceiveForegroundNotification": "/SAPAssetManager/Rules/PushNotifications/PushNotificationsForegroundNotificationEventHandler.js",
	"OnReceiveFetchCompletion": "/SAPAssetManager/Rules/PushNotifications/PushNotificationsContentAvailableEventHandler.js",
	"OnReceiveNotificationResponse": "/SAPAssetManager/Rules/PushNotifications/PushNotificationsReceiveNotificationResponseEventHandler.js",
	"OnSuspend": "/SAPAssetManager/Rules/ApplicationEvents/ResetPeriodicAutoSync.js",
    "OnExit": "/SAPAssetManager/Rules/ApplicationEvents/ExitEventHandler.js",
    "OnLinkDataReceived": "/SAPAssetManager/Rules/DeepLinks/LinkDataReceived.js",
	"_SchemaVersion": "23.4",
	"EditorSetting": {
		"ReferenceApplications": [
			{
				"Name": "SAPAssetManager",
				"Path": "/SAPAssetManager"
			},
			{
				"Name": "ZSAPAssetManager",
				"Path": "/ZSAPAssetManager"
			}
		]
	},
	"_Name": "ZSAPAssetManager"
}
import { IClientAPI } from 'mdk-core/context/IClientAPI';
import { LoggerManager } from 'mdk-sap';


export default class SDFLogger {
    private static _instance: LoggerManager|null = null;
    private static _domain = 'SDF';

    public static init(clientAPI: IClientAPI) {
        if (SDFLogger._instance == null) {
            SDFLogger._instance = clientAPI.getLogger();
        }
    }
    /**
     * Log an error message. Adds domain to the message
     * @param {String} message Message to log
     * @param {string} [domain] SDF by default
     */
    public static error(message: string, domain = SDFLogger._domain) {
        this.logMessage(message, domain, 'Error');
    }
    /**
     * Log a warning message. Adds domain to the message
     * @param {String} message Message to log
     * @param {string} [domain] SDF by default
     */
    public static warn(message, domain = SDFLogger._domain) {
        this.logMessage(message, domain, 'Warn');
    }
    /**
     * Log an info message. Adds domain to the message
     * @param {String} message Message to log
     * @param {string} [domain] SDF by default
     */
    public static info(message, domain = SDFLogger._domain) {
        this.logMessage(message, domain, 'Info');

    }
    /**
     * Log an info message. Adds domain to the message
     * @param {String} message Message to log
     * @param {string} [domain] SDF by default
     */
    public static log(message, domain = SDFLogger._domain) {
        this.logMessage(message, domain, 'Info');

    }
    /**
     * Log a debug message. Adds domain to the message
     * @param {string} message Message to log
     * @param {string} [domain] SDF by default
     */
    public static debug(message, domain = SDFLogger._domain) {
        this.logMessage(message, domain, 'Debug');
    }

    /**
     * 
     * @param {string} message message to log
     * @param {string} domain
     * @param {string} level logging level as needed by MDK
     */
    private static logMessage(message: string, domain: string, level: string) {
        const msg = '[' + domain + '] ' + message;
        if (SDFLogger._instance) {
            SDFLogger._instance.log(msg, level);
        }
        // eslint-disable-next-line no-console
        console.log(`${Date()} ${msg}`);

    }
}

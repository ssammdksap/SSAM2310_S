
import { Context } from 'mdk-core/context/Context';
import { BaseExtensionParser } from 'extension-Common/BaseExtensionParser';
import { ValueResolver} from 'mdk-core/utils/ValueResolver';

const action = 'Action';

export class BarcodeScannerParser extends BaseExtensionParser {
           
    public parse(fromValue: any, context: Context, key: string): Promise<any> {
        if (fromValue) {
            if (key !== action  && typeof fromValue === 'string' && fromValue.indexOf('/Rules/') >= 0) {
                // This is a rule that should be evaluated
                return ValueResolver.resolveValue(fromValue, context, false).then((result) => {
                    return this.createBoundValue(key, result);
                });
            }
            return this.createPromiseValue(key, super.parseValue(fromValue, context));
        }
        return this.createPromiseValue(key, '');
    }
};

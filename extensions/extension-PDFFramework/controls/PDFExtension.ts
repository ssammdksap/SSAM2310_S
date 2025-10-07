import { BaseExtensionParser } from 'extension-Common/BaseExtensionParser';
import { BaseExtension } from 'extension-Common/BaseExtension';
import { PDFControl} from 'extension-PDFFramework';
import { Utils } from 'extension-Common/Utils';

export class PDFExtension extends BaseExtension {

    public initialize(props) {
        this._parser = new BaseExtensionParser();
        super.initialize(props);

        let pdfControl: PDFControl = new PDFControl();
        let vc = pdfControl.create(this.getDataService(), this);
        this.setViewController(vc);
        this.parseProperties();
    }
    public parseProperties() {
        this.parseProperty(this.getParams().Template).then(template => {
            this.parseProperty(this.getParams().Data).then(data => {
                let createParams = {Template:template, Data:JSON.stringify(data)}
                this._bridge.callback(Utils.isAndroid() ? JSON.stringify(createParams) : createParams, "Create");
            });
        });
    }
    public save(path, fileName) {
        let saveParams = {Path:path, FileName:fileName}
        this._bridge.callback(Utils.isAndroid() ? JSON.stringify(saveParams) : saveParams, "Save");
    }
    public share() {
        this._bridge.callback(Utils.isAndroid() ? JSON.stringify({}) : {}, "Share");
    }
    private parseProperty(param): Promise<any> {
        if (param.indexOf('.action') >= 0 || (param.indexOf('.js') >= 0)) {
            return this.executeActionOrRule(param);
        } else {
            return Promise.resolve(param);
        }
    }

    public update() {
        this.parseProperties();
    }
}

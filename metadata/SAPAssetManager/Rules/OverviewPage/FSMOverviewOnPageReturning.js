import IsAndroid from '../Common/IsAndroid';
import libPersona from '../Persona/PersonaLibrary';

export default function FSMOverviewOnPageReturning(context) {
    if (libPersona.isFieldServiceTechnician(context)) {
        let sectionedTable = context.getControls()[0];
        let mapSection = sectionedTable.getSection('MapExtensionSection');

        if (mapSection && mapSection.getVisible() !== false) {
            let mapViewExtension = mapSection.getExtension();
            if (IsAndroid(context)) {
                mapSection.redraw(true);
            } else {
                mapViewExtension.update();
            }
        }

        let s4MapSection = sectionedTable.getSection('S4MapExtensionSection');
        if (s4MapSection && s4MapSection.getVisible() !== false) {
            let mapViewExtension = s4MapSection.getExtension();
            if (IsAndroid(context)) {
                mapSection.redraw(true);
            } else {
                mapViewExtension.update();
            }
        }
    }
}

import { NoteLibrary as NoteLib} from './NoteLibrary';

export default function NotesViewNav(clientAPI) {
    
    // Set the transaction type before navigating to the Note View page
    let page = '';
    if (clientAPI.getPageProxy && clientAPI.getPageProxy()._page._definition.getName) {
        page = clientAPI.getPageProxy()._page._definition.getName();
    } else if (clientAPI.getPageProxy && clientAPI.getPageProxy()._page._definition.name) {
        page = clientAPI.getPageProxy()._page._definition.name;
    }
    if (NoteLib.didSetNoteTypeTransactionFlagForPage(clientAPI, page)) {
        return clientAPI.executeAction('/SAPAssetManager/Actions/Notes/NoteViewNav.action');
    }
    return null;
}

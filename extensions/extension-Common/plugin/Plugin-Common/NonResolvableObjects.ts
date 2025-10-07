import { Utils } from './Utils';

export class NonResolvableObjects {
    private _array;
    private _key;

    constructor(property) {
        this._array = [];
        this._key = property;
    }

    cache(object, index, isDelete = true) {
        if (object && object[this._key]) {
            this._array[index] = Utils.clone(object[this._key]);
            if (isDelete) {
                delete object[this._key];
            }
        }
    }

    restore(object, index) {
        if (object && this._array[index]) {
            object[this._key] = this._array[index];
        }
    }

    getKey() {
        return this._key;
    }

    getValueByIndex(index) {
        return this._array[index];
    }
}

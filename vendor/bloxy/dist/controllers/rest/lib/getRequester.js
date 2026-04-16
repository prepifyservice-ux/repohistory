"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getRequester(controller, customRequester) {
    if (!controller.requester && !controller.client.options.rest.requester && customRequester === undefined) {
        let requester;
        try {
            requester = require("got");
            if (requester && typeof requester !== 'function' && typeof requester.default === 'function') {
                requester = requester.default;
            } else if (requester && typeof requester !== 'function' && typeof requester.got === 'function') {
                requester = requester.got;
            }
        }
        catch (e) {
            throw new Error(`Failed to retrieve module "got" and no custom requester provided!`);
        }
        controller.requester = requester;
    }
    else {
        controller.requester = customRequester;
    }
    return controller.requester;
}
exports.default = getRequester;

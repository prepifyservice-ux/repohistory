import RESTController from "../RESTController";
export default function getRequester(controller: RESTController, customRequester?: RESTController["requester"]): import("bloxy/src/interfaces/RESTInterfaces").RESTRequester;

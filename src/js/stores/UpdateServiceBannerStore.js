import PluginSDK from "PluginSDK";

import {
  UPDATE_SERVICE_ACTION,
  REQUEST_UPDATE_SERVICE_SHOW,
  REQUEST_UPDATE_SERVICE_HIDE
} from "../constants/ActionTypes";

import AppDispatcher from "../events/AppDispatcher";
import GetSetBaseStore from "./GetSetBaseStore";

class UpdateServiceBannerStore extends GetSetBaseStore {
  constructor() {
    super(...arguments);

    PluginSDK.addStoreConfig({
      store: this,
      storeID: this.storeID,
      unmountWhen() {
        return true;
      },
      listenAlways: true
    });

    this.dispatcherIndex = AppDispatcher.register(payload => {
      var source = payload.source;
      if (source !== UPDATE_SERVICE_ACTION) {
        return false;
      }

      var action = payload.action;

      switch (action.type) {
        case REQUEST_UPDATE_SERVICE_SHOW:
          this.set({ newVersion: action.newVersion, isVisible: true });
          break;
        case REQUEST_UPDATE_SERVICE_HIDE:
          this.set({ isVisible: false });
          break;
      }

      return true;
    });
  }

  get storeID() {
    return "updateServiceBanner";
  }
}
module.exports = new UpdateServiceBannerStore();

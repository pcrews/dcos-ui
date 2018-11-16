import {
  REQUEST_UPDATE_SERVICE_SHOW,
  REQUEST_UPDATE_SERVICE_HIDE
} from "../constants/ActionTypes";

import AppDispatcher from "./AppDispatcher";

module.exports = {
  show(newVersion: string) {
    AppDispatcher.handleUpdateServiceAction({
      type: REQUEST_UPDATE_SERVICE_SHOW,
      newVersion,
      isVisible: true
    });
  },

  hide() {
    AppDispatcher.handleUpdateServiceAction({
      type: REQUEST_UPDATE_SERVICE_HIDE,
      isVisible: false
    });
  }
};

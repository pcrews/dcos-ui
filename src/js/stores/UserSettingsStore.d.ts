import EventEmitter from "events";

export default class UserSettingsStore extends EventEmitter {
  getKey: (key: any) => any;
  setKey: (key: string, value: any) => null | object;
}

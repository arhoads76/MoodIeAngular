export class Logger {
  log(msg: any, ...args: Array<any>)   { if (console && console.log) console.log(msg, args); }
  error(msg: any, ...args: Array<any>) { if (console && console.error) console.error(msg, args); }
  warn(msg: any, ...args: Array<any>)  { if (console && console.warn) console.warn(msg, args); }
}

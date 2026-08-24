export class DiscordHTTPSlashError<Code extends string = string> extends Error {
  public readonly code: Code;

  constructor(code: Code, message: string) {
    super(message);

    this.code = code;
    this.name = `${new.target.name} [${code}]`;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class Response {
  statusCode: number;
  body: string;
  headers: any;
  constructor(responseBuilder: ResponseBuilder) {
    this.statusCode = responseBuilder.statusCode;
    this.body = responseBuilder.body;
    this.headers = responseBuilder.headers;
  }
  getResponseObject() {
    return {
      statusCode: this.statusCode,
      body: this.body,
      headers: this.headers
    };
  }
}

export class ResponseBuilder {
  private _statusCode: number;
  private _body: string;
  private _headers: any;
  static successfulResponse(body: any) {
    return new ResponseBuilder().withBody(body).withStatusCode(200);
  }
  static errorResponse(body: any) {
    return new ResponseBuilder().withBody(body).withStatusCode(400);
  }

  withStatusCode(statusCode: number) {
    this._statusCode = statusCode;
    return this;
  }
  withBody(body: any) {
    if (typeof body === "object") {
      this._body = JSON.stringify(body);
    } else {
      this._body = body;
    }
    return this;
  }
  withOrigin(origin: string) {
    return this.withHeaders({
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": true,
      Vary: "Origin"
    });
  }
  private withHeaders(headers: any) {
    this._headers = headers;
    return this;
  }
  build() {
    return new Response(this);
  }

  get statusCode() {
    return this._statusCode;
  }

  get body() {
    return this._body;
  }

  get headers() {
    return this._headers;
  }
}

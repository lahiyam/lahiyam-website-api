import PostRequest, { Post } from "../libs/db/PostRequest";
import DynamoDBMapper from "../libs/db/DynamoDBMapper";
import S3Client from "../libs/clients/S3Client";
import S3ImageManager from "./util/S3ImageManager";

import { APIGatewayProxyHandler } from "aws-lambda";
import "source-map-support/register";
import { Response, ResponseBuilder } from "./util/ResponseBuilder";
import ProdOrigins from "../libs/enum/ProdOrigins";
import DevOrigins from "../libs/enum/DevOrigins";

const postRequest = new PostRequest(DynamoDBMapper);
const s3ImageManager = new S3ImageManager(S3Client);
export const index: APIGatewayProxyHandler = async (event, _context) => {
  const allowedOrigin =
    process.env.stage === "prod"
      ? ProdOrigins.API
      : DevOrigins.getAllowedOriginFromEvent(event);
  try {
    const { httpMethod } = event;
    let queryEvent;
    let response: Response;
    if (httpMethod.toLocaleUpperCase() === "GET") {
      if (event.queryStringParameters) {
        const { queryStringParameters } = event;
        if (queryStringParameters.id || queryStringParameters.userId) {
          queryEvent = await getPost(event);
          response = ResponseBuilder.successfulResponse(queryEvent)
            .withOrigin(allowedOrigin)
            .build();
        }
      }
    } else if (httpMethod.toLocaleUpperCase() === "PUT") {
      const body = JSON.parse(event.body);
      queryEvent = await updatePost(body);
      response = ResponseBuilder.successfulResponse(queryEvent)
        .withOrigin(allowedOrigin)
        .build();
    } else if (httpMethod.toLocaleUpperCase() === "POST") {
      const body = JSON.parse(event.body);
      queryEvent = await createPost(body);
      response = ResponseBuilder.successfulResponse(queryEvent)
        .withOrigin(allowedOrigin)
        .build();
    } else {
      response = ResponseBuilder.errorResponse({
        message:
          "Invalid request type. Acceptable requests are GET, POST, PUT, and DELETE"
      })
        .withOrigin(allowedOrigin)
        .build();
    }
    console.log(response.getResponseObject());
    return response.getResponseObject();
  } catch (e) {
    console.error(e);
    let response = ResponseBuilder.errorResponse(e)
      .withOrigin(allowedOrigin)
      .build();
    return response.getResponseObject();
  }
};

async function getPost(event): Promise<any> {
  if (event.queryStringParameters.hasOwnProperty("id")) {
    return postRequest.getPost(event.queryStringParameters);
  } else if (event.queryStringParameters.hasOwnProperty("userId")) {
    return postRequest.getPostsByUser(event.queryStringParameters);
  } else {
    throw PostRequest.TAG + "GET /post expects an id or userId parameter";
  }
}

async function updatePost(body) {
  if (!body.hasOwnProperty("userId")) {
    throw Error("POST /post userId attribute not specified in request");
  } else if (!body.hasOwnProperty("title")) {
    throw Error("POST /post title attribute not specified in request");
  } else if (!body.hasOwnProperty("content")) {
    throw Error("POST /post content attribute not specified in request");
  }
  const post = new Post();
  for (let attr of Object.keys(body)) {
    post[attr] = body[attr];
  }
  return postRequest.updatePost(post);
}

async function createPost(body) {
  if (!body.hasOwnProperty("userId")) {
    throw Error("POST /post userId attribute not specified in request");
  } else if (!body.hasOwnProperty("title")) {
    throw Error("POST /post title attribute not specified in request");
  } else if (!body.hasOwnProperty("content")) {
    throw Error("POST /post content attribute not specified in request");
  }
  // check for and upload photos to s3, then replace image links.
  // or just return original content if not photos
  body.content = await uploadPhotosFromPost(body);
  const post = new Post(body);
  return postRequest.createPost(post);
}

async function uploadPhotosFromPost(post: Post) {
  if (typeof post.content === "object") {
    const content = JSON.parse(post.content);
    content.ops = content.ops.map(op => {
      if (op.hasOwnProperty("insert") && op.insert.hasOwnProperty("image")) {
        op.insert.image =
          "//bucket.com/" +
          s3ImageManager.uploadImageFromBase64String(op.insert.image);
      }
      return op;
    });
    post.content = JSON.stringify(content);
  }
  return post.content;
}

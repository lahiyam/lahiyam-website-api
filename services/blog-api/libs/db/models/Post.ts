import {
  attribute,
  autoGeneratedHashKey,
  rangeKey,
  table
} from "@aws/dynamodb-data-mapper-annotations";
import PostStatus from "../../enum/PostStatus";

const stage = process.env.stage === "prod" ? "prod" : "dev";

@table(`${stage}-lahiyam-posts-table`)
export default class Post {
  constructor(body?: any) {
    if (body) {
      for (let bodyKey in body) {
        this[bodyKey] = body[bodyKey];
      }
    }
  }
  @autoGeneratedHashKey()
  id: string;

  @rangeKey({ defaultProvider: () => PostStatus.ACTIVE })
  status: string;

  @attribute({
    defaultProvider: () => Date.now(),
    indexKeyConfigurations: {
      "userId-createdAt-index": "RANGE"
    }
  })
  createdAt?: number;

  @attribute()
  title?: string;

  @attribute({
    indexKeyConfigurations: {
      "userId-createdAt-index": "HASH"
    }
  })
  userId: string;

  @attribute()
  content?: string;

  @attribute({ type: "Collection" })
  tags?: Array<string>;
}

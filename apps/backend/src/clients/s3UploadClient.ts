import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const UPLOAD_URL_EXPIRES_IN_SECONDS = 300;

let defaultClient: S3Client | undefined;

function getS3Client(): S3Client {
  defaultClient ??= new S3Client({});
  return defaultClient;
}

export async function createPresignedPutUrl(params: {
  bucketName: string;
  key: string;
  contentType: string;
}): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: params.bucketName,
    Key: params.key,
    ContentType: params.contentType,
  });

  return getSignedUrl(getS3Client(), command, {
    expiresIn: UPLOAD_URL_EXPIRES_IN_SECONDS,
  });
}

export async function createPresignedGetUrl(params: {
  bucketName: string;
  key: string;
}): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: params.bucketName,
    Key: params.key,
  });

  return getSignedUrl(getS3Client(), command, {
    expiresIn: UPLOAD_URL_EXPIRES_IN_SECONDS,
  });
}

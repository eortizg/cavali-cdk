import * as cdk from "@aws-cdk/core";
import * as s3 from "@aws-cdk/aws-s3";
import { Construct } from "@aws-cdk/core";
import { BuildConfig } from "./build-config";

export class S3BucketService extends Construct  {
    readonly bucket: s3.Bucket;
    constructor(scope: cdk.Construct, id : string, props: cdk.StackProps, buildConfig : BuildConfig) {
        super(scope, id);

        const environment = buildConfig.Environment;

        this.bucket = new s3.Bucket(this, "Uploads", {
          // Allow client side access to the bucket from a different domain
          removalPolicy: (environment !== "prod") ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN,
          autoDeleteObjects: true,
          cors: [
            {
              maxAge: 3000,
              allowedOrigins: ["*"],
              allowedHeaders: ["*"],
              allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST, s3.HttpMethods.DELETE, s3.HttpMethods.HEAD],
            },
          ],
        });
    
        // Export values
        new cdk.CfnOutput(this, "AttachmentsBucketName", {
          value: this.bucket.bucketName,
        });
      }
}
import * as cdk from "@aws-cdk/core";
import { S3Bucket } from "./S3Bucket";
import { CognitoService } from './Cognito';
import { FargateService } from './FargateService';
import { AuroraService } from './AuroraService'

export class CavaliStack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    new AuroraService(this, "AuroraService");
    const s3 = new S3Bucket(this, "s3uploads");
    new CognitoService(this, "cognito",  { bucketArn: s3.bucket.bucketArn });
    new FargateService(this,"fargate")
  }
}

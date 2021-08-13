import * as cdk from "@aws-cdk/core";
import { CognitoService } from './cognito-service';
import { FargateService } from './fargate-service';
import { DatabaseService } from './database-service'
import { VpcService } from './vpc-service'
import { BuildConfig } from "./build-config";
import { S3BucketService } from "./buckets";

export class SolutionStack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, props: cdk.StackProps, buildConfig : BuildConfig) {
    super(scope, id, props);
    const clientName = buildConfig.Parameters.ClientName;
    /** Create VPC for solution */
    const vpcPreffixName = `${clientName}-${buildConfig.Environment}-vpc`;
    const privateSubnetGroupName = `${clientName}-${buildConfig.Environment}-private-subnet`;
    const publicSubnetGroupName = `${clientName}-${buildConfig.Environment}-public-subnet`;
    const { vpc }  = new VpcService(this, vpcPreffixName, {vpcPreffixName, privateSubnetGroupName, publicSubnetGroupName},  buildConfig);

    /** Create fargate service for client fornt end */
    const fargateConstructName = `${clientName}-${buildConfig.Environment}-clientFS`;
    const clientFrontendDomain = buildConfig.Parameters.DomainClientFrontEnd;
    const clientFrontendClusterName = 'Client';
    const clientArnContainerRepository = buildConfig.Parameters.EcrArnClientFrontEnd;
    const clientFrontEndFargateCluster = new FargateService(this, fargateConstructName, 
      { 
        'vpc': vpc,
        'domain': clientFrontendDomain, 
        'clusterName': clientFrontendClusterName, 
        'containerRepositoryArn': clientArnContainerRepository
      }, buildConfig);

   /** Create fargate service for backoffice fornt end */
    const fargateConstructName2 = `${clientName}-${buildConfig.Environment}-backofficeFS`;
    const clientFrontendDomain2 = buildConfig.Parameters.DomainBackofficeFrontEnd;
    const clientFrontendClusterName2 = 'backoffice';
    const clientArnContainerRepository2 = buildConfig.Parameters.EcrArnBackofficeFrontEnd;
    const clientBackOfficeFargateCluster = new FargateService(this, fargateConstructName2, 
    { 
      'vpc': vpc,
      'domain': clientFrontendDomain2, 
      'clusterName': clientFrontendClusterName2, 
      'containerRepositoryArn': clientArnContainerRepository2
    }, buildConfig);


    /** Create Database for solution */
    const databaseServiceConstructName = `${clientName}-${buildConfig.Environment}-DatabaseService`;
    const databaseService = new DatabaseService(this,databaseServiceConstructName, {privateSubnetGroupName, publicSubnetGroupName, vpc}, buildConfig );

    /** Create Bucket to store documents */
    const bucketsConstructName = `${clientName}-${buildConfig.Environment}-Buckets`;
    const s3 = new S3BucketService(this, bucketsConstructName, {}, buildConfig);
    const congnitoConstruntName = `${clientName}-${buildConfig.Environment}-Cognito`;
    new CognitoService(this, congnitoConstruntName,  { bucketArn: s3.bucket.bucketArn });

  }
}

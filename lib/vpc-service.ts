
import { Construct, Duration, StackProps } from "@aws-cdk/core";
import { CfnDBCluster, CfnDBSubnetGroup } from '@aws-cdk/aws-rds';
import { SubnetType, Vpc } from '@aws-cdk/aws-ec2'
import * as rds from '@aws-cdk/aws-rds';
import * as cdk from "@aws-cdk/core";
import * as secretsManager from '@aws-cdk/aws-secretsmanager';
import * as  ssm from'@aws-cdk/aws-ssm';
import { SecurityGroup, ISecurityGroup } from '@aws-cdk/aws-ec2';
import { BuildConfig } from "./build-config";

export interface DatabaseServiceProps extends cdk.StackProps{
    vpcPreffixName: string;
    privateSubnetGroupName : string,
    publicSubnetGroupName: string;
}
  

export class VpcService extends Construct  {
    public readonly vpc: Vpc;

    constructor(scope: Construct, id : string, props: DatabaseServiceProps, buildConfig : BuildConfig) {
        super(scope, id);

        const clientName = buildConfig.Parameters.ClientName;
       /*const vpcPreffix = `${clientName}-${buildConfig.Environment}-vpc`;
        const privateSubnetName = `${clientName}-${buildConfig.Environment}-private-subnet`
        const publicSubnetName = `${clientName}-${buildConfig.Environment}-public-subnet`*/

        this.vpc = new Vpc(this, props.vpcPreffixName, {
            cidr: "10.0.0.0/16",
            natGateways: 1, 
            maxAzs: 3,
            subnetConfiguration: [
                {
                    name: props.privateSubnetGroupName,
                    subnetType: SubnetType.PRIVATE,
                    cidrMask: 24
                },
                {
                    name: props.publicSubnetGroupName,
                    subnetType: SubnetType.PUBLIC,
                    cidrMask: 24
                }
            ]
        });  

    }
}
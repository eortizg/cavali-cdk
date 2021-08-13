
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
  vpc: Vpc;
  privateSubnetGroupName : string,
  publicSubnetGroupName: string;
}

export class DatabaseService extends Construct  {
    public readonly databaseCredentialsSecret: secretsManager.Secret;
    public readonly defaultSecurityGroup: ISecurityGroup;

    constructor(scope: Construct, id : string, props: DatabaseServiceProps, buildConfig : BuildConfig) {
        super(scope, id);

        const clientName = buildConfig.Parameters.ClientName;
        const secretName = `${clientName}-${buildConfig.Environment}-aurora-credentials`;
        const ssmParameterName = `${clientName}-${buildConfig.Environment}-aurora-credentials-arn`; 
        
        const { vpc } = props;
        
        /*
        this.vpc = new Vpc(this, `Cavali-Vpc`, {
            cidr: StackSettings.vpcCdir,
            natGateways: 1, 
            maxAzs: 3,
            subnetConfiguration: [
                {
                    name: StackSettings.rdsSubnetName,
                    subnetType: SubnetType.PRIVATE,
                    cidrMask: 24
                },
                {
                    name: StackSettings.publicSubnetName,
                    subnetType: SubnetType.PUBLIC,
                    cidrMask: 24
                }
            ]
        });  */

        const subnetIds : string[] = [];
        vpc.selectSubnets({subnetGroupName: props.privateSubnetGroupName}).subnets.forEach(subnet => {
            subnetIds.push(subnet.subnetId);
        });
        new cdk.CfnOutput(this, 'VpcSubnetsAurora', {
            value: JSON.stringify(subnetIds)
        });
        new cdk.CfnOutput(this, 'VpcDefaultSecurityGroup', {
            value: vpc.vpcDefaultSecurityGroup
        });

        this.databaseCredentialsSecret = new secretsManager.Secret(this, `aurora-DBCredentialsSecret`, {
            secretName: secretName,
            generateSecretString: {
                secretStringTemplate: JSON.stringify({ username: "cavaliadmin" }),
                excludePunctuation: true,
                includeSpace: false,
                generateStringKey: 'password'
            }
        }); 

        new cdk.CfnOutput(this, 'Secret Name', { value: this.databaseCredentialsSecret.secretName }); 
        new cdk.CfnOutput(this, 'Secret ARN', { value: this.databaseCredentialsSecret.secretArn }); 
        new cdk.CfnOutput(this, 'Secret Full ARN', { value: this.databaseCredentialsSecret.secretFullArn || '' });     
    

        new ssm.StringParameter(this, 'DBCredentialsArn', {
            parameterName: ssmParameterName,
            stringValue: this.databaseCredentialsSecret.secretArn,
        }); 


        this.defaultSecurityGroup = SecurityGroup.fromSecurityGroupId(this, "SG", vpc.vpcDefaultSecurityGroup);

        const subnetGroup = new rds.SubnetGroup(this, "subnetGroup", {
            description: `Subnetgroup for serverless mysql aurora serverless database`,
            vpc: vpc,
            subnetGroupName: props.publicSubnetGroupName
        })

        const cluster = new rds.ServerlessCluster(this, 'AuroraSolutionCluster', {
            engine: rds.DatabaseClusterEngine.AURORA_MYSQL,
            //parameterGroup: rds.ParameterGroup.fromParameterGroupName(this, 'ParameterGroup', 'default.aurora-postgresql10'),
            vpc: vpc,
            subnetGroup: subnetGroup,
            scaling: {
                autoPause: Duration.minutes(10), // default is to pause after 5 minutes of idle time
                minCapacity: rds.AuroraCapacityUnit.ACU_1, // default is 2 Aurora capacity units (ACUs)
                maxCapacity: rds.AuroraCapacityUnit.ACU_32, // default is 16 Aurora capacity units (ACUs)
            },
            securityGroups: [this.defaultSecurityGroup],
            enableDataApi: true,
            deletionProtection: false,
            credentials: rds.Credentials.fromSecret(this.databaseCredentialsSecret), 
        });

        new cdk.CfnOutput(this, 'Cluster Aurora Endpoint', { value: cluster.clusterEndpoint.hostname });

    }
}
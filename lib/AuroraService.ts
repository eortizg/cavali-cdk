
import { Construct, Duration, StackProps } from "@aws-cdk/core";
import { CfnDBCluster, CfnDBSubnetGroup } from '@aws-cdk/aws-rds';
import { SubnetType, Vpc } from '@aws-cdk/aws-ec2'
import * as rds from '@aws-cdk/aws-rds';
import * as cdk from "@aws-cdk/core";
import * as secretsManager from '@aws-cdk/aws-secretsmanager';
import * as  ssm from'@aws-cdk/aws-ssm';
import { SecurityGroup, ISecurityGroup } from '@aws-cdk/aws-ec2';

export interface AuroraServiceProps extends cdk.StackProps{
    stage: string;
}

export class AuroraService extends Construct  {
    public readonly vpc: Vpc;
    public readonly databaseCredentialsSecret: secretsManager.Secret;
    public readonly defaultSecurityGroup: ISecurityGroup;

    constructor(scope: Construct, id : string, props?: AuroraServiceProps) {
        super(scope, id);

        this.vpc = new Vpc(this, `VPC-${props?.stage}`, {
            cidr: '10.0.0.0/16',
            maxAzs: 6,
            subnetConfiguration: [
                {
                cidrMask: 24,
                name: 'cavali-subnet',
                subnetType: SubnetType.ISOLATED,
                }
            ]
        });  

        const subnetIds : string[] = [];
        this.vpc.isolatedSubnets.forEach(subnet => {
        subnetIds.push(subnet.subnetId);
        });

        new cdk.CfnOutput(this, 'VpcSubnetIds', {
            value: JSON.stringify(subnetIds)
        });

        // output security group
        new cdk.CfnOutput(this, 'VpcDefaultSecurityGroup', {
            value: this.vpc.vpcDefaultSecurityGroup
        });
          
        this.databaseCredentialsSecret = new secretsManager.Secret(this, `${props?.stage}-DBCredentialsSecret`, {
            secretName: `${props?.stage}-credentials`,
            generateSecretString: {
                secretStringTemplate: JSON.stringify({
                username: 'cavaliadmin',
                }),
                excludePunctuation: true,
                includeSpace: false,
                generateStringKey: 'password'
            }
        });    

        new cdk.CfnOutput(this, 'Secret Name', { value: this.databaseCredentialsSecret.secretName }); 
        new cdk.CfnOutput(this, 'Secret ARN', { value: this.databaseCredentialsSecret.secretArn }); 
        new cdk.CfnOutput(this, 'Secret Full ARN', { value: this.databaseCredentialsSecret.secretFullArn || '' });     

        // next, create a new string parameter to be use
        new ssm.StringParameter(this, 'DBCredentialsArn', {
            parameterName: `${props?.stage}-credentials-arn`,
            stringValue: this.databaseCredentialsSecret.secretArn,
        }); 

        // get the default security group
        this.defaultSecurityGroup = SecurityGroup.fromSecurityGroupId(this, "SG", this.vpc.vpcDefaultSecurityGroup);


        /*const dbSubnetGroup = new CfnDBSubnetGroup(this, 'AuroraCavaliSubnetGroup', {
            dbSubnetGroupDescription: 'Subnet group to access aurora',
            dbSubnetGroupName: 'aurora-cavali-subnet-group',
            subnetIds: props.subnetIds
        });*/
        const subnetGroup = new rds.SubnetGroup(this, "subnetGroup", {
            description: `Subnetgroup for serverless postgres aurora databasa`,
            vpc: this.vpc,
            vpcSubnets: {onePerAz: true},
        })

        

        /*const dbSubnetGroup: CfnDBSubnetGroup = new CfnDBSubnetGroup(this, 'AuroraCavaliSubnetGroup', {
            dbSubnetGroupDescription: 'Subnet group to access aurora',
            dbSubnetGroupName: 'aurora-cavali-subnet-group',
            subnetIds: props?.subnetIds
        });*/

        /*
        const aurora = new CfnDBCluster(this, 'AuroraServerlessCavali', {
            databaseName: 'cavalidb',
            dbClusterIdentifier: 'aurora-sls',
            engine: 'aurora',
            engineMode: 'serverless',
            masterUserPassword: secret.secretValueFromJson("password").toString(),
            masterUsername: secret.secretValueFromJson("username").toString(),
            dbSubnetGroupName: dbSubnetGroup.dbSubnetGroupName,
            scalingConfiguration: {
              autoPause: true,
              maxCapacity: 4,
              minCapacity: 2,
              secondsUntilAutoPause: 3600
            }
          });*/
         // const vpc = props?.vpc;

          //const vpc = new Vpc(this, 'myrdsvpc');

          

          const cluster = new rds.ServerlessCluster(this, 'CavaliCdkCluster', {
            engine: rds.DatabaseClusterEngine.AURORA_MYSQL,
            //parameterGroup: rds.ParameterGroup.fromParameterGroupName(this, 'ParameterGroup', 'default.aurora-postgresql10'),
            vpc: this.vpc,
            subnetGroup: subnetGroup,
            scaling: {
              autoPause: Duration.minutes(10), // default is to pause after 5 minutes of idle time
              minCapacity: rds.AuroraCapacityUnit.ACU_1, // default is 2 Aurora capacity units (ACUs)
              maxCapacity: rds.AuroraCapacityUnit.ACU_32, // default is 16 Aurora capacity units (ACUs)
            },
            deletionProtection: false,
            credentials: rds.Credentials.fromSecret(this.databaseCredentialsSecret), 
          });

          new cdk.CfnOutput(this, 'Cluster Aurora Endpoint', { value: cluster.clusterEndpoint.hostname });
          
    }
}
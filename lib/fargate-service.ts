import { Construct } from "@aws-cdk/core";
import * as cdk from "@aws-cdk/core";
import { SubnetType, Vpc } from '@aws-cdk/aws-ec2';
import * as ecs from "@aws-cdk/aws-ecs";
import * as ecs_patterns from "@aws-cdk/aws-ecs-patterns";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecr from "@aws-cdk/aws-ecr";
import * as route53 from "@aws-cdk/aws-route53";
import * as iam from "@aws-cdk/aws-iam";
import * as elasticloadbalancing from "@aws-cdk/aws-elasticloadbalancingv2";
import * as route53targets from "@aws-cdk/aws-route53-targets";
import * as certificatemanager from "@aws-cdk/aws-certificatemanager";
import { BuildConfig } from "./build-config";

export interface FargateServiceProps extends cdk.StackProps{
    vpc: Vpc;
    domain: string;
    clusterName: string;
    containerRepositoryArn: string;
    //taskEnv: { [key: string]: string } | undefined;
}
  

export class FargateService extends Construct  {

    constructor(scope: Construct, id : string, props: FargateServiceProps, buildConfig : BuildConfig) {
        super(scope, id);

        const clientName = buildConfig.Parameters.ClientName;

        const clientPrefix = `${clientName}-${buildConfig.Environment}-server`;

        const clusterName = `${clientPrefix}-${props.clusterName}`;

        const { vpc } = props;

        const environment = buildConfig.Environment;
        const domain = props.domain;
        const containerRepositoryArn = props.containerRepositoryArn;

        //const repository = ecr.Repository.fromRepositoryArn(this, `${clusterName}-repository`, 'arn:aws:ecr:us-east-1:100621379454:repository/cavali-dev-backoffice-repository');
        const repository = ecr.Repository.fromRepositoryArn(this, `${clusterName}-repository`, containerRepositoryArn);

        // The code that defines your stack goes here
        const cluster = new ecs.Cluster(this, clusterName, {
            clusterName: clusterName,
            vpc,
        });


        // load balancer resources
        const elb = new elasticloadbalancing.ApplicationLoadBalancer(
            this,
            `${clusterName}-elb`,
            {
              vpc,
              vpcSubnets: { subnets: vpc.publicSubnets },
              internetFacing: true,
            }
        );

        const targetGroupHttp = new elasticloadbalancing.ApplicationTargetGroup(
            this,
            `${clusterName}-target`,
            {
              port: 3000,
              vpc,
              protocol: elasticloadbalancing.ApplicationProtocol.HTTP,
              targetType: elasticloadbalancing.TargetType.IP,
            }
        );

        targetGroupHttp.configureHealthCheck({
            path: "/api/status",
            protocol: elasticloadbalancing.Protocol.HTTP,
        });

        const zone = route53.HostedZone.fromLookup(this,  `${clusterName}-zone`, {
          domainName: domain,
        });
     
        new route53.ARecord(this, `${clusterName}-domain`, {
            recordName: `${
              environment !== "prod" ? `${environment}-` : ""
            }api.${props.domain}`,
            target: route53.RecordTarget.fromAlias(
              new route53targets.LoadBalancerTarget(elb)
            ),
            ttl: cdk.Duration.seconds(300),
            comment: `${clusterName} API domain`,
            zone: zone,
        });
        
        const cert = new certificatemanager.Certificate(
            this,
            `${clusterName}-cert`,
            {
              domainName: props.domain,
              subjectAlternativeNames: [`*.${props.domain}`],
              validation: certificatemanager.CertificateValidation.fromDns(zone),
            }
          );

        const listener = elb.addListener("Listener", {
            open: true,
            port: 443,
            certificates: [cert]
        });
/*
        const listener = elb.addListener("Listener", {
          open: true,
          port: 80,
      });*/

        listener.addTargetGroups(`${clusterName}-tg`, {
            targetGroups: [targetGroupHttp],
        });

        const elbSG = new ec2.SecurityGroup(this, `${clusterName}-elbSG`, {
            vpc,
            allowAllOutbound: true,
        });

        elbSG.addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(443),
            "Allow https traffic"
        );

        elb.addSecurityGroup(elbSG);

        const taskRole = new iam.Role(this, `${clusterName}-task-role`, {
            assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            roleName: `${clusterName}-task-role`,
            description: "Role that the api task definitions use to run the api code",
        });

        taskRole.attachInlinePolicy(
            new iam.Policy(this, `${clusterName}-task-policy`, {
              statements: [
                
                new iam.PolicyStatement({
                  effect: iam.Effect.ALLOW,
                  actions: ["SES:*"],
                  resources: ["*"],
                }),
              ],
            })
          );
        
          const taskDefinition = new ecs.TaskDefinition(
            this,
            `${clusterName}-task`,
            {
              family: `${clientPrefix}-task`,
              compatibility: ecs.Compatibility.EC2_AND_FARGATE,
              cpu: "256",
              memoryMiB: "512",
              networkMode: ecs.NetworkMode.AWS_VPC,
              taskRole: taskRole,
            }
          );

          const image = ecs.RepositoryImage.fromEcrRepository(repository, "latest");

          const container = taskDefinition.addContainer(`${clusterName}-container`, {
            //image: ecs.ContainerImage.fromRegistry(containerImageUrl), //"100621379454.dkr.ecr.us-east-1.amazonaws.com/cavali-dev-server-repository:latest"
            image,
            memoryLimitMiB: 512,
            //environment: props.taskEnv,
            logging: ecs.LogDriver.awsLogs({ streamPrefix: clusterName }),
          });

          container.addPortMappings({ containerPort: 3000 });

          const ecsSG = new ec2.SecurityGroup(this, `${clusterName}-ecsSG`, {
            vpc,
            allowAllOutbound: true,
          });
      
          ecsSG.connections.allowFrom(
            elbSG,
            ec2.Port.allTcp(),
            "Application load balancer"
          );


          const service = new ecs.FargateService(this, `${clusterName}-service`, {
            cluster,
            desiredCount: 1,
            taskDefinition,
            securityGroups: [ecsSG],
            assignPublicIp: true,
          });


          service.attachToApplicationTargetGroup(targetGroupHttp);

          const scalableTaget = service.autoScaleTaskCount({
            minCapacity: 1,
            maxCapacity: 5,
          });

          scalableTaget.scaleOnMemoryUtilization(`${clusterName}-ScaleUpMem`, {
            targetUtilizationPercent: 75,
          });
      
          scalableTaget.scaleOnCpuUtilization(`${clusterName}-ScaleUpCPU`, {
            targetUtilizationPercent: 75,
          });

          new cdk.CfnOutput(this, `${clusterName}ServiceName`, {
            exportName: `${clusterName}ServiceName`,
            value: service.serviceName,
          });
    
      
          new cdk.CfnOutput(this, `${clusterName}ClusterName`, {
            exportName: `${clusterName}ClusterName`,
            value: cluster.clusterName,
          });

        
      
    }
}
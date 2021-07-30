import { Construct } from "@aws-cdk/core";
import { Vpc } from '@aws-cdk/aws-ec2';
import * as ecs from "@aws-cdk/aws-ecs";
import * as ecs_patterns from "@aws-cdk/aws-ecs-patterns";


export interface FargateServiceProps {
    vpc?: Vpc;
  }
  

export class FargateService extends Construct  {

    constructor(scope: Construct, id : string, props?: FargateServiceProps) {
        super(scope, id);


        const vpc = new Vpc(this, "FargateVpc", {
            maxAzs: 3 // Default is all AZs in region
        });

          
        const cluster = new ecs.Cluster(this, "FargateCluster", {
            vpc: vpc
        });
      
        // Create a load-balanced Fargate service and make it public
        new ecs_patterns.ApplicationLoadBalancedFargateService(this, "MyFargateService", {
            cluster: cluster, // Required
            cpu: 512, // Default is 256
            desiredCount: 6, // Default is 1
            taskImageOptions: { image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample") },
            memoryLimitMiB: 2048, // Default is 512
            publicLoadBalancer: true // Default is false
        });
      
    }
}
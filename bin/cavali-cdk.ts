#!/usr/bin/env node
import 'source-map-support/register';
import { App, Stack, Tags, Construct}  from '@aws-cdk/core';
import { CavaliStack } from '../lib/CavaliStack';


/* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */


interface EnvProps {
  prod: boolean;
}

class MyService extends Construct{
  constructor(scope: Construct, id: string, props?: EnvProps) {
  
    super(scope, id);
  
    new CavaliStack(app, 'CavaliCdkStack', {});
    // we might use the prod argument to change how the service is configured
    /*new ControlPlane(this, "cp");
    new DataPlane(this, "data");
    new Monitoring(this, "mon");  }
  */}
}


const app = new App();
new MyService(app, "beta");


app.synth();
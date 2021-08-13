#!/usr/bin/env node
import 'source-map-support/register';
import { App, Stack, Tags, Construct}  from '@aws-cdk/core';
import { SolutionStack } from '../lib/solution-stack';
import { BuildConfig } from '../lib/build-config';
import { ContainerRepositoryStack } from '../lib/container-repository-stack';


const app = new App();

function ensureString(object: { [name: string]: any}, propName: string) : string{
  if(!object[propName] || object[propName].trim().length === 0 )
    throw new Error(propName + " does not exist or is empty");
  
  return object[propName];
}

function getConfig(){
  let env = app.node.tryGetContext("config");
  if(!env)
    throw new Error("Context variable missing on CDK command. Pass in as `-c config=XXX`")

    let unparsedEnv = app.node.tryGetContext(env);

    let buildConfig: BuildConfig = {
      AWSAccountID: ensureString(unparsedEnv, "AWSAccountID"),
      AWSProfileName: ensureString(unparsedEnv, "AWSProfileName"),
      AWSProfileRegion: ensureString(unparsedEnv, "AWSProfileRegion"),

      App: ensureString(unparsedEnv, "App"),
      Version: ensureString(unparsedEnv, "Version"),
      Environment: ensureString(unparsedEnv, "Environment"),
      Build: ensureString(unparsedEnv, "Build"),

      Parameters: {
        ClientName: ensureString(unparsedEnv["BuildParameters"], "ClientName"),
        DomainBackofficeFrontEnd: ensureString(unparsedEnv["BuildParameters"], "DomainBackofficeFrontEnd"),
        EcrArnClientFrontEnd: ensureString(unparsedEnv["BuildParameters"], "EcrArnClientFrontEnd"),
        DomainClientFrontEnd: ensureString(unparsedEnv["BuildParameters"], "DomainClientFrontEnd"),
        EcrArnBackofficeFrontEnd: ensureString(unparsedEnv["BuildParameters"], "EcrArnBackofficeFrontEnd"),
      }
    }
    return buildConfig;
}

async function Main(){
  let buildConfig: BuildConfig = getConfig();
  Tags.of(app).add("App", buildConfig.App);
  Tags.of(app).add("Environment", buildConfig.Environment);

  let repositoryStackName = buildConfig.App + "-" + buildConfig.Environment + "-repository";
  new ContainerRepositoryStack(
    app,
    repositoryStackName,
    {
      env: {
        region: buildConfig.AWSProfileRegion,
        account: buildConfig.AWSAccountID
      }
    },
    buildConfig
  );

  let solutionStackName = buildConfig.App + "-" + buildConfig.Environment + "-cavali";
  new SolutionStack(
    app,
    solutionStackName,
    {
      env: {
        region: buildConfig.AWSProfileRegion,
        account: buildConfig.AWSAccountID
      }
    },
    buildConfig
  )

}

Main();

/*
class MyService extends Construct{
  constructor(scope: Construct, id: string, props?: EnvProps) {
  
    super(scope, id);
  
    new CavaliStack(app, 'CavaliCdkStack', { 
      env: { 
        account: process.env.CDK_DEFAULT_ACCOUNT, 
        region: process.env.CDK_DEFAULT_REGION 
    }});
  }
}



new MyService(app, "beta");*/


//app.synth();
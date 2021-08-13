import * as cdk from "@aws-cdk/core";
import * as ecr from "@aws-cdk/aws-ecr";
import { BuildConfig } from "./build-config";

export class ContainerRepositoryStack extends cdk.Stack{
    constructor(scope: cdk.Construct, id: string, props: cdk.StackProps, buildConfig : BuildConfig) {
        super(scope, id, props);
        const clientName = buildConfig.Parameters.ClientName;
        const clientPrefix = `${clientName}-${buildConfig.Environment}-client-frontend`;
        const backofficePrefix = `${clientName}-${buildConfig.Environment}-backoffice`;
        const clientFrontEndRepository = new ecr.Repository(this, `${clientPrefix}-repository`, {
            repositoryName: `${clientPrefix}-repository`,
        });
        const backOfficeRepository = new ecr.Repository(this, `${backofficePrefix}-repository`, {
            repositoryName: `${backofficePrefix}-repository`,
        });


        new cdk.CfnOutput(this, 'RepositoryClientFrontEnd', {
            value: clientFrontEndRepository.repositoryUri
        });


        new cdk.CfnOutput(this, 'RepositoryBackOfficeFrontEnd', {
            value: backOfficeRepository.repositoryUri
        });
    }

}
# Bienvenido al CDK Cavali!

Esta es una solución para proyectos de Cavali.

El `cdk.json` contiene las variables de entorno para la ejecución..
```yaml

"dev": {
      "AWSAccountID": "100621379454",
      "AWSProfileName": "eortiz",
      "AWSProfileRegion": "us-east-1",

      "App": "cavali-app",
      "Environment": "dev",
      "Version": "0.0.0",
      "Build": "0",

      "BuildParameters": {
        "DBUserName": "cavaliadmin",
        "ClientName": "cavali",
        "DomainClientFrontEnd": "testnextjs.canvia-aws.es",
        "EcrArnClientFrontEnd": "arn:aws:ecr:us-east-1:100621379454:repository/cavali-dev-client-frontend-repository",
        "DomainBackofficeFrontEnd": "backoffice.canvia-aws.es",
        "EcrArnBackofficeFrontEnd": "arn:aws:ecr:us-east-1:100621379454:repository/cavali-dev-backoffice-repository"
      }
    }
```


## Comandos Útiles

 * `npm run build`   compila el typescript a js
 * `npm run watch`   revisa cambios y compila
 * `cdk synth cavali-app-<environment>-cavali -c config=<environment>`       emite la sintetizada plantilla CloudFormation para la stack de la solución al ambiente <environment> especificado
 * `cdk synth cavali-app-dev-cavali -c config=dev`       emite la sintetizada plantilla CloudFormation para la stack de la solución al ambiente dev
 * `cdk deploy cavali-app-<environment>-cavali -c config=<environment>`      despliega esta stack a su default AWS account/region al ambiente  <environment> especificado
 * `cdk deploy cavali-app-dev-cavali -c config=dev`      despliega esta stack a su  default AWS account/region en el ambiente dev
 * `cdk diff`        compara la desplegada stack con el actual estado.
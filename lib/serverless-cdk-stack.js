const cdk = require('@aws-cdk/core');
const serverlessConstruct = require('./ServerlessConstruct');

class ServerlessCdkStack extends cdk.Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'ServerlessCdkQueue', {
    //   visibilityTimeout: Duration.seconds(300)
    // });

   new serverlessConstruct.ServerlessConstruct(this, 'serverlessConstruct');

  }
}

module.exports = { ServerlessCdkStack }

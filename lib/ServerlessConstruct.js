const core = require("@aws-cdk/core");
const lambda = require("@aws-cdk/aws-lambda");
const s3 = require("@aws-cdk/aws-s3");
const ssm = require("@aws-cdk/aws-ssm");
const path = require("path");
const ec2 = require("@aws-cdk/aws-ec2");
const sns = require("@aws-cdk/aws-sns");
const sqs = require("@aws-cdk/aws-sqs");
const subs = require("@aws-cdk/aws-sns-subscriptions");
const route53 = require("@aws-cdk/aws-route53");
const lambdaEventSources = require("@aws-cdk/aws-lambda-event-sources");
const apiGateWay = require("@aws-cdk/aws-apigateway");



class ServerlessConstruct extends core.Construct {
    constructor(scope, id) {
        super(scope, id);

        // environmentalDetails-Samples to be done
        const bucket = new s3.Bucket(this, "Store"); //note that it appends everything
        const pgHost = ssm.StringParameter.valueForStringParameter(
            this, '/fw/manny/PGHOST');
        //   const pgUser = ssm.StringParameter.valueForSecureStringParameter(
        //       this, '/fw/manny/PGUSER', 1);
        const pgPassword = ssm.StringParameter.valueForStringParameter(
            this, '/fw/manny/PGPASSWORD');

        const environmentDetails = {
            BUCKET: bucket.bucketName,
            PGHOST: pgHost,
            PGPASSWORD: pgPassword
        }

        //  //Lookup the zone based on domain name
        //  const zone = route53.HostedZone.fromHostedZoneAttributes(this, 'baseZone', {
        //     domainName: 'freightwise-staging.com'
        //   });

        //   //Add the Subdomain to Route53
        //   const cName = new route53.CnameRecord(this, 'test.freigthwise', {
        //     zone: zone,
        //     recordName: 'example',
        //     domainName: bucket.bucketWebsiteDomainName
        //   });


        //get VPC Info form AWS account, FYI we are not rebuilding we are referencing
        const vpc = ec2.Vpc.fromVpcAttributes(this, 'vpcdev', {
            vpcId: 'vpc-5b18bd26',
            availabilityZones: ['us-east-1a'],
            privateSubnetIds: 'subnet-28fb734e'
        });

        //Get subnets that already exists off your current vpc.
        const subnets = vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE });

        //Get an existing security group.
        const securityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, 'securitygroup', 'sg-0ed3cc84804daf3ea');

       //****************** Lambda with layers starts*/

        const layer = new lambda.LayerVersion(this, 'Shared', {
            code: lambda.Code.fromAsset("shared"), // Note 'shared' is the folder we created
            handler: "sharedExample.shared",
            compatibleRuntimes: [lambda.Runtime.NODEJS_12_X],
            description: 'A layer to test the L2 construct',
        });

        const handler = new lambda.Function(this, "Handler", {
            runtime: lambda.Runtime.NODEJS_12_X, // So we can use async in my_lambda.js
            code: lambda.Code.fromAsset("resources"), // Note 'resources' is the folder we created
            handler: "lambda.main", //Note lambda is our filename, and main is our function
            environment: environmentDetails,
            layers: [layer]
        });

       //****************** Lambda with layers ends*/

        //****************** Gateway-Lambda-Invocation Starts */
        // Rest Api
        const apiLambda = new lambda.Function(this, "APIHandler", {
            runtime: lambda.Runtime.NODEJS_12_X, // So we can use async in my_lambda.js
            code: lambda.Code.fromAsset("resources"), // Note 'resources' is the folder we created
            handler: "apiLambda.mainV3", //Note lambda is our filename, and main is our function
            environment: environmentDetails,
        });


        //Gateway for RestAPI
        const restApi = new apiGateWay.RestApi(this, 'helloLambdaApi', {
            restApiName: 'HelloService',
            deploy: false,
        });

        const method = restApi.root
            .addResource("hello")
            .addMethod("GET", new apiGateWay.LambdaIntegration(apiLambda, { proxy: true }))


        //****************** Gateway-Lambda-Invocation Ends */

        //****************** SQS-Lambda-Invocation Starts */

        const sqsLambda = new lambda.Function(this, "SQSHandler", {
            runtime: lambda.Runtime.NODEJS_12_X, // So we can use async in my_lambda.js
            code: lambda.Code.fromAsset("resources"), // Note 'resources' is the folder we created
            handler: "sqsLambda.mainV2", //Note lambda is our filename, and main is our function
            environment: environmentDetails,
        });

        //  create queue
        const queue = new sqs.Queue(this, 'sqs-queue-freightwise', {

            maximumMessageSize: 1000000,
        });

        //  create sns topic
        const topic = new sns.Topic(this, 'sns-topic-freightwise')
        topic.addSubscription(new subs.SqsSubscription(queue));


        const eventSource = new lambdaEventSources.SqsEventSource(queue);

        sqsLambda.addEventSource(eventSource);


        new core.CfnOutput(this, 'snsTopicArn', {
            value: topic.topicArn,
            description: 'The arn of the SNS topic',
        });

        //****************** SQS-Lambda-Invocation Ends */

        bucket.grantReadWrite(handler);
        bucket.grantReadWrite(sqsLambda); // give our lambda IAM permissions to access the lambda
    }
}

module.exports = { ServerlessConstruct }

// import path from 'node:path';
// import { fileURLToPath } from 'node:url';

import {
  Aws,
  RemovalPolicy,
  aws_logs as logs,
  aws_wafv2 as wafv2,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

export interface CommonWafSettingProps {
  readonly targetArnList?: readonly string[];
  readonly scope: 'REGIONAL' | 'CLOUDFRONT';
}

export class CommonWafSetting extends Construct {
  public readonly webAclArn: string;

  constructor(scope: Construct, id: string, props: CommonWafSettingProps) {
    super(scope, id);

    const webAcl = new wafv2.CfnWebACL(this, `CommonWafWebACL-${props.scope}`, {
      defaultAction: {
        allow: {},
      },
      scope: props.scope,
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        sampledRequestsEnabled: true,
        metricName: `CommonWafWebACLMetrics-${props.scope}`,
      },
      rules: [
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 1,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            sampledRequestsEnabled: true,
            metricName: `AWSManagedRulesCommonRuleSet-${props.scope}`,
          },
        },
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 2,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            sampledRequestsEnabled: true,
            metricName: `AWSManagedRulesKnownBadInputsRuleSet-${props.scope}`,
          },
        },
        {
          name: 'AWSManagedRulesAmazonIpReputationList',
          priority: 3,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesAmazonIpReputationList',
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            sampledRequestsEnabled: true,
            metricName: `AWSManagedRulesAmazonIpReputationList-${props.scope}`,
          },
        },
        {
          name: 'AWSManagedRulesAnonymousIpList',
          priority: 4,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesAnonymousIpList',
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            sampledRequestsEnabled: true,
            metricName: `AWSManagedRulesAnonymousIpList-${props.scope}`,
          },
        },
      ],
    });
    this.webAclArn = webAcl.attrArn;

    const logGroup = new logs.LogGroup(this, `aws-waf-logs-${props.scope}`, {
      logGroupName: `aws-waf-logs-common-acl-${props.scope}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: logs.RetentionDays.TWO_MONTHS,
    });

    const loggingConfig = new wafv2.CfnLoggingConfiguration(
      this,
      `CommonWafWebACL-LoggingConfig-${props.scope}`,
      {
        logDestinationConfigs: [
          `arn:aws:logs:${Aws.REGION}:${Aws.ACCOUNT_ID}:log-group:${logGroup.logGroupName}`,
        ],
        resourceArn: webAcl.attrArn,
      },
    );
    loggingConfig.node.addDependency(webAcl);
    loggingConfig.node.addDependency(logGroup);

    (props?.targetArnList ?? []).forEach((targetArn, index) => {
      new wafv2.CfnWebACLAssociation(
        this,
        `WebACLAssociation-${props.scope}-${index}`,
        {
          resourceArn: targetArn,
          webAclArn: webAcl.attrArn,
        },
      );
    });
  }
}

import { Stack, type StackProps } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import { CommonWafSetting } from './utility-constructs/waf';

export class CloudFrontWafStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new CommonWafSetting(this, 'WAF for CloudFront', {
      scope: 'CLOUDFRONT',
    });
  }
}

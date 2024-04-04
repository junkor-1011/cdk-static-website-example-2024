import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { expect, test } from 'vitest';
import { CdkAppStack } from '../lib/cdk-app-stack';
import { CloudFrontWafStack } from '../lib/wafv2-cloudfront-stack';
import { ignoreAssetHashSerializer } from './plugins/ignore-asset-hash';

test('snapshot test', () => {
  expect.addSnapshotSerializer(ignoreAssetHashSerializer);

  const app = new cdk.App();
  const stack = new CdkAppStack(app, 'TestStack');
  const template = Template.fromStack(stack).toJSON();

  expect(template).toMatchSnapshot();

  const wafStack = new CloudFrontWafStack(new cdk.App(), 'TestWafStack', {
    env: { region: 'us-east-1' },
  });
  const wafTemplate = Template.fromStack(wafStack).toJSON();
  expect(wafTemplate).toMatchSnapshot();
});

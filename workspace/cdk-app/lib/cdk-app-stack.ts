import { Stack, type StackProps } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import { StaticWebsiteSystem } from './workloads/static-website.constructs';

export class CdkAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new StaticWebsiteSystem(this, 'StaticWebsiteSystem', {});
  }
}

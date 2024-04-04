import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chdir, cwd } from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  AssetHashType,
  Aws,
  type BundlingOptions,
  DockerImage,
  Duration,
  RemovalPolicy,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as cloudfront_origins,
  aws_s3 as s3,
  aws_s3_deployment as s3_deployment,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface StaticWebsiteSystemProps {
  readonly forceDockerBuildForWebsiteAsset?: boolean;
}

export class StaticWebsiteSystem extends Construct {
  constructor(scope: Construct, id: string, props?: StaticWebsiteSystemProps) {
    super(scope, id);

    const websiteBucket = new s3.Bucket(this, 'website-bucket', {
      bucketName: `website-bucket-${Aws.ACCOUNT_ID}-${Aws.REGION}`,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    new cloudfront.Distribution(this, 'distribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new cloudfront_origins.S3Origin(websiteBucket),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy:
          cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
      },
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: '/404.html',
          ttl: Duration.minutes(2),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 404,
          responsePagePath: '/404.html',
          ttl: Duration.minutes(2),
        },
      ],
      geoRestriction: cloudfront.GeoRestriction.allowlist('JP'),
      // webAclId: TODO
    });

    new s3_deployment.BucketDeployment(this, 'WebsiteDeploy', {
      destinationBucket: websiteBucket,
      sources: [
        s3_deployment.Source.asset(
          path.join(__dirname, '../../../..'), // workspace parent dir
          {
            assetHashType: AssetHashType.OUTPUT,
            bundling: {
              local: {
                tryBundle: (
                  outputDir: string,
                  _options: BundlingOptions,
                ): boolean => {
                  try {
                    const workingDir = cwd();
                    const workspaceRootDir = path.join(
                      __dirname,
                      '../../../..',
                    );
                    if (
                      !fs.existsSync(
                        path.join(workspaceRootDir, 'node_modules'),
                      )
                    ) {
                      chdir(workspaceRootDir);
                      const res = execSync('pnpm install');
                      console.log(res.toString());
                    }

                    const websiteProjectDir = path.join(
                      workspaceRootDir,
                      './workspace/static-website',
                    );
                    chdir(websiteProjectDir);
                    const commands = ['make'].join(' && ');
                    const res = execSync(commands);
                    console.log(res.toString());

                    fs.cpSync(path.join(websiteProjectDir, 'out'), outputDir, {
                      recursive: true,
                    });

                    chdir(workingDir);
                    return true;
                  } catch (err) {
                    console.warn('Failed to local build');
                    console.debug(err);
                    return false;
                  }
                },
              },
              image: props?.forceDockerBuildForWebsiteAsset
                ? DockerImage.fromBuild(
                    path.join(__dirname, '../../../static-website'),
                    {
                      file: 'build.Dockerfile',
                    },
                  )
                : DockerImage.fromRegistry('dummy'),
              command: [
                'bash',
                '-c',
                [
                  'cd workspace/static-website',
                  'make',
                  'cp -r out/* /asset-output/',
                ].join(' && '),
              ],
            },
          },
        ),
      ],
    });
  }
}

import 'source-map-support/register';

import { Logger } from '@aws-lambda-powertools/logger';
import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';

const serviceName = 'hello-world-get'; // TMP

const logger = new Logger({ serviceName });
const tracer = new Tracer({ serviceName });
const metrics = new Metrics({
  namespace: 'hello-world',
  serviceName,
});

export const lambdaHandler = async (
  _event: APIGatewayProxyEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> => {
  tracer.getSegment();

  metrics.addMetric('lambdaInvoke', MetricUnit.Count, 1);
  logger.info('lambda init');

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'hello world',
    }),
  } as const satisfies APIGatewayProxyResult;

  return response;
};

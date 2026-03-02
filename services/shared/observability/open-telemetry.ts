import { DiagConsoleLogger, DiagLogLevel, diag } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

export interface OpenTelemetryBootstrapOptions {
  serviceName: string;
  defaultMetricsPort: number;
}

function parseMetricsPort(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function startOpenTelemetry(options: OpenTelemetryBootstrapOptions): NodeSDK {
  if (process.env.OTEL_DEBUG === 'true') {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
  }

  const metricsPort = parseMetricsPort(process.env.OTEL_METRICS_PORT, options.defaultMetricsPort);
  const metricsEndpoint = process.env.OTEL_METRICS_ENDPOINT ?? '/metrics';
  const traceExporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
  });
  const metricReader = new PrometheusExporter({
    port: metricsPort,
    endpoint: metricsEndpoint
  });

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: options.serviceName
    }),
    traceExporter,
    metricReader,
    instrumentations: [getNodeAutoInstrumentations()]
  });

  sdk.start();
  return sdk;
}

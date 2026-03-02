import { TraceFlags, context, propagation, trace } from '@opentelemetry/api';
import { W3CTraceContextPropagator } from '@opentelemetry/core';

import {
  extractTraceContextFromHeaders,
  injectTraceContextToHeaders
} from './rmq-trace-context';

describe('RMQ trace context propagation', () => {
  const spanContext = {
    traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
    spanId: '00f067aa0ba902b7',
    traceFlags: TraceFlags.SAMPLED,
    isRemote: false
  };
  const activeContext = trace.setSpanContext(context.active(), spanContext);

  beforeAll(() => {
    propagation.setGlobalPropagator(new W3CTraceContextPropagator());
  });

  it('injects trace context into headers', () => {
    const headers = injectTraceContextToHeaders(activeContext);

    expect(headers.traceparent).toEqual(
      `00-${spanContext.traceId}-${spanContext.spanId}-0${spanContext.traceFlags}`
    );
  });

  it('extracts trace context from headers and keeps same trace id', () => {
    const headers = injectTraceContextToHeaders(activeContext);
    const extractedContext = extractTraceContextFromHeaders(headers);
    const extractedSpanContext = trace.getSpanContext(extractedContext);

    expect(extractedSpanContext?.traceId).toBe(spanContext.traceId);
    expect(extractedSpanContext?.spanId).toBe(spanContext.spanId);
  });
});

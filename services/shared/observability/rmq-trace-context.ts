import {
  ROOT_CONTEXT,
  type Context,
  propagation,
  type TextMapGetter,
  type TextMapSetter
} from '@opentelemetry/api';

type TraceCarrier = Record<string, unknown>;

const rmqSetter: TextMapSetter<TraceCarrier> = {
  set(carrier, key, value) {
    carrier[key] = value;
  }
};

const rmqGetter: TextMapGetter<TraceCarrier> = {
  keys(carrier) {
    return Object.keys(carrier);
  },
  get(carrier, key) {
    const value = carrier[key];
    if (value === undefined || value === null) {
      return undefined;
    }

    if (Array.isArray(value)) {
      return value.map(String);
    }

    return String(value);
  }
};

export function injectTraceContextToHeaders(parentContext: Context): TraceCarrier {
  const headers: TraceCarrier = {};
  propagation.inject(parentContext, headers, rmqSetter);
  return headers;
}

export function extractTraceContextFromHeaders(headers: TraceCarrier | undefined): Context {
  return propagation.extract(ROOT_CONTEXT, headers ?? {}, rmqGetter);
}

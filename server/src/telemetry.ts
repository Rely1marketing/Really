let trace: any;
try {
  trace = require('@opentelemetry/api').trace;
} catch {
  trace = {
    getTracer: () => ({
      startSpan: () => ({ end: () => {} })
    })
  };
}

export const tracer = trace.getTracer('really');

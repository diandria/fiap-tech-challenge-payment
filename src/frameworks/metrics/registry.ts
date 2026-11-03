import { Registry, collectDefaultMetrics } from '@prometheus-io/client';

export const registry = new Registry();

// Same label the other services use, so the dashboards' service selector
// finds this one too.
registry.setDefaultLabels({ service_name: 'payment-service' });

collectDefaultMetrics({ register: registry });

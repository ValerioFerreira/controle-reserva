const logs = [];

export function logEvent(action, entity, entityId, details = {}) {
  const event = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    action,
    entity,
    entityId,
    details,
  };
  logs.push(event);
  console.log(`[LOG] ${action} ${entity} ${entityId}`, details);
  return event;
}

export function getLogs() {
  return [...logs];
}
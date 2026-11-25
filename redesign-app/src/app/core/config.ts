/**
 * On a developer's PC (ng serve on localhost) the redesign talks to the local services: API v2 on port 8090 and the
 * AI service on 8091 (see LOCAL.md). Online (GitHub Pages) it talks to Render.
 */
const LOCAL = typeof location !== 'undefined' && ['localhost', '127.0.0.1'].includes(location.hostname);

/** API version 2 (backend-v2/, Spring Boot 4). On Render (free plan) it sleeps after 15 min without traffic and takes about a minute to wake up. */
export const API_ORIGIN = LOCAL ? 'http://localhost:8090' : 'https://smartclientmanagement-api-v2.onrender.com';
export const API = `${API_ORIGIN}/api/mng/v1`;

/** The CRM assistant, its own service (Spring AI + Gemini). It calls API v2 with the same JWT. */
export const AI_API = `${LOCAL ? 'http://localhost:8091' : 'https://smartclientmanagement-ai-service.onrender.com'}/api/v1`;

/** Role code created by the backend seed data. */
export const SUPER_ADMIN = 'ROLE_SUPER_ADMIN';

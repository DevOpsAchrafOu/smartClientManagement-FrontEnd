/** API version 2 (backend-v2/, Spring Boot 4) on Render (free plan: it sleeps after 15 min without traffic and takes about a minute to wake up). */
export const API_ORIGIN = 'https://smartclientmanagement-api-v2.onrender.com';
export const API = `${API_ORIGIN}/api/mng/v1`;

/** The CRM assistant, its own service (Spring AI + Gemini). It calls API v2 with the same JWT. */
export const AI_API = 'https://smartclientmanagement-ai-service.onrender.com/api/v1';

/** Role code created by the backend seed data. */
export const SUPER_ADMIN = 'ROLE_SUPER_ADMIN';

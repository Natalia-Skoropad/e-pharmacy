import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const readSource = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), 'src', relativePath), 'utf8');

const serviceSource = readSource('services/admin-employee-profile.service.ts');
const routeSource = readSource('routes/admin.routes.ts');
const controllerSource = readSource('controllers/admin-employee.controller.ts');

//===============================================================

test('admin self profile keeps owner-only identity policy on the backend', () => {
  assert.match(serviceSource, /authorization\.isPlatformOwner/);

  assert.match(
    serviceSource,
    /input\.name !== undefined \|\| input\.email !== undefined/
  );

  assert.match(
    serviceSource,
    /ADMIN_ACCESS_ERROR_CODES\.PLATFORM_OWNER_REQUIRED/
  );
});

//===============================================================

test('admin self profile uses optimistic revision protection and admin scope', () => {
  assert.match(serviceSource, /role: USER_ROLES\.ADMIN/);
  assert.match(serviceSource, /updatedAt: expectedRevision/);
  assert.match(serviceSource, /AUTH_ERROR_CODES\.PROFILE_CONFLICT/);
  assert.match(serviceSource, /AUTH_ERROR_CODES\.EMAIL_CONFLICT/);
});

//===============================================================

test('admin self profile update and AuditLog commit atomically with a safe snapshot', () => {
  assert.match(serviceSource, /mongoose\.startSession\(\)/);
  assert.match(serviceSource, /session\.withTransaction/);
  assert.match(serviceSource, /appendAdminAuditLog\(/);
  assert.match(serviceSource, /ADMIN_EMPLOYEE_PROFILE_UPDATED/);
  assert.match(serviceSource, /ADMIN_AUDIT_ENTITY_TYPES\.ADMIN_EMPLOYEE/);
  assert.match(serviceSource, /requestId: auditRequestId/);
  assert.match(serviceSource, /hasPicture = Boolean\(user\.pictureUrl\)/);

  assert.doesNotMatch(
    serviceSource,
    /before:\s*\{[^}]*pictureUrl|after:\s*\{[^}]*pictureUrl/
  );
});

//===============================================================

test('admin self profile route stays authenticated, validated, request-correlated and no-store', () => {
  assert.match(routeSource, /adminRoutes\.use\([\s\S]*authenticate/);
  assert.match(routeSource, /authorizeRoles\(USER_ROLES\.ADMIN\)/);
  assert.match(routeSource, /resolveAdminAuthorization/);
  assert.match(routeSource, /'\/employees\/me\/profile'/);
  assert.match(routeSource, /updateMyAdminEmployeeProfileSchema/);
  assert.match(routeSource, /updateMyAdminEmployeeProfile/);
  assert.match(controllerSource, /res\.locals\.requestId/);
  assert.match(controllerSource, /Cache-Control/);
  assert.match(controllerSource, /no-store/);
  assert.match(controllerSource, /data: \{ user \}/);
});

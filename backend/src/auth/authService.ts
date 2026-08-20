import { UserProfile, UserRole } from '../types.js';

export interface AuthContext {
  uid: string;
  email: string;
  role: UserRole;
  institutionId?: string;
}

export class AuthService {
  /**
   * Validates that the request has an authenticated user context.
   */
  static assertAuthenticated(auth?: AuthContext): AuthContext {
    if (!auth || !auth.uid) {
      throw new Error('UNAUTHENTICATED: Authentication required to perform this action.');
    }
    return auth;
  }

  /**
   * Enforces role-based authorization for specific allowed roles.
   */
  static assertRole(auth: AuthContext | undefined, allowedRoles: UserRole[]): AuthContext {
    const user = this.assertAuthenticated(auth);
    if (!allowedRoles.includes(user.role)) {
      throw new Error(
        `PERMISSION_DENIED: User role '${user.role}' is not authorized. Required: [${allowedRoles.join(', ')}]`
      );
    }
    return user;
  }

  /**
   * Enforces that an Institutional Issuer can ONLY operate on data belonging to their institution.
   */
  static assertInstitutionalAccess(auth: AuthContext | undefined, targetInstitutionId: string): AuthContext {
    const user = this.assertRole(auth, ['INSTITUTIONAL_ISSUER', 'SYSTEM_ADMIN']);
    if (user.role === 'INSTITUTIONAL_ISSUER' && user.institutionId !== targetInstitutionId) {
      throw new Error(
        `PERMISSION_DENIED: Institutional issuer '${user.uid}' cannot access records for institution '${targetInstitutionId}'.`
      );
    }
    return user;
  }

  /**
   * Enforces SYSTEM_ADMIN authorization.
   */
  static assertSystemAdmin(auth: AuthContext | undefined): AuthContext {
    return this.assertRole(auth, ['SYSTEM_ADMIN']);
  }
}

import { UserRole } from '@/types/settings'

/**
 * Check if a given role is an admin role
 */
export function isAdmin(role: UserRole | null | undefined): boolean {
  return role === 'admin'
}

/**
 * Check if a given role is a reseller role
 */
export function isReseller(role: UserRole | null | undefined): boolean {
  return role === 'reseller'
}

/**
 * Check if a given role has staff privileges (admin, support, sales)
 */
export function isStaff(role: UserRole | null | undefined): boolean {
  return role === 'admin' || role === 'support' || role === 'sales'
}

/**
 * Check if a given role is active (not inactive)
 */
export function isActiveRole(role: UserRole | null | undefined): boolean {
  return role !== null && role !== undefined && role !== 'inactive'
}

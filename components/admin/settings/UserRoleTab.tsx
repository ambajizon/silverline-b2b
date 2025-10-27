'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, X } from 'lucide-react'
import { Profile, UserRole } from '@/types/settings'
import { addUserSchema } from '@/lib/validations/settings'
import {
  updateProfileRole,
  bulkAssignRoles,
  deactivateProfiles,
  addProfileByEmail,
} from '@/app/(admin)/admin/settings/actions'

interface UserRoleTabProps {
  profiles: Profile[]
}

const roleColors: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-700',
  reseller: 'bg-blue-100 text-blue-700',
  support: 'bg-green-100 text-green-700',
  sales: 'bg-orange-100 text-orange-700',
  inactive: 'bg-slate-100 text-slate-700',
}

const roleOptions: UserRole[] = ['admin', 'reseller', 'support', 'sales']

export default function UserRoleTab({ profiles }: UserRoleTabProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [bulkRole, setBulkRole] = useState<UserRole>('reseller')

  const activeProfiles = profiles.filter((p) => p.role !== 'inactive')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      email: '',
      role: 'reseller' as 'admin' | 'reseller' | 'support' | 'sales',
    },
  })

  const handleSelectAll = () => {
    if (selected.length === activeProfiles.length) {
      setSelected([])
    } else {
      setSelected(activeProfiles.map((p) => p.id))
    }
  }

  const handleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleRoleChange = async (id: string, role: UserRole) => {
    const result = await updateProfileRole(id, role)
    if (result.ok) {
      toast.success('Role updated successfully')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return

    const result = await deactivateProfiles([id])
    if (result.ok) {
      toast.success('User deactivated successfully')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  const handleBulkAssign = async () => {
    if (selected.length === 0) {
      toast.error('Select at least one user')
      return
    }

    setLoading(true)
    const result = await bulkAssignRoles(selected, bulkRole)

    if (result.ok) {
      toast.success(`${selected.length} user(s) updated successfully`)
      setSelected([])
      router.refresh()
    } else {
      toast.error(result.error)
    }

    setLoading(false)
  }

  const handleBulkDelete = async () => {
    if (selected.length === 0) {
      toast.error('Select at least one user')
      return
    }

    if (!confirm(`Are you sure you want to deactivate ${selected.length} user(s)?`)) return

    setLoading(true)
    const result = await deactivateProfiles(selected)

    if (result.ok) {
      toast.success(`${selected.length} user(s) deactivated successfully`)
      setSelected([])
      router.refresh()
    } else {
      toast.error(result.error)
    }

    setLoading(false)
  }

  const onSubmitAdd = async (data: any) => {
    setLoading(true)
    const result = await addProfileByEmail(data.email, data.role)

    if (result.ok) {
      toast.success('User added successfully')
      setShowAddModal(false)
      reset()
      router.refresh()
    } else {
      toast.error(result.error)
    }

    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">User Role Management</h2>
          <p className="text-sm text-slate-600 mt-1">
            Administer user roles and permissions across the platform.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium flex items-center gap-2"
        >
          <span>+</span>
          Add New User
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="w-12 py-3 px-4">
                <input
                  type="checkbox"
                  checked={selected.length === activeProfiles.length && activeProfiles.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300"
                />
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-700 uppercase">User Name</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-700 uppercase">Email</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-700 uppercase">Role</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-700 uppercase">Permissions</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-slate-700 uppercase">Status</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-slate-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activeProfiles.map((profile) => (
              <tr key={profile.id} className="hover:bg-slate-50">
                <td className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selected.includes(profile.id)}
                    onChange={() => handleSelect(profile.id)}
                    className="rounded border-slate-300"
                  />
                </td>
                <td className="py-3 px-4 text-sm font-medium text-slate-900">
                  {profile.email.split('@')[0]}
                </td>
                <td className="py-3 px-4 text-sm text-slate-600">{profile.email}</td>
                <td className="py-3 px-4">
                  <select
                    value={profile.role}
                    onChange={(e) => handleRoleChange(profile.id, e.target.value as UserRole)}
                    className="text-sm border border-slate-300 rounded px-2 py-1"
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-3 px-4 text-sm text-slate-600">
                  View, Edit{profile.role === 'admin' && ', Delete, Create'}
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      roleColors[profile.role]
                    }`}
                  >
                    {profile.role === 'inactive' ? 'Inactive' : 'Active'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleRoleChange(profile.id, profile.role)}
                      className="p-1 hover:bg-slate-100 rounded"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4 text-slate-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(profile.id)}
                      className="p-1 hover:bg-red-100 rounded"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {activeProfiles.length === 0 && (
          <div className="p-12 text-center text-slate-500">No active users found</div>
        )}
      </div>

      {/* Bulk Actions Footer */}
      {selected.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-700">
            {selected.length} user{selected.length > 1 ? 's' : ''} selected
          </p>
          <div className="flex items-center gap-3">
            <select
              value={bulkRole}
              onChange={(e) => setBulkRole(e.target.value as UserRole)}
              className="text-sm border border-slate-300 rounded px-3 py-1.5"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
            <button
              onClick={handleBulkAssign}
              disabled={loading}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Assign Role
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={loading}
              className="px-4 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Add New User</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitAdd)} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('role')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {loading ? 'Adding...' : 'Add User'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import CreateTargetModal from './CreateTargetModal'

export default function CreateTargetButton() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
      >
        <Plus className="h-4 w-4" />
        Create New Target
      </button>

      {showModal && <CreateTargetModal onClose={() => setShowModal(false)} />}
    </>
  )
}

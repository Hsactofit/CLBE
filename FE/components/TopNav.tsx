'use client'

import { Input } from 'antd'
import { SearchOutlined, BellOutlined, MenuOutlined } from '@ant-design/icons'

interface TopNavProps {
  onMenuClick?: () => void
}

export default function TopNav({ onMenuClick }: TopNavProps) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left: Hamburger Menu + Search */}
        <div className="flex items-center space-x-4 flex-1">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MenuOutlined className="text-xl text-gray-600" />
          </button>

          <Input
            placeholder="Search projects, documents..."
            prefix={<SearchOutlined className="text-gray-400" />}
            className="max-w-md"
            size="large"
          />
        </div>

        {/* Right: Notifications + User Avatar */}
        <div className="flex items-center space-x-4">
          <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
            <BellOutlined className="text-xl text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            <span className="text-gray-600 font-medium text-sm">U</span>
          </div>
        </div>
      </div>
    </div>
  )
}

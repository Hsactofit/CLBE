import React from 'react'

interface ShimmerLoaderProps {
  lines?: number
  items?: number
}

export const ShimmerLoader = ({ lines = 2, items = 1 }: ShimmerLoaderProps) => (
  <div className="bg-white">
    {Array.from({ length: items }).map((_, index1) => (
      <div key={index1} className="w-full p-4 mb-4">
        {Array.from({ length: lines }).map((__, index2) => (
          <div
            key={index2}
            className={`h-4 w-${index2 + 1}/${lines} bg-gray-200 rounded animate-pulse mb-2`}
          ></div>
        ))}
      </div>
    ))}
  </div>
)

'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

interface DataPreviewProps {
  data: any
  fileType: 'excel' | 'json'
}

export default function DataPreview({ data, fileType }: DataPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const itemsPerPage = 20

  if (!data) return null

  const { headers, rows } = data

  // 搜索过滤
  const filteredRows = rows.filter((row: any) => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    
    if (Array.isArray(row)) {
      return row.some(cell => 
        cell && cell.toString().toLowerCase().includes(searchLower)
      )
    } else {
      return Object.values(row).some(value => 
        value && value.toString().toLowerCase().includes(searchLower)
      )
    }
  })

  const totalPages = Math.ceil(filteredRows.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedRows = filteredRows.slice(startIndex, startIndex + itemsPerPage)

  const renderCell = (value: any) => {
    if (value === null || value === undefined) return <span className="text-gray-400">-</span>
    if (typeof value === 'object') return <span className="text-blue-600">{JSON.stringify(value)}</span>
    if (typeof value === 'boolean') return <span className={value ? 'text-green-600' : 'text-red-600'}>{value.toString()}</span>
    if (typeof value === 'number') return <span className="text-purple-600">{value}</span>
    return <span className="text-gray-800">{value.toString()}</span>
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">数据预览</h3>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索数据..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="text-sm text-gray-600">
            显示 {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredRows.length)} 
            / 共 {filteredRows.length} 条
          </div>
        </div>
      </div>

      {/* 数据表格 */}
      <div className="overflow-auto max-h-96 border border-gray-200 rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                #
              </th>
              {headers.map((header: string, index: number) => (
                <th
                  key={index}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedRows.map((row: any, rowIndex: number) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-500 border-r">
                  {startIndex + rowIndex + 1}
                </td>
                {headers.map((header: string, colIndex: number) => (
                  <td key={colIndex} className="px-4 py-3 text-sm max-w-xs truncate">
                    {Array.isArray(row) ? renderCell(row[colIndex]) : renderCell(row[header])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页控件 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-600">
            第 {currentPage} 页，共 {totalPages} 页
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="flex items-center space-x-1 px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>上一页</span>
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 text-sm border rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center space-x-1 px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <span>下一页</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 
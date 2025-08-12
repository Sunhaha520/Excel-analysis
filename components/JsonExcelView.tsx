'use client'

import { useState, useMemo } from 'react'
import { Table, Download, Filter, ArrowUpDown } from 'lucide-react'

interface JsonExcelViewProps {
  data: any
  fileName: string
}

function JsonExcelView({ data, fileName }: JsonExcelViewProps) {
  const [sortColumn, setSortColumn] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [filterColumn, setFilterColumn] = useState<string>('')
  const [filterValue, setFilterValue] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  // 处理数据，确保能以表格形式显示
  const processedData = useMemo(() => {
    if (!data) return { headers: [], rows: [] }

    let headers: string[] = []
    let rows: any[][] = []

    if (Array.isArray(data)) {
      // 如果是数组，提取所有可能的键作为列头
      const allKeys = new Set<string>()
      data.forEach((item: any) => {
        if (typeof item === 'object' && item !== null) {
          Object.keys(item).forEach(key => allKeys.add(key))
        }
      })
      
      headers = Array.from(allKeys)
      rows = data.map((item: any) => {
        if (typeof item === 'object' && item !== null) {
          return headers.map(header => {
            const value = item[header]
            return value !== null && value !== undefined ? String(value) : ''
          })
        }
        return [String(item)]
      })
    } else if (typeof data === 'object' && data !== null) {
      // 如果是单个对象，扁平化显示
      const flattenObject = (obj: any, prefix = ''): any => {
        const flattened: any = {}
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            const newKey = prefix ? `${prefix}.${key}` : key
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
              Object.assign(flattened, flattenObject(obj[key], newKey))
            } else {
              flattened[newKey] = obj[key]
            }
          }
        }
        return flattened
      }

      const flatData = flattenObject(data)
      headers = Object.keys(flatData)
      rows = [Object.values(flatData).map(val => String(val))]
    }

    return { headers, rows }
  }, [data])

  // 过滤和排序数据
  const filteredAndSortedData = useMemo(() => {
    let result = [...processedData.rows]

    // 应用过滤
    if (filterColumn && filterValue) {
      const columnIndex = processedData.headers.indexOf(filterColumn)
      if (columnIndex !== -1) {
        result = result.filter(row => 
          row[columnIndex]?.toString().toLowerCase().includes(filterValue.toLowerCase())
        )
      }
    }

    // 应用排序
    if (sortColumn) {
      const columnIndex = processedData.headers.indexOf(sortColumn)
      if (columnIndex !== -1) {
        result.sort((a, b) => {
          const aVal = a[columnIndex] || ''
          const bVal = b[columnIndex] || ''
          
          // 尝试数字比较
          const aNum = parseFloat(aVal.toString())
          const bNum = parseFloat(bVal.toString())
          
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return sortDirection === 'asc' ? aNum - bNum : bNum - aNum
          }
          
          // 字符串比较
          const comparison = aVal.toString().localeCompare(bVal.toString())
          return sortDirection === 'asc' ? comparison : -comparison
        })
      }
    }

    return result
  }, [processedData, filterColumn, filterValue, sortColumn, sortDirection])

  // 分页数据
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAndSortedData.slice(startIndex, endIndex)
  }, [filteredAndSortedData, currentPage])

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage)

  // 处理列排序
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // 导出为CSV
  const exportToCSV = () => {
    const csvContent = [
      processedData.headers.join(','),
      ...filteredAndSortedData.map(row => 
        row.map(cell => `"${cell?.toString().replace(/"/g, '""') || ''}"`).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${fileName}_excel_view.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (!processedData.headers.length) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <Table className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>无法解析数据为表格格式</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Excel 表格视图</h3>
          <p className="text-sm text-gray-600 mt-1">
            {filteredAndSortedData.length} 行 × {processedData.headers.length} 列
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>导出 CSV</span>
        </button>
      </div>

      {/* 过滤和排序控件 */}
      <div className="flex flex-wrap gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterColumn}
            onChange={(e) => setFilterColumn(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="">选择过滤列</option>
            {processedData.headers.map(header => (
              <option key={header} value={header}>{header}</option>
            ))}
          </select>
          {filterColumn && (
            <input
              type="text"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              placeholder="输入过滤值"
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            />
          )}
        </div>

        <div className="flex items-center space-x-2">
          <ArrowUpDown className="w-4 h-4 text-gray-500" />
          <select
            value={sortColumn}
            onChange={(e) => setSortColumn(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="">选择排序列</option>
            {processedData.headers.map(header => (
              <option key={header} value={header}>{header}</option>
            ))}
          </select>
          {sortColumn && (
            <select
              value={sortDirection}
              onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="asc">升序</option>
              <option value="desc">降序</option>
            </select>
          )}
        </div>
      </div>

      {/* Excel 样式表格 */}
      <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            {/* 表头 */}
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                  行号
                </th>
                {processedData.headers.map((header, index) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300 cursor-pointer hover:bg-gray-200"
                    onClick={() => handleSort(header)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{header}</span>
                      {sortColumn === header && (
                        <span className="text-blue-500">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* 表体 */}
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200 bg-gray-50 font-medium">
                    {(currentPage - 1) * itemsPerPage + rowIndex + 1}
                  </td>
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200"
                      title={cell?.toString()}
                    >
                      <div className="max-w-xs truncate">
                        {cell?.toString() || '-'}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 分页控件 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">
            显示第 {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)} 条，
            共 {filteredAndSortedData.length} 条记录
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (currentPage <= 4) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = currentPage - 3 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm border rounded-md ${
                      currentPage === pageNum
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default JsonExcelView 
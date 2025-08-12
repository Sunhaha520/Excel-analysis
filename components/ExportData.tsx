'use client'

import { useState } from 'react'
import { Download, FileJson, FileSpreadsheet, FileText, Image } from 'lucide-react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

interface ExportDataProps {
  data: any
  fileName: string
  fileType: 'excel' | 'json'
}

export default function ExportData({ data, fileName, fileType }: ExportDataProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState('xlsx')

  const exportToExcel = () => {
    if (!data || !data.headers || !data.rows) return

    setIsExporting(true)
    
    try {
      const worksheet = XLSX.utils.aoa_to_sheet([data.headers, ...data.rows])
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')
      
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      
      saveAs(blob, `${fileName.replace(/\.[^/.]+$/, '')}-exported.xlsx`)
    } catch (error) {
      console.error('Export to Excel failed:', error)
      alert('导出Excel失败，请重试')
    }
    
    setIsExporting(false)
  }

  const exportToJSON = () => {
    if (!data || !data.headers || !data.rows) return

    setIsExporting(true)
    
    try {
      let jsonData
      
      if (fileType === 'excel') {
        // 将Excel数据转换为JSON对象数组
        jsonData = data.rows.map((row: any) => {
          const obj: any = {}
          data.headers.forEach((header: string, index: number) => {
            obj[header] = row[index]
          })
          return obj
        })
      } else {
        // 原本就是JSON数据
        jsonData = data.originalData || data.rows
      }
      
      const jsonString = JSON.stringify(jsonData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      
      saveAs(blob, `${fileName.replace(/\.[^/.]+$/, '')}-exported.json`)
    } catch (error) {
      console.error('Export to JSON failed:', error)
      alert('导出JSON失败，请重试')
    }
    
    setIsExporting(false)
  }

  const exportToCSV = () => {
    if (!data || !data.headers || !data.rows) return

    setIsExporting(true)
    
    try {
      const csvContent = [
        data.headers.join(','),
        ...data.rows.map((row: any) => {
          return row.map((cell: any) => {
            const cellStr = cell?.toString() || ''
            // 如果包含逗号、换行符或引号，需要用引号包围并转义内部引号
            if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
              return `"${cellStr.replace(/"/g, '""')}"`
            }
            return cellStr
          }).join(',')
        })
      ].join('\n')
      
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' })
      saveAs(blob, `${fileName.replace(/\.[^/.]+$/, '')}-exported.csv`)
    } catch (error) {
      console.error('Export to CSV failed:', error)
      alert('导出CSV失败，请重试')
    }
    
    setIsExporting(false)
  }

  const exportToTXT = () => {
    if (!data || !data.headers || !data.rows) return

    setIsExporting(true)
    
    try {
      const txtContent = [
        `文件名: ${fileName}`,
        `导出时间: ${new Date().toLocaleString()}`,
        `总行数: ${data.rows.length}`,
        `总列数: ${data.headers.length}`,
        '',
        '数据内容:',
        '='.repeat(50),
        '',
        data.headers.join('\t'),
        '-'.repeat(50),
        ...data.rows.map((row: any) => {
          return row.map((cell: any) => cell?.toString() || '').join('\t')
        })
      ].join('\n')
      
      const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' })
      saveAs(blob, `${fileName.replace(/\.[^/.]+$/, '')}-exported.txt`)
    } catch (error) {
      console.error('Export to TXT failed:', error)
      alert('导出TXT失败，请重试')
    }
    
    setIsExporting(false)
  }

  const exportFormats = [
    {
      id: 'xlsx',
      name: 'Excel (.xlsx)',
      description: '适合表格数据处理和分析',
      icon: FileSpreadsheet,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      export: exportToExcel
    },
    {
      id: 'json',
      name: 'JSON (.json)',
      description: '适合程序开发和API交互',
      icon: FileJson,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      export: exportToJSON
    },
    {
      id: 'csv',
      name: 'CSV (.csv)',
      description: '通用表格格式，兼容性好',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      export: exportToCSV
    },
    {
      id: 'txt',
      name: '文本 (.txt)',
      description: '纯文本格式，包含数据摘要',
      icon: FileText,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      export: exportToTXT
    }
  ]

  const getDataSummary = () => {
    if (!data) return null

    const summary = {
      totalRows: data.rows?.length || 0,
      totalColumns: data.headers?.length || 0,
      estimatedSize: estimateFileSize(),
      lastModified: new Date().toLocaleString()
    }

    return summary
  }

  const estimateFileSize = () => {
    if (!data || !data.rows) return '0 KB'

    // 粗略估算文件大小
    const totalCells = data.rows.length * data.headers.length
    const avgCellSize = 10 // 假设平均每个单元格10字符
    const estimatedBytes = totalCells * avgCellSize

    if (estimatedBytes < 1024) return `${estimatedBytes} B`
    if (estimatedBytes < 1024 * 1024) return `${(estimatedBytes / 1024).toFixed(1)} KB`
    return `${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const summary = getDataSummary()

  return (
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6">导出数据</h3>
      
      {/* 数据摘要 */}
      {summary && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">数据摘要</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{summary.totalRows.toLocaleString()}</p>
              <p className="text-sm text-gray-600">总行数</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{summary.totalColumns}</p>
              <p className="text-sm text-gray-600">总列数</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{summary.estimatedSize}</p>
              <p className="text-sm text-gray-600">预估大小</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-600">{fileType.toUpperCase()}</p>
              <p className="text-sm text-gray-600">原始格式</p>
            </div>
          </div>
        </div>
      )}

      {/* 导出格式选择 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exportFormats.map((format) => {
          const Icon = format.icon
          return (
            <div
              key={format.id}
              className={`border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-lg ${
                exportFormat === format.id
                  ? `${format.borderColor} ${format.bgColor}`
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => setExportFormat(format.id)}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${format.bgColor}`}>
                  <Icon className={`w-6 h-6 ${format.color}`} />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-800 mb-1">
                    {format.name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {format.description}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      format.export()
                    }}
                    disabled={isExporting}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      exportFormat === format.id
                        ? `bg-blue-500 text-white hover:bg-blue-600`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    <span>{isExporting ? '导出中...' : '导出'}</span>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 导出说明 */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">导出说明</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Excel格式保留所有数据类型和格式</li>
          <li>• JSON格式适合程序处理，保持数据结构</li>
          <li>• CSV格式通用性好，可被大多数软件打开</li>
          <li>• 文本格式包含数据摘要和统计信息</li>
        </ul>
      </div>
    </div>
  )
} 
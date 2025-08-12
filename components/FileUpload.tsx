'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import * as XLSX from 'xlsx'
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react'

interface FileUploadProps {
  onFileUpload: (data: any, fileName: string, fileType: 'excel') => void
}

export default function FileUpload({ onFileUpload }: FileUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processExcelFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        onFileUpload(jsonData, file.name, 'excel')
        setIsProcessing(false)
      } catch (err) {
        setError('Excel文件解析失败，请检查文件格式')
        setIsProcessing(false)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setIsProcessing(true)
    setError(null)

    const fileExtension = file.name.split('.').pop()?.toLowerCase()

    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      processExcelFile(file)
    } else {
      setError('不支持的文件格式，请上传 .xlsx 或 .xls 文件')
      setIsProcessing(false)
    }
  }, [onFileUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  })

  return (
    <div className="max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
          transition-all duration-300 bg-white/50 backdrop-blur-sm
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50/80 scale-105' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-white/70'
          }
          ${isProcessing ? 'pointer-events-none opacity-70' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-blue-100 rounded-full">
              <FileSpreadsheet className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          {isProcessing ? (
            <div className="space-y-3">
              <div className="animate-spin mx-auto w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <p className="text-lg font-medium text-gray-700">正在处理文件...</p>
            </div>
          ) : (
            <>
              {isDragActive ? (
                <div className="space-y-3">
                  <Upload className="w-12 h-12 text-blue-500 mx-auto animate-bounce" />
                  <p className="text-xl font-medium text-blue-600">释放文件开始分析</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-xl font-medium text-gray-700 mb-2">
                      拖拽文件到此处或点击上传
                    </p>
                    <p className="text-gray-500">
                      支持 Excel (.xlsx, .xls) 文件
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
          
          <div className="flex justify-center text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel 数据表格</span>
            </div>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
} 
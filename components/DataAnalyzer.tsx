'use client'

import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, Download, BarChart3, PieChart, TrendingUp, Cloud } from 'lucide-react'
import DataPreview from './DataPreview'
import DataStatistics from './DataStatistics'
import DataVisualization from './DataVisualization'
import SentimentAnalysis from './SentimentAnalysis'
import WordCloud from './WordCloudGenerator'
import ExportData from './ExportData'
import CorrelationAnalysis from './CorrelationAnalysis'

interface DataAnalyzerProps {
  data: any
  fileName: string
  fileType: 'excel'
  onReset: () => void
}

export default function DataAnalyzer({ data, fileName, fileType, onReset }: DataAnalyzerProps) {
  const [activeTab, setActiveTab] = useState('preview')
  const [processedData, setProcessedData] = useState<any>(null)

   // 辅助函数：扁平化对象
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

  // 数据预处理
  const processData = useMemo(() => {
    if (!data) return null

    if (fileType === 'excel') {
      // Excel数据处理
      if (Array.isArray(data) && data.length > 0) {
        const headers = data[0] as string[]
        const rows = data.slice(1)
        return {
          headers,
          rows,
          totalRows: rows.length,
          totalColumns: headers.length
        }
      }
    } else if (fileType === 'json') {
      // JSON数据处理
      if (Array.isArray(data)) {
        const headers = data.length > 0 ? Object.keys(data[0]) : []
        return {
          headers,
          rows: data,
          totalRows: data.length,
          totalColumns: headers.length
        }
      } else {
        // 单个对象或复杂结构
        const flatData = flattenObject(data)
        return {
          headers: Object.keys(flatData),
          rows: [Object.values(flatData)],
          totalRows: 1,
          totalColumns: Object.keys(flatData).length,
          originalData: data
        }
      }
    }
    return null
  }, [data, fileType])

  useEffect(() => {
    setProcessedData(processData)
  }, [processData])

  const tabs = [
    { id: 'preview', name: '数据预览', icon: BarChart3 },
    { id: 'statistics', name: '统计分析', icon: TrendingUp },
    { id: 'visualization', name: '数据可视化', icon: PieChart },
    { id: 'sentiment', name: '情感分析', icon: Cloud },
    { id: 'wordcloud', name: '词云生成', icon: Cloud },
    { id: 'correlation', name: '相关性分析', icon: TrendingUp },
    { id: 'export', name: '导出数据', icon: Download },
  ]

  if (!processedData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* 头部信息 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 mb-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onReset}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>返回上传</span>
            </button>
            <div className="border-l border-gray-300 pl-4">
              <h2 className="text-xl font-bold text-gray-800">{fileName}</h2>
              <p className="text-sm text-gray-600">
                {processedData.totalRows} 行 × {processedData.totalColumns} 列
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {fileType.toUpperCase()}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl mb-6 shadow-lg">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 px-6 py-4 whitespace-nowrap font-medium transition-all
                  ${activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50/50'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg">
        {activeTab === 'preview' && (
          <DataPreview data={processedData} fileType={fileType} />
        )}

        {activeTab === 'statistics' && (
          <DataStatistics data={processedData} fileType={fileType} />
        )}
        {activeTab === 'visualization' && (
          <DataVisualization data={processedData} fileType={fileType} />
        )}
        {activeTab === 'sentiment' && (
          <SentimentAnalysis data={processedData} fileType={fileType} />
        )}
        {activeTab === 'wordcloud' && (
          <WordCloud data={processedData} fileType={fileType} />
        )}
        {activeTab === 'correlation' && (
          <CorrelationAnalysis data={processedData} fileType={fileType} />
        )}
        {activeTab === 'export' && (
          <ExportData data={processedData} fileName={fileName} fileType={fileType} />
        )}
      </div>
    </div>
  )
} 
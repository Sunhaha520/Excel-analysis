'use client'

import { useState } from 'react'
import FileUpload from '@/components/FileUpload'
import DataAnalyzer from '@/components/DataAnalyzer'
import Header from '@/components/Header'

export default function Home() {
  const [uploadedData, setUploadedData] = useState<any>(null)
  const [fileName, setFileName] = useState<string>('')
  const [fileType, setFileType] = useState<'excel' | null>(null)

  const handleFileUpload = (data: any, name: string, type: 'excel') => {
    setUploadedData(data)
    setFileName(name)
    setFileType(type)
  }

  const handleReset = () => {
    setUploadedData(null)
    setFileName('')
    setFileType(null)
  }

  return (
    <main className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {!uploadedData ? (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6">
                专业Excel分析工具
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                强大的Excel文件分析平台，提供数据统计、可视化、情感分析、词云生成等专业功能
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="text-3xl mb-4">📊</div>
                  <h3 className="text-lg font-semibold mb-2">数据可视化</h3>
                  <p className="text-gray-600 text-sm">多种图表类型，直观展示数据趋势和分布</p>
                </div>
                
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="text-3xl mb-4">🎭</div>
                  <h3 className="text-lg font-semibold mb-2">情感分析</h3>
                  <p className="text-gray-600 text-sm">AI驱动的文本情感识别和分析</p>
                </div>
                
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="text-3xl mb-4">☁️</div>
                  <h3 className="text-lg font-semibold mb-2">词云生成</h3>
                  <p className="text-gray-600 text-sm">美观的词云图，突出关键词汇</p>
                </div>
              </div>
            </div>
            
            <FileUpload onFileUpload={handleFileUpload} />
          </div>
        ) : fileType && (
          <DataAnalyzer 
            data={uploadedData} 
            fileName={fileName} 
            fileType={fileType}
            onReset={handleReset}
          />
        )}
      </div>
    </main>
  )
} 
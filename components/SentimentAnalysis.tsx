'use client'

import { useState, useMemo, useEffect } from 'react'
import { Heart, Frown, Meh, Smile, TrendingUp, Brain } from 'lucide-react'

interface SentimentAnalysisProps {
  data: any
  fileType: 'excel' | 'json'
}

// 简单的情感分析函数（可以替换为更高级的API）
const analyzeSentiment = (text: string) => {
  const positiveWords = ['好', '棒', '优秀', '喜欢', '爱', '满意', '推荐', '完美', '很棒', '太好了', 'excellent', 'good', 'great', 'awesome', 'love', 'like', 'amazing', 'wonderful', 'perfect', 'fantastic']
  const negativeWords = ['坏', '差', '糟糕', '讨厌', '恨', '不满', '失望', '垃圾', '不好', '很差', 'bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disgusting', 'pathetic', 'disappointing']
  
  const words = text.toLowerCase().split(/\s+/)
  let score = 0
  
  words.forEach(word => {
    if (positiveWords.some(pw => word.includes(pw))) score += 1
    if (negativeWords.some(nw => word.includes(nw))) score -= 1
  })
  
  if (score > 0) return 'positive'
  if (score < 0) return 'negative'
  return 'neutral'
}

export default function SentimentAnalysis({ data, fileType }: SentimentAnalysisProps) {
  const [selectedColumn, setSelectedColumn] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const textColumns = useMemo(() => {
    if (!data || !data.headers) return []
    
    const { headers, rows } = data
    const textCols: string[] = []
    
    headers.forEach((header: string, index: number) => {
      const sampleValues = rows.slice(0, 10).map((row: any) => 
        Array.isArray(row) ? row[index] : row[header]
      ).filter((val: any) => val !== null && val !== undefined && val !== '')
      
      const textValues = sampleValues.filter((val: any) => {
        const str = val.toString()
        return isNaN(Number(str)) && str.length > 5 // 假设文本长度大于5
      })
      
      if (textValues.length > sampleValues.length * 0.5) {
        textCols.push(header)
      }
    })
    
    return textCols
  }, [data])

  const sentimentResults = useMemo(() => {
    if (!selectedColumn || !data) return null
    
    const { headers, rows } = data
    const columnIndex = headers.indexOf(selectedColumn)
    
    if (columnIndex === -1) return null
    
    const results = rows.map((row: any, index: number) => {
      const text = Array.isArray(row) ? row[columnIndex] : row[selectedColumn]
      if (!text || typeof text !== 'string') return null
      
      const sentiment = analyzeSentiment(text)
      return {
        index: index + 1,
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        fullText: text,
        sentiment
      }
    }).filter(Boolean)
    
    const summary = {
      total: results.length,
      positive: results.filter((r: any) => r?.sentiment === 'positive').length,
      negative: results.filter((r: any) => r?.sentiment === 'negative').length,
      neutral: results.filter((r: any) => r?.sentiment === 'neutral').length
    }
    
    return { results, summary }
  }, [selectedColumn, data])

  useEffect(() => {
    if (textColumns.length > 0 && !selectedColumn) {
      setSelectedColumn(textColumns[0])
    }
  }, [textColumns, selectedColumn])

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <Smile className="w-5 h-5 text-green-500" />
      case 'negative':
        return <Frown className="w-5 h-5 text-red-500" />
      default:
        return <Meh className="w-5 h-5 text-gray-500" />
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (textColumns.length === 0) {
    return (
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">情感分析</h3>
        <div className="text-center py-12">
          <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-600 mb-2">没有检测到文本列</h4>
          <p className="text-gray-500">情感分析需要包含文本内容的列</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6">情感分析</h3>
      
      {/* 列选择 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          选择要分析的文本列:
        </label>
        <select
          value={selectedColumn}
          onChange={(e) => setSelectedColumn(e.target.value)}
          className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {textColumns.map((column) => (
            <option key={column} value={column}>
              {column}
            </option>
          ))}
        </select>
      </div>

      {sentimentResults && (
        <>
          {/* 情感分布统计 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">总文本数</p>
                  <p className="text-2xl font-bold">{sentimentResults.summary.total}</p>
                </div>
                <Brain className="w-8 h-8 text-blue-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">正面情感</p>
                  <p className="text-2xl font-bold">{sentimentResults.summary.positive}</p>
                  <p className="text-green-100 text-xs">
                    {((sentimentResults.summary.positive / sentimentResults.summary.total) * 100).toFixed(1)}%
                  </p>
                </div>
                <Smile className="w-8 h-8 text-green-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">负面情感</p>
                  <p className="text-2xl font-bold">{sentimentResults.summary.negative}</p>
                  <p className="text-red-100 text-xs">
                    {((sentimentResults.summary.negative / sentimentResults.summary.total) * 100).toFixed(1)}%
                  </p>
                </div>
                <Frown className="w-8 h-8 text-red-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-100 text-sm">中性情感</p>
                  <p className="text-2xl font-bold">{sentimentResults.summary.neutral}</p>
                  <p className="text-gray-100 text-xs">
                    {((sentimentResults.summary.neutral / sentimentResults.summary.total) * 100).toFixed(1)}%
                  </p>
                </div>
                <Meh className="w-8 h-8 text-gray-200" />
              </div>
            </div>
          </div>

          {/* 详细结果 */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-4 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-800">详细分析结果</h4>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {sentimentResults.results.map((result: any, index: number) => (
                <div key={index} className="p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getSentimentIcon(result.sentiment)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm text-gray-500">#{result.index}</span>
                        <span className={`px-2 py-1 text-xs rounded-full border ${getSentimentColor(result.sentiment)}`}>
                          {result.sentiment === 'positive' ? '正面' : result.sentiment === 'negative' ? '负面' : '中性'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800" title={result.fullText}>
                        {result.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
} 
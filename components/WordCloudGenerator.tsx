'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Cloud, Download, RefreshCw, Palette } from 'lucide-react'

interface WordCloudGeneratorProps {
  data: any
  fileType: 'excel' | 'json'
}

export default function WordCloudGenerator({ data, fileType }: WordCloudGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedColumn, setSelectedColumn] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [colorScheme, setColorScheme] = useState('default')

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
        return isNaN(Number(str)) && str.length > 2
      })
      
      if (textValues.length > sampleValues.length * 0.5) {
        textCols.push(header)
      }
    })
    
    return textCols
  }, [data])

  const wordFrequency = useMemo(() => {
    if (!selectedColumn || !data) return []
    
    const { headers, rows } = data
    const columnIndex = headers.indexOf(selectedColumn)
    
    if (columnIndex === -1) return []
    
    const wordCount: { [key: string]: number } = {}
    const stopWords = new Set(['的', '了', '是', '在', '和', '有', '我', '你', '他', '她', '它', '我们', '你们', '他们', '这', '那', '不', '要', '也', 'the', 'is', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'until', 'while', 'as', 'if', 'because', 'since', 'unless', 'although', 'though', 'whether', 'than', 'that', 'this', 'these', 'those', 'all', 'any', 'each', 'every', 'some', 'many', 'few', 'most', 'other', 'another', 'such', 'only', 'own', 'same', 'so', 'more', 'very', 'can', 'will', 'just', 'should', 'now'])
    
    rows.forEach((row: any) => {
      const text = Array.isArray(row) ? row[columnIndex] : row[selectedColumn]
      if (!text || typeof text !== 'string') return
      
      // 简单的分词（中英文）
      const words = text.toLowerCase()
        .replace(/[^\u4e00-\u9fa5a-zA-Z\s]/g, ' ') // 保留中文、英文和空格
        .split(/\s+/)
        .filter(word => word.length > 1 && !stopWords.has(word))
      
      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1
      })
    })
    
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 100) // 取前100个词
      .map(([word, count]) => ({ text: word, value: count }))
  }, [selectedColumn, data])

  const colorSchemes = {
    default: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA726', '#AB47BC', '#66BB6A', '#FF7043', '#42A5F5'],
    blue: ['#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1E88E5', '#1976D2'],
    green: ['#E8F5E8', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#4CAF50', '#43A047', '#388E3C'],
    purple: ['#F3E5F5', '#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC', '#9C27B0', '#8E24AA', '#7B1FA2'],
    rainbow: ['#FF5722', '#FF9800', '#FFC107', '#8BC34A', '#4CAF50', '#00BCD4', '#03A9F4', '#3F51B5']
  }

  const generateWordCloud = () => {
    if (!canvasRef.current || wordFrequency.length === 0) return
    
    setIsGenerating(true)
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // 设置画布背景
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    const colors = colorSchemes[colorScheme as keyof typeof colorSchemes] || colorSchemes.default
    
    // 简单的词云布局算法
    const maxValue = Math.max(...wordFrequency.map(w => w.value))
    const words = wordFrequency.map((word, index) => {
      const fontSize = Math.max(12, Math.min(60, (word.value / maxValue) * 50 + 10))
      return {
        ...word,
        fontSize,
        color: colors[index % colors.length],
        x: 0,
        y: 0,
        width: 0,
        height: 0
      }
    })
    
    // 测量文字尺寸并定位
    words.forEach(word => {
      ctx.font = `${word.fontSize}px Arial`
      const metrics = ctx.measureText(word.text)
      word.width = metrics.width
      word.height = word.fontSize
      
      // 随机位置（简单实现）
      let attempts = 0
      let placed = false
      
      while (!placed && attempts < 50) {
        word.x = Math.random() * (canvas.width - word.width)
        word.y = Math.random() * (canvas.height - word.height) + word.height
        
        // 检查是否与其他词重叠（简化版）
        const overlaps = words.some(other => {
          if (other === word || other.x === 0) return false
          return !(word.x + word.width < other.x || 
                   other.x + other.width < word.x || 
                   word.y - word.height > other.y || 
                   other.y - other.height > word.y)
        })
        
        if (!overlaps) {
          placed = true
        }
        attempts++
      }
      
      // 如果找不到合适位置，就使用当前位置
      if (!placed) {
        word.x = Math.random() * (canvas.width - word.width)
        word.y = Math.random() * (canvas.height - word.height) + word.height
      }
    })
    
    // 绘制词云
    words.forEach(word => {
      ctx.font = `${word.fontSize}px Arial`
      ctx.fillStyle = word.color
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText(word.text, word.x, word.y)
    })
    
    setIsGenerating(false)
  }

  const downloadWordCloud = () => {
    if (!canvasRef.current) return
    
    const link = document.createElement('a')
    link.download = `wordcloud-${selectedColumn}.png`
    link.href = canvasRef.current.toDataURL()
    link.click()
  }

  useEffect(() => {
    if (textColumns.length > 0 && !selectedColumn) {
      setSelectedColumn(textColumns[0])
    }
  }, [textColumns, selectedColumn])

  useEffect(() => {
    if (selectedColumn && wordFrequency.length > 0) {
      const timer = setTimeout(() => {
        generateWordCloud()
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [selectedColumn, wordFrequency, colorScheme])

  if (textColumns.length === 0) {
    return (
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">词云生成</h3>
        <div className="text-center py-12">
          <Cloud className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-600 mb-2">没有检测到文本列</h4>
          <p className="text-gray-500">词云生成需要包含文本内容的列</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6">词云生成</h3>
      
      {/* 控制面板 */}
      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            选择文本列:
          </label>
          <select
            value={selectedColumn}
            onChange={(e) => setSelectedColumn(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {textColumns.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            颜色方案:
          </label>
          <select
            value={colorScheme}
            onChange={(e) => setColorScheme(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="default">默认</option>
            <option value="blue">蓝色</option>
            <option value="green">绿色</option>
            <option value="purple">紫色</option>
            <option value="rainbow">彩虹</option>
          </select>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={generateWordCloud}
            disabled={isGenerating || !selectedColumn}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>重新生成</span>
          </button>
          
          <button
            onClick={downloadWordCloud}
            disabled={!selectedColumn}
            className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>下载</span>
          </button>
        </div>
      </div>

      {/* 词频统计 */}
      {wordFrequency.length > 0 && (
        <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">词频统计 (前10)</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {wordFrequency.slice(0, 10).map((word, index) => (
              <div key={word.text} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700">{word.text}</span>
                <span className="text-sm text-gray-500">{word.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 词云画布 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-800">词云图</h4>
          {isGenerating && (
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="text-sm">生成中...</span>
            </div>
          )}
        </div>
        
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            className="border border-gray-300 rounded-lg shadow-sm"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
      </div>
    </div>
  )
} 
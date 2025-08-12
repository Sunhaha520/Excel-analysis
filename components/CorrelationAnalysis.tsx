'use client'

import { useMemo, useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Calculator } from 'lucide-react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

interface CorrelationAnalysisProps {
  data: any
  fileType: 'excel'
}

export default function CorrelationAnalysis({ data }: CorrelationAnalysisProps) {
  const { theme } = useTheme()
  const [selectedXColumn, setSelectedXColumn] = useState('')
  const [selectedYColumn, setSelectedYColumn] = useState('')

  const processedData = useMemo(() => {
    if (!data || !data.rows) return { numericColumns: [], correlationData: [], regressionData: null }

    const { headers, rows } = data
    const numericColumns: string[] = []

    // 识别数值列
    headers.forEach((header: string, index: number) => {
      const sampleValues = rows.slice(0, 20).map((row: any) => 
        Array.isArray(row) ? row[index] : row[header]
      ).filter((val: any) => val !== null && val !== undefined && val !== '')

      const numericValues = sampleValues.filter((val: any) => !isNaN(Number(val)) && val !== '')
      const isNumeric = numericValues.length > sampleValues.length * 0.8

      if (isNumeric) {
        numericColumns.push(header)
      }
    })

    // 计算相关性矩阵
    const correlationMatrix: { [key: string]: { [key: string]: number } } = {}
    
    numericColumns.forEach(col1 => {
      correlationMatrix[col1] = {}
      numericColumns.forEach(col2 => {
        const col1Index = headers.indexOf(col1)
        const col2Index = headers.indexOf(col2)
        
        const pairs = rows.map((row: any) => {
          const val1 = Array.isArray(row) ? row[col1Index] : row[col1]
          const val2 = Array.isArray(row) ? row[col2Index] : row[col2]
          return [Number(val1) || 0, Number(val2) || 0]
        }).filter(([v1, v2]: [number, number]) => !isNaN(v1) && !isNaN(v2))

        if (pairs.length > 1) {
          correlationMatrix[col1][col2] = calculateCorrelation(pairs)
        } else {
          correlationMatrix[col1][col2] = 0
        }
      })
    })

    // 生成相关性表格数据
    const correlationData = numericColumns.map(col1 => {
      const row: any = { column: col1 }
      numericColumns.forEach(col2 => {
        row[col2] = correlationMatrix[col1][col2]
      })
      return row
    })

    // 生成散点图数据
    let regressionData = null
    if (selectedXColumn && selectedYColumn && selectedXColumn !== selectedYColumn) {
      const xIndex = headers.indexOf(selectedXColumn)
      const yIndex = headers.indexOf(selectedYColumn)
      
      const scatterData = rows.map((row: any, index: number) => {
        const xVal = Array.isArray(row) ? row[xIndex] : row[selectedXColumn]
        const yVal = Array.isArray(row) ? row[yIndex] : row[selectedYColumn]
        return {
          x: Number(xVal) || 0,
          y: Number(yVal) || 0,
          index: index + 1
        }
      }).filter((point: any) => !isNaN(point.x) && !isNaN(point.y))

      if (scatterData.length > 1) {
        const correlation = correlationMatrix[selectedXColumn][selectedYColumn]
        
        regressionData = {
          scatterData,
          correlation,
          rSquared: correlation * correlation
        }
      }
    }

    function calculateCorrelation(pairs: number[][]): number {
      const n = pairs.length
      if (n < 2) return 0

      const sumX = pairs.reduce((sum, [x]) => sum + x, 0)
      const sumY = pairs.reduce((sum, [, y]) => sum + y, 0)
      const sumXY = pairs.reduce((sum, [x, y]) => sum + x * y, 0)
      const sumX2 = pairs.reduce((sum, [x]) => sum + x * x, 0)
      const sumY2 = pairs.reduce((sum, [, y]) => sum + y * y, 0)

      const numerator = n * sumXY - sumX * sumY
      const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

      return denominator === 0 ? 0 : numerator / denominator
    }

    return { numericColumns, correlationData, regressionData }
  }, [data, selectedXColumn, selectedYColumn])

  // 获取相关性强度描述
  const getCorrelationStrength = (correlation: number) => {
    const abs = Math.abs(correlation)
    if (abs >= 0.8) return { text: '强相关', color: 'text-red-600' }
    if (abs >= 0.5) return { text: '中等相关', color: 'text-orange-600' }
    if (abs >= 0.3) return { text: '弱相关', color: 'text-yellow-600' }
    return { text: '无相关', color: 'text-gray-600' }
  }

  // 获取相关性颜色
  const getCorrelationColor = (correlation: number) => {
    const abs = Math.abs(correlation)
    if (abs >= 0.8) return correlation > 0 ? 'bg-red-500' : 'bg-blue-500'
    if (abs >= 0.5) return correlation > 0 ? 'bg-red-400' : 'bg-blue-400'
    if (abs >= 0.3) return correlation > 0 ? 'bg-red-300' : 'bg-blue-300'
    return 'bg-gray-200'
  }

  const isDark = theme === 'dark'

  return (
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-6">相关性分析</h3>

      {processedData.numericColumns.length < 2 ? (
        <div className="text-center py-12">
          <Calculator className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            需要至少两个数值列才能进行相关性分析
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 变量选择器 */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-semibold mb-4 text-gray-800 dark:text-gray-200">散点图分析</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  X轴变量
                </label>
                <select
                  value={selectedXColumn}
                  onChange={(e) => setSelectedXColumn(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">选择X轴变量</option>
                  {processedData.numericColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Y轴变量
                </label>
                <select
                  value={selectedYColumn}
                  onChange={(e) => setSelectedYColumn(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">选择Y轴变量</option>
                  {processedData.numericColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 散点图 */}
          {processedData.regressionData && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <h5 className="font-medium mb-4 text-gray-800 dark:text-gray-200">
                    {selectedXColumn} vs {selectedYColumn}
                  </h5>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart data={processedData.regressionData.scatterData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#4B5563' : '#e5e7eb'} />
                      <XAxis 
                        dataKey="x" 
                        type="number"
                        tick={{ fill: isDark ? '#d1d5db' : '#374151' }}
                      />
                      <YAxis 
                        dataKey="y" 
                        type="number"
                        tick={{ fill: isDark ? '#d1d5db' : '#374151' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: isDark ? '#374151' : '#ffffff',
                          border: `1px solid ${isDark ? '#4B5563' : '#e5e7eb'}`,
                          borderRadius: '8px',
                          color: isDark ? '#f9fafb' : '#111827'
                        }}
                      />
                      <Scatter dataKey="y" fill="#8884d8" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h5 className="font-medium mb-4 text-gray-800 dark:text-gray-200">分析结果</h5>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <div className="text-sm text-gray-600 dark:text-gray-400">相关系数 (r)</div>
                      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        {processedData.regressionData.correlation.toFixed(4)}
                      </div>
                      <div className={`text-xs ${getCorrelationStrength(processedData.regressionData.correlation).color}`}>
                        {getCorrelationStrength(processedData.regressionData.correlation).text}
                      </div>
                    </div>
                    
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <div className="text-sm text-gray-600 dark:text-gray-400">决定系数 (R²)</div>
                      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        {processedData.regressionData.rSquared.toFixed(4)}
                      </div>
                      <div className="text-xs text-gray-500">
                        解释 {(processedData.regressionData.rSquared * 100).toFixed(1)}% 的变异
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 相关性矩阵 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
            <h5 className="font-medium mb-4 text-gray-800 dark:text-gray-200">相关性矩阵</h5>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      变量
                    </th>
                    {processedData.numericColumns.map(col => (
                      <th key={col} className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {processedData.correlationData.map((row, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {row.column}
                      </td>
                      {processedData.numericColumns.map(col => (
                        <td key={col} className="px-4 py-2 whitespace-nowrap text-center">
                          <div 
                            className={`inline-block px-2 py-1 rounded text-xs font-semibold text-white ${getCorrelationColor(row[col])}`}
                            title={`相关系数: ${row[col].toFixed(4)}`}
                          >
                            {row[col].toFixed(3)}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex items-center justify-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">正相关</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-gray-200 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">无相关</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">负相关</span>
              </div>
            </div>
          </div>

          {/* 说明 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h5 className="font-medium mb-2 text-blue-800 dark:text-blue-200">相关性分析说明</h5>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• <strong>强相关 (|r| &ge; 0.8)</strong>: 变量之间存在很强的线性关系</li>
              <li>• <strong>中等相关 (0.5 &le; |r| &lt; 0.8)</strong>: 变量之间存在中等程度的线性关系</li>
              <li>• <strong>弱相关 (0.3 &le; |r| &lt; 0.5)</strong>: 变量之间存在较弱的线性关系</li>
              <li>• <strong>无相关 (|r| &lt; 0.3)</strong>: 变量之间基本没有线性关系</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
} 